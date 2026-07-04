import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sampleCourses, crawlerSources } from "../web/sample-courses.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const generatedAt = new Date().toISOString();

const outputCoursesPath = path.join(__dirname, "staging_courses.json");
const outputSourcesPath = path.join(__dirname, "crawler_sources.json");
const outputPlanPath = path.join(__dirname, "crawl_plan.json");

const negativeKeywords = [
  "회로설계",
  "RTL",
  "analog design",
  "logic design",
  "PCB layout",
  "board design"
];

const defaultPositiveKeywords = [
  "advanced packaging",
  "package",
  "packaging",
  "test",
  "ATE",
  "SLT",
  "WLP",
  "fan-out",
  "PLP",
  "RDL",
  "bump",
  "DMI",
  "failure analysis",
  "yield",
  "reliability",
  "qualification",
  "metrology",
  "inspection",
  "패키징",
  "후공정",
  "테스트",
  "수율",
  "신뢰성",
  "결함분석",
  "측정",
  "장비"
];

function normalizeCourse(course) {
  return {
    ...course,
    status: inferStatus(course.period),
    sourceUrl: course.url,
    crawledFrom: "curated_postfab_seed_v3",
    updatedAt: generatedAt
  };
}

function inferStatus(period) {
  const text = String(period || "");
  if (/상시|반복|요청형|온라인|rolling|annual/i.test(text)) return "recurring";

  const match = text.match(/20\d{2}-\d{2}-\d{2}/);
  if (!match) return "reference";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const firstDate = new Date(`${match[0]}T00:00:00`);
  return firstDate >= today ? "upcoming" : "past-seed";
}

function buildCrawlPlan() {
  return {
    generatedAt,
    sourceTaxonomy: "../outputs/semiconductor_postfab_process_job_competency_matrix_v3_tsp.xlsx",
    trainingSeedWorkbook: "../outputs/semiconductor_postfab_training_event_crawler_seeds_v3_korean_education.xlsx",
    recommendationPolicy: {
      strongPositiveKeywords: defaultPositiveKeywords,
      negativeKeywords,
      note: "TSP총괄 사용자 기준으로 패키징/테스트/DMI/신뢰성/제조DX 관련 후보를 올리고 회로설계·PCB layout 중심 후보는 낮게 반영합니다."
    },
    sources: crawlerSources.map((source) => ({
      ...source,
      positiveKeywords: [...new Set([...(source.keywords || []), ...defaultPositiveKeywords])],
      negativeKeywords
    }))
  };
}

async function main() {
  const stagedCourses = sampleCourses.map(normalizeCourse);
  const crawlPlan = buildCrawlPlan();

  await fs.writeFile(outputCoursesPath, `${JSON.stringify(stagedCourses, null, 2)}\n`, "utf8");
  await fs.writeFile(outputSourcesPath, `${JSON.stringify(crawlerSources, null, 2)}\n`, "utf8");
  await fs.writeFile(outputPlanPath, `${JSON.stringify(crawlPlan, null, 2)}\n`, "utf8");

  console.log(`Staged ${stagedCourses.length} courses/events.`);
  console.log(`Wrote ${crawlerSources.length} crawler sources.`);
  console.log(`Updated ${path.relative(process.cwd(), outputCoursesPath)}`);
  console.log(`Updated ${path.relative(process.cwd(), outputSourcesPath)}`);
  console.log(`Updated ${path.relative(process.cwd(), outputPlanPath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
