export const roleProfiles = {
  onboarding: {
    label: "입문/공통 온보딩",
    reason: "전체 공정 흐름과 패키징 기초를 빠르게 잡는 과정",
    keywords: ["intro", "basic", "beginner", "foundation", "manufacturing basics", "onboarding", "기초", "입문", "제조공정"],
    processes: ["P01", "P02", "P03", "P23"],
    jobs: ["All", "J01", "J14"]
  },
  pkg_process: {
    label: "패키지 공정/Assembly",
    reason: "die attach, molding, underfill, ball attach 등 패키지 공정 역량과 직접 연결",
    keywords: ["packaging", "assembly", "die attach", "dicing", "backgrinding", "molding", "underfill", "ball attach", "flip chip", "공정", "패키징", "조립"],
    processes: ["P03", "P04", "P05", "P06", "P07", "P08", "P09", "P23"],
    jobs: ["J01", "J03", "J05", "J06", "J07", "J14"]
  },
  pnt_yield: {
    label: "P&T/수율/양산기술",
    reason: "공정 조건, 품질 변동, 수율 개선과 양산 안정화에 연결",
    keywords: ["process integration", "yield", "manufacturing", "process control", "production", "수율", "양산", "공정관리", "조건 최적화"],
    processes: ["P13", "P16", "P17", "P20", "P21", "P22"],
    jobs: ["J07", "J11", "J12", "J13"]
  },
  test: {
    label: "Test/ATE/SLT",
    reason: "ATE, SLT, handler/prober, test data와 직접 연결",
    keywords: ["test", "ate", "slt", "handler", "prober", "burn-in", "stdf", "ritdb", "tester", "테스트", "검사"],
    processes: ["P10", "P11", "P12", "P17", "P20", "P21", "P22"],
    jobs: ["J04", "J08", "J11", "J12", "J13"]
  },
  dmi: {
    label: "DMI/FA/불량분석",
    reason: "결함분석, failure analysis, 계측·검사, 수율 원인 분석 역량과 맞음",
    keywords: ["failure", "defect", "fa", "yield analysis", "metrology", "inspection", "x-ray", "acoustic", "fib", "thermography", "결함", "불량", "분석", "측정"],
    processes: ["P12", "P13", "P16", "P21", "P22"],
    jobs: ["J05", "J07", "J12", "J13"]
  },
  quality_reliability: {
    label: "품질/신뢰성/Qualification",
    reason: "package reliability, qualification, JEDEC 시험과 품질 판단 역량에 연결",
    keywords: ["reliability", "qualification", "jedec", "hast", "msl", "burn-in", "quality", "신뢰성", "품질", "인증"],
    processes: ["P12", "P13", "P21", "P23"],
    jobs: ["J05", "J06", "J12", "J13", "J14"]
  },
  wlp_fanout_plp: {
    label: "WLP/Fan-out/PLP",
    reason: "WLP, Fan-out, PLP, RDL, bump, wafer-level 공정과 직접 매핑",
    keywords: ["wlp", "fan-out", "fanout", "plp", "wlcsp", "rdl", "bump", "microbump", "tsv", "wafer-level", "panel-level", "웨이퍼레벨", "팬아웃"],
    processes: ["P05", "P06", "P07", "P08", "P10", "P13", "P14", "P15", "P23"],
    jobs: ["J01", "J04", "J05", "J06", "J07", "J14"]
  },
  equipment_dx: {
    label: "장비/자동화/제조DX",
    reason: "장비, 자동화, test floor data, smart manufacturing 역량과 연결",
    keywords: ["equipment", "automation", "smart manufacturing", "industry 4.0", "data", "plc", "traceability", "tester portal", "장비", "자동화", "데이터", "제조dx"],
    processes: ["P16", "P17", "P20", "P21", "P22"],
    jobs: ["J07", "J08", "J11", "J12", "J13"]
  },
  advanced_pkg: {
    label: "Advanced Packaging/HBM/Chiplet",
    reason: "advanced packaging, heterogeneous integration, chiplet, hybrid bonding 트렌드와 맞음",
    keywords: ["advanced packaging", "heterogeneous integration", "chiplet", "chiplets", "hbm", "3dic", "hybrid bonding", "interposer", "glass substrate", "tgv", "첨단패키징", "이종집적", "유리기판"],
    processes: ["P08", "P14", "P15", "P21", "P22", "P23"],
    jobs: ["J02", "J03", "J06", "J07", "J09", "J14"]
  }
};

export const roleNames = Object.fromEntries(
  Object.entries(roleProfiles).map(([key, profile]) => [key, profile.label])
);

const priorityBoost = {
  P1: 24,
  P2: 12,
  P3: 4,
  P4: -4
};

const fitBoost = {
  "Very High": 24,
  High: 16,
  "High/Reference": 12,
  "Medium/High": 10,
  Medium: 5,
  "Low/Medium": -2
};

const noiseKeywords = [
  "circuit design",
  "logic design",
  "analog design",
  "rtl",
  "front-end design",
  "pcb layout",
  "board design",
  "회로설계",
  "아날로그 설계",
  "디지털 설계"
];

function normalize(value) {
  return String(value || "").toLowerCase();
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function courseText(course) {
  return normalize([
    course.title,
    course.institution,
    course.region,
    course.type,
    course.period,
    course.difficulty,
    course.mode,
    course.language,
    course.description,
    ...(course.topics || []),
    ...(course.mappedProcesses || []),
    ...(course.mappedJobs || [])
  ].join(" "));
}

function splitKeywords(value) {
  if (Array.isArray(value)) {
    return unique(value.map((item) => String(item).trim()).filter(Boolean));
  }

  return unique(
    String(value || "")
      .split(/[,;\n]+/)
      .flatMap((chunk) => {
        const trimmed = chunk.trim();
        if (!trimmed) return [];
        const words = trimmed.split(/\s+/).filter((word) => word.length > 1);
        return trimmed.length > 12 ? [trimmed, ...words] : words.length > 1 ? [trimmed, ...words] : [trimmed];
      })
      .map((item) => item.trim())
      .filter(Boolean)
  );
}

function countMatches(text, keywords) {
  const matches = [];
  let score = 0;

  keywords.forEach((keyword) => {
    const normalized = normalize(keyword);
    if (!normalized) return;
    if (text.includes(normalized)) {
      matches.push(keyword);
      score += normalized.length >= 8 ? 12 : 8;
    }
  });

  return { score, matches: unique(matches) };
}

function countCodeMatches(course, profile) {
  const processText = normalize((course.mappedProcesses || []).join(" "));
  const jobText = normalize((course.mappedJobs || []).join(" "));
  let score = 0;

  (profile.processes || []).forEach((process) => {
    if (processText.includes(normalize(process))) score += 5;
  });

  (profile.jobs || []).forEach((job) => {
    if (jobText.includes(normalize(job))) score += 5;
  });

  return score;
}

function hasPostfabAnchor(text) {
  return [
    "packaging",
    "package",
    "test",
    "wlp",
    "fan-out",
    "fanout",
    "plp",
    "yield",
    "reliability",
    "assembly",
    "패키징",
    "테스트",
    "후공정",
    "수율",
    "신뢰성"
  ].some((keyword) => text.includes(keyword));
}

function scoreCourse(course, options) {
  const role = options.role || "pkg_process";
  const profile = roleProfiles[role] || roleProfiles.pkg_process;
  const text = courseText(course);
  const reasons = [];
  let score = 0;

  score += priorityBoost[course.priority] ?? 0;
  score += fitBoost[course.tspFit] ?? 0;

  const roleMatch = countMatches(text, profile.keywords);
  if (roleMatch.score > 0) {
    score += roleMatch.score;
    reasons.push(profile.reason);
  }

  const codeScore = countCodeMatches(course, profile);
  if (codeScore > 0) {
    score += codeScore;
  }

  const userKeywords = splitKeywords(options.keywords);
  const userMatch = countMatches(text, userKeywords);
  if (userMatch.score > 0) {
    score += userMatch.score * 2;
    reasons.push(`입력 키워드 일치: ${userMatch.matches.slice(0, 4).join(", ")}`);
  }

  if (options.regionPreference && options.regionPreference !== "전체" && course.region === options.regionPreference) {
    score += 12;
    reasons.push(`${options.regionPreference} 선호와 일치`);
  }

  if (options.typePreference && options.typePreference !== "전체" && course.type === options.typePreference) {
    score += 10;
    reasons.push(`${options.typePreference} 선호와 일치`);
  }

  const noiseHit = noiseKeywords.some((keyword) => text.includes(keyword));
  if (noiseHit && !hasPostfabAnchor(text)) {
    score -= 50;
    reasons.push("회로설계/PCB 중심 후보는 낮게 반영");
  }

  if (course.priority === "P1") reasons.push("크롤링 우선순위 P1");
  if (course.tspFit === "Very High") reasons.push("TSP 적합도 Very High");

  return {
    ...course,
    score,
    matchedKeywords: unique([...roleMatch.matches, ...userMatch.matches]),
    reason: unique(reasons).slice(0, 4).join(" · ") || "TSP 후공정 분류표와 기본 적합도가 높은 후보"
  };
}

export function recommendCourses(courses, optionsOrRole = {}) {
  const options = typeof optionsOrRole === "string"
    ? {
        role: optionsOrRole,
        keywords: arguments[2],
        regionPreference: arguments[3],
        typePreference: arguments[4]
      }
    : optionsOrRole;

  return [...courses]
    .map((course) => scoreCourse(course, options))
    .filter((course) => course.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "ko"))
    .slice(0, options.limit || 12);
}
