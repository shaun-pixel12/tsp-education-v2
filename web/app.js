import { sampleCourses, crawlerSources } from "./sample-courses.js";
import { recommendCourses, roleNames } from "./ai-engine.js";

const STORAGE_PREFIX = "tsp-postfab-v3-20260704";
const STORAGE_COURSES = `${STORAGE_PREFIX}:courses`;
const STORAGE_BOOKMARKS = `${STORAGE_PREFIX}:bookmarks`;
const STORAGE_SITES = `${STORAGE_PREFIX}:sites`;
const STORAGE_REVIEWS = `${STORAGE_PREFIX}:reviews`;
const STORAGE_QNA = `${STORAGE_PREFIX}:qna`;

const trendTopics = [
  "WLP",
  "Fan-out",
  "PLP",
  "RDL",
  "ATE",
  "SLT",
  "DMI",
  "FA",
  "신뢰성",
  "HBM",
  "Hybrid Bonding",
  "제조DX"
];

const state = {
  courses: mergeCourses(sampleCourses, readStorage(STORAGE_COURSES, [])),
  bookmarks: new Set(readStorage(STORAGE_BOOKMARKS, [])),
  customSites: readStorage(STORAGE_SITES, []),
  reviews: readStorage(STORAGE_REVIEWS, [
    {
      courseId: "nnfc-advanced-packaging-2026-2",
      author: "공정기술 담당",
      rating: 5,
      text: "장기 실습형 과정이라 신규 공정 담당자에게 우선 검토할 만합니다.",
      date: "2026-07-04"
    }
  ]),
  qna: readStorage(STORAGE_QNA, [
    {
      title: "WLP/Fan-out 교육은 어떤 키워드로 찾는 게 좋을까요?",
      text: "WLP, Fan-out WLP, PLP, RDL, bump, wafer-level, panel-level을 함께 넣으면 누락이 줄어듭니다.",
      date: "2026-07-04"
    }
  ]),
  calendarDate: new Date(2026, 6, 1),
  calendarFilter: "전체",
  quickFinder: {
    open: false,
    step: 1,
    role: null,
    focus: null
  }
};

document.addEventListener("DOMContentLoaded", () => {
  setupNavigation();
  setupSidebar();
  setupHeroActions();
  setupFilters();
  setupStatCards();
  setupRecommender();
  setupCalendar();
  setupModal();
  setupQuickFinder();
  setupAdmin();
  setupSites();
  setupReviewsQna();
  setupKeyboard();
  renderAll();
});

function $(selector) {
  return document.querySelector(selector);
}

function $$(selector) {
  return [...document.querySelectorAll(selector)];
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function makeId(prefix) {
  if (crypto?.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function mergeCourses(baseCourses, extraCourses) {
  const byId = new Map(baseCourses.map((course) => [course.id, normalizeCourse(course)]));
  (extraCourses || []).forEach((course) => {
    if (course?.id) byId.set(course.id, normalizeCourse(course));
  });
  return [...byId.values()];
}

function normalizeCourse(course) {
  return {
    region: "국내",
    type: "교육",
    difficulty: "중급",
    topics: [],
    mappedProcesses: [],
    mappedJobs: [],
    priority: "P3",
    tspFit: "Medium",
    ...course
  };
}

function setupNavigation() {
  $$(".menu-item").forEach((item) => {
    item.addEventListener("click", () => {
      switchTab(item.dataset.tab);
      closeSidebarOnMobile();
    });
  });
}

function setupSidebar() {
  document.getElementById("btn-toggle-sidebar")?.addEventListener("click", () => {
    const sidebar = document.getElementById("sidebar");
    const backdrop = document.getElementById("sidebar-backdrop");

    if (window.matchMedia("(max-width: 1024px)").matches) {
      sidebar?.classList.toggle("active");
      backdrop?.classList.toggle("active");
    } else {
      sidebar?.classList.toggle("collapsed");
    }
  });

  document.getElementById("sidebar-backdrop")?.addEventListener("click", closeSidebarOnMobile);
}

function closeSidebarOnMobile() {
  if (!window.matchMedia("(max-width: 1024px)").matches) return;
  document.getElementById("sidebar")?.classList.remove("active");
  document.getElementById("sidebar-backdrop")?.classList.remove("active");
}

function setupHeroActions() {
  document.getElementById("btn-hero-cta")?.addEventListener("click", () => switchTab("ai-recommender"));
  document.getElementById("btn-quick-finder")?.addEventListener("click", openQuickFinder);
}

function switchTab(tabId) {
  if (!tabId) return;
  $$(".menu-item").forEach((item) => item.classList.toggle("active", item.dataset.tab === tabId));
  $$(".tab-content").forEach((tab) => tab.classList.toggle("active", tab.id === tabId));

  const active = $(`.menu-item[data-tab="${tabId}"]`);
  setText("page-title", active?.dataset.title || active?.textContent?.trim() || "홈");

  if (tabId === "calendar") renderCalendar();
  if (tabId === "explore") renderExplore();
}

function setupFilters() {
  document.getElementById("search-input")?.addEventListener("input", renderExplore);

  $$("#explore .btn-filter").forEach((button) => {
    button.addEventListener("click", () => {
      setActiveButton(button);
      renderExplore();
    });
  });
}

function setupStatCards() {
  $$(".stat-card").forEach((card) => {
    card.addEventListener("click", () => {
      switchTab("explore");
      resetExploreFilters();
      if (card.dataset.statRegion) activateFilter("region", card.dataset.statRegion);
      if (card.dataset.statType) activateFilter("type", card.dataset.statType);
      renderExplore();
    });
  });
}

function setActiveButton(button) {
  button.parentElement?.querySelectorAll(".btn-filter").forEach((peer) => peer.classList.remove("active"));
  button.classList.add("active");
}

function activateFilter(kind, value) {
  const button = document.querySelector(`#explore .btn-filter[data-${kind}="${value}"]`);
  if (button) setActiveButton(button);
}

function resetExploreFilters() {
  document.getElementById("search-input").value = "";
  ["region", "type", "level"].forEach((kind) => activateFilter(kind, "전체"));
}

function currentFilters() {
  return {
    query: normalize(document.getElementById("search-input")?.value),
    region: document.querySelector("#explore .btn-filter[data-region].active")?.dataset.region || "전체",
    type: document.querySelector("#explore .btn-filter[data-type].active")?.dataset.type || "전체",
    level: document.querySelector("#explore .btn-filter[data-level].active")?.dataset.level || "전체"
  };
}

function renderAll() {
  renderStats();
  renderDashboard();
  renderExplore();
  renderRecommenderOptions();
  renderCalendar();
  renderSites();
  renderReviewsQna();
  renderAdminPreview(state.courses.slice(0, 10));
}

function renderStats() {
  setText("stat-total-courses", state.courses.length);
  setText("stat-domestic-courses", state.courses.filter((course) => course.region === "국내").length);
  setText("stat-global-courses", state.courses.filter((course) => course.region === "해외").length);
  setText("stat-seminar-count", state.courses.filter((course) => course.type === "세미나/컨퍼런스").length);
}

function renderDashboard() {
  renderHomePlatformLinks();
  renderTrendTopics();
  renderCourseGrid("featured-courses-grid", state.courses.filter((course) => course.priority === "P1").slice(0, 6));
  renderCourseGrid("bookmark-courses-grid", state.courses.filter((course) => state.bookmarks.has(course.id)).slice(0, 4), {
    emptyText: "저장한 교육이 아직 없습니다."
  });
}

function renderHomePlatformLinks() {
  const grid = document.getElementById("home-platform-links-grid");
  if (!grid) return;

  grid.innerHTML = crawlerSources.slice(0, 8).map((source) => `
    <a class="platform-link-card" href="${source.url}" target="_blank" rel="noopener">
      <span class="platform-badge ${source.group.includes("국내") ? "badge-region-domestic" : "badge-region-global"}">${source.group.replace("국내 ", "").replace("글로벌 ", "")}</span>
      <div class="platform-info">
        <h4>${source.name}</h4>
        <p>${source.group}</p>
      </div>
      <svg class="arrow-icon" viewBox="0 0 24 24"><path d="M7 17 17 7M9 7h8v8"/></svg>
    </a>
  `).join("");
}

function renderTrendTopics() {
  const container = document.getElementById("trend-topics");
  if (!container) return;

  container.innerHTML = trendTopics.map((topic) => `<button class="trend-tag" type="button" data-topic="${topic}">${topic}</button>`).join("");
  container.querySelectorAll(".trend-tag").forEach((button) => {
    button.addEventListener("click", () => {
      switchTab("explore");
      resetExploreFilters();
      document.getElementById("search-input").value = button.dataset.topic;
      renderExplore();
    });
  });
}

function renderExplore() {
  const filters = currentFilters();
  const filtered = state.courses.filter((course) => {
    const text = courseSearchText(course);
    return (!filters.query || text.includes(filters.query))
      && (filters.region === "전체" || course.region === filters.region)
      && (filters.type === "전체" || course.type === filters.type)
      && (filters.level === "전체" || course.difficulty === filters.level);
  });

  setText("explore-count", `${filtered.length}개`);
  renderCourseGrid("courses-grid", filtered);
}

function courseSearchText(course) {
  return normalize([
    course.title,
    course.institution,
    course.region,
    course.type,
    course.period,
    course.difficulty,
    course.language,
    course.mode,
    course.description,
    ...(course.topics || []),
    ...(course.mappedProcesses || []),
    ...(course.mappedJobs || [])
  ].join(" "));
}

function renderCourseGrid(containerId, courses, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!courses.length) {
    container.innerHTML = `<div class="empty-state">${options.emptyText || "표시할 교육/행사가 없습니다."}</div>`;
    return;
  }

  container.innerHTML = "";
  courses.forEach((course) => container.appendChild(createCourseCard(course, options)));
}

function createCourseCard(course, options = {}) {
  const card = document.createElement("article");
  card.className = `course-card glass-card ${options.ai ? "ai-recommendation-card" : ""}`;
  card.dataset.courseId = course.id;

  const regionClass = course.region === "국내" ? "badge-region-domestic" : "badge-region-global";
  const typeClass = course.type === "교육" ? "badge-type-edu" : "badge-type-semi";
  const bookmarked = state.bookmarks.has(course.id);
  const topics = (course.topics || []).slice(0, 4);

  card.innerHTML = `
    <div>
      <div class="card-header">
        <div class="badge-container">
          <span class="badge ${regionClass}">${course.region}</span>
          <span class="badge ${typeClass}">${course.type}</span>
        </div>
        <button class="bookmark-btn ${bookmarked ? "active" : ""}" type="button" aria-label="저장">${bookmarked ? "★" : "☆"}</button>
      </div>
      <h3 class="course-title">${course.title}</h3>
      <div class="course-meta">
        <span class="meta-item">${course.institution}</span>
        <span class="meta-item">${course.period}</span>
        <span class="meta-item">${course.mode || course.language || "형태 확인 필요"}</span>
      </div>
      <p class="course-description">${course.description || ""}</p>
      <div class="course-topics">
        ${topics.map((topic) => `<span class="topic-tag">${topic}</span>`).join("")}
      </div>
      ${options.ai && course.reason ? `<div class="ai-reason-badge">${course.reason}</div>` : ""}
    </div>
    <div class="card-footer">
      <span class="course-fee">${course.difficulty}</span>
      <a class="btn-shortcut-link" href="${course.url}" target="_blank" rel="noopener" aria-label="원문 열기">↗</a>
    </div>
  `;

  card.addEventListener("click", () => openCourseDetail(course.id));
  card.querySelector(".bookmark-btn")?.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleBookmark(course.id);
  });
  card.querySelector(".btn-shortcut-link")?.addEventListener("click", (event) => event.stopPropagation());
  return card;
}

function toggleBookmark(courseId) {
  if (state.bookmarks.has(courseId)) {
    state.bookmarks.delete(courseId);
  } else {
    state.bookmarks.add(courseId);
  }

  writeStorage(STORAGE_BOOKMARKS, [...state.bookmarks]);
  renderDashboard();
  renderExplore();
}

function setupRecommender() {
  document.getElementById("recommender-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    runRecommendation();
  });
}

function renderRecommenderOptions() {
  const select = document.getElementById("recommender-role");
  if (select) {
    select.innerHTML = Object.entries(roleNames).map(([value, label]) => `<option value="${value}">${label}</option>`).join("");
  }

  const quickRoles = document.getElementById("quick-role-options");
  if (quickRoles) {
    quickRoles.innerHTML = Object.entries(roleNames).map(([value, label]) => `
      <button class="wizard-option-btn" type="button" data-role="${value}">${label}</button>
    `).join("");
  }
}

function runRecommendation() {
  const role = document.getElementById("recommender-role")?.value || "pkg_process";
  const keywords = document.getElementById("recommender-keywords")?.value || "";
  const regionPreference = document.querySelector('input[name="recommender-region"]:checked')?.value || "전체";
  const typePreference = document.querySelector('input[name="recommender-type"]:checked')?.value || "전체";

  const recommendations = recommendCourses(state.courses, {
    role,
    keywords,
    regionPreference,
    typePreference,
    limit: 9
  });

  setText("recommendation-count", `${recommendations.length}개 추천`);
  renderCourseGrid("recommendation-results", recommendations, {
    ai: true,
    emptyText: "조건에 맞는 추천 후보가 없습니다. 키워드를 조금 넓혀보세요."
  });
}

function setupCalendar() {
  document.getElementById("calendar-prev")?.addEventListener("click", () => {
    state.calendarDate.setMonth(state.calendarDate.getMonth() - 1);
    renderCalendar();
  });

  document.getElementById("calendar-next")?.addEventListener("click", () => {
    state.calendarDate.setMonth(state.calendarDate.getMonth() + 1);
    renderCalendar();
  });

  [
    ["cal-filter-all", "전체"],
    ["cal-filter-domestic", "국내"],
    ["cal-filter-global", "해외"]
  ].forEach(([id, value]) => {
    document.getElementById(id)?.addEventListener("click", () => {
      state.calendarFilter = value;
      renderCalendar();
    });
  });
}

function renderCalendar() {
  const grid = document.getElementById("calendar-grid");
  if (!grid) return;

  const year = state.calendarDate.getFullYear();
  const month = state.calendarDate.getMonth();
  setText("calendar-month-title", `${year}년 ${month + 1}월`);

  [
    ["cal-filter-all", "전체"],
    ["cal-filter-domestic", "국내"],
    ["cal-filter-global", "해외"]
  ].forEach(([id, value]) => {
    document.getElementById(id)?.classList.toggle("active", state.calendarFilter === value);
  });

  const firstDay = new Date(year, month, 1);
  const start = new Date(year, month, 1 - firstDay.getDay());
  const todayKey = toDateKey(new Date());
  const events = getCalendarEvents();

  const labels = ["일", "월", "화", "수", "목", "금", "토"]
    .map((label) => `<div class="calendar-day-label">${label}</div>`)
    .join("");

  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = toDateKey(date);
    const dayEvents = events.filter((event) => event.dateKey === key).slice(0, 3);
    const classes = [
      "calendar-day",
      date.getMonth() !== month ? "other-month" : "",
      key === todayKey ? "today" : ""
    ].filter(Boolean).join(" ");

    return `
      <div class="${classes}">
        <span class="calendar-date-number">${date.getDate()}</span>
        ${dayEvents.map((event) => `
          <button class="calendar-event ${event.course.type === "교육" ? "calendar-event-edu" : "calendar-event-semi"}" data-course-id="${event.course.id}">
            ${event.course.title}
          </button>
        `).join("")}
      </div>
    `;
  }).join("");

  grid.innerHTML = labels + days;
  grid.querySelectorAll(".calendar-event").forEach((button) => {
    button.addEventListener("click", () => openCourseDetail(button.dataset.courseId));
  });
}

function getCalendarEvents() {
  return state.courses
    .filter((course) => state.calendarFilter === "전체" || course.region === state.calendarFilter)
    .flatMap((course) => extractDates(course.period).map((date) => ({ course, dateKey: toDateKey(date) })));
}

function extractDates(period) {
  const matches = String(period || "").match(/20\d{2}-\d{2}-\d{2}/g) || [];
  return matches.slice(0, 2).map((value) => new Date(`${value}T00:00:00`)).filter((date) => !Number.isNaN(date.getTime()));
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function setupModal() {
  document.getElementById("modal-close")?.addEventListener("click", closeCourseDetail);
  document.getElementById("course-modal")?.addEventListener("click", (event) => {
    if (event.target.id === "course-modal") closeCourseDetail();
  });
  document.getElementById("modal-bookmark")?.addEventListener("click", () => {
    const id = document.getElementById("modal-bookmark")?.dataset.courseId;
    if (id) {
      toggleBookmark(id);
      openCourseDetail(id);
    }
  });
}

function openCourseDetail(courseId) {
  const course = state.courses.find((item) => item.id === courseId);
  if (!course) return;

  setText("modal-title", course.title);
  document.getElementById("modal-badges").innerHTML = `
    <span class="badge ${course.region === "국내" ? "badge-region-domestic" : "badge-region-global"}">${course.region}</span>
    <span class="badge ${course.type === "교육" ? "badge-type-edu" : "badge-type-semi"}">${course.type}</span>
  `;
  document.getElementById("modal-meta").innerHTML = `
    <p><strong>운영처</strong> ${course.institution}</p>
    <p><strong>일정</strong> ${course.period}</p>
    <p><strong>형태</strong> ${course.mode || "확인 필요"} / ${course.language || "확인 필요"}</p>
    <p><strong>추천 기준</strong> ${readableFit(course.tspFit)} · ${course.topics?.slice(0, 3).join(", ") || "후공정 역량 연계"}</p>
  `;
  setText("modal-description", course.description || "");
  document.getElementById("modal-topics").innerHTML = (course.topics || []).map((topic) => `<span class="topic-tag">${topic}</span>`).join("");

  const link = document.getElementById("modal-link");
  if (link) link.href = course.url;

  const bookmarkButton = document.getElementById("modal-bookmark");
  if (bookmarkButton) {
    bookmarkButton.dataset.courseId = course.id;
    bookmarkButton.textContent = state.bookmarks.has(course.id) ? "저장 해제" : "저장";
  }

  document.getElementById("course-modal")?.classList.add("active");
}

function closeCourseDetail() {
  document.getElementById("course-modal")?.classList.remove("active");
}

function setupQuickFinder() {
  document.getElementById("quick-close")?.addEventListener("click", closeQuickFinder);
  document.getElementById("quick-finder-modal")?.addEventListener("click", (event) => {
    if (event.target.id === "quick-finder-modal") closeQuickFinder();
  });
  document.getElementById("quick-prev")?.addEventListener("click", () => {
    if (state.quickFinder.step > 1) {
      state.quickFinder.step -= 1;
      renderQuickFinder();
    }
  });
  document.getElementById("quick-next")?.addEventListener("click", () => {
    if (state.quickFinder.step === 1 && !state.quickFinder.role) return;
    if (state.quickFinder.step === 2 && !state.quickFinder.focus) return;
    if (state.quickFinder.step < 3) {
      state.quickFinder.step += 1;
      renderQuickFinder();
    } else {
      closeQuickFinder();
    }
  });

  document.getElementById("quick-role-options")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-role]");
    if (!button) return;
    state.quickFinder.role = button.dataset.role;
    state.quickFinder.step = 2;
    renderQuickFinder();
  });

  document.getElementById("quick-step-focus")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-focus]");
    if (!button) return;
    state.quickFinder.focus = button.dataset.focus;
    state.quickFinder.step = 3;
    renderQuickFinder();
  });
}

function openQuickFinder() {
  state.quickFinder = { open: true, step: 1, role: null, focus: null };
  document.getElementById("quick-finder-modal")?.classList.add("active");
  renderQuickFinder();
}

function closeQuickFinder() {
  document.getElementById("quick-finder-modal")?.classList.remove("active");
}

function renderQuickFinder() {
  const step = state.quickFinder.step;
  ["role", "focus", "results"].forEach((name, index) => {
    document.getElementById(`quick-step-${name}`)?.classList.toggle("hidden", step !== index + 1);
  });

  setText("quick-step-label", step === 1 ? "1단계: 직무/역량 축 선택" : step === 2 ? "2단계: 관심 조건 선택" : "3단계: 추천 결과");
  document.getElementById("quick-prev").style.visibility = step === 1 ? "hidden" : "visible";
  document.getElementById("quick-next").textContent = step === 3 ? "닫기" : "다음";

  document.querySelectorAll("#quick-role-options .wizard-option-btn").forEach((button) => {
    button.classList.toggle("selected", button.dataset.role === state.quickFinder.role);
  });
  document.querySelectorAll("#quick-step-focus .wizard-option-btn").forEach((button) => {
    button.classList.toggle("selected", button.dataset.focus === state.quickFinder.focus);
  });

  if (step === 3) renderQuickFinderResults();
}

function renderQuickFinderResults() {
  const container = document.getElementById("quick-finder-results");
  if (!container) return;

  const options = quickFinderOptions();
  const results = recommendCourses(state.courses, {
    role: state.quickFinder.role || "pkg_process",
    keywords: options.keywords,
    regionPreference: options.regionPreference,
    typePreference: options.typePreference,
    limit: 5
  });

  if (!results.length) {
    container.innerHTML = `<div class="empty-state">조건에 맞는 후보가 없습니다.</div>`;
    return;
  }

  container.innerHTML = results.map((course) => `
    <button class="quick-finder-result-item" type="button" data-course-id="${course.id}">
      <div>
        <strong>${course.title}</strong>
        <span>${course.institution} · ${course.period}</span>
      </div>
      <span class="suitability-badge">${course.score}</span>
    </button>
  `).join("");

  container.querySelectorAll("[data-course-id]").forEach((button) => {
    button.addEventListener("click", () => {
      closeQuickFinder();
      openCourseDetail(button.dataset.courseId);
    });
  });
}

function quickFinderOptions() {
  const focus = state.quickFinder.focus || "";
  return {
    keywords: focus,
    regionPreference: focus.includes("국내") ? "국내" : "전체",
    typePreference: focus.includes("세미나") ? "세미나/컨퍼런스" : focus.includes("교육") ? "교육" : "전체"
  };
}

function setupAdmin() {
  const dropzone = document.getElementById("admin-dropzone");
  const fileInput = document.getElementById("admin-file-input");

  dropzone?.addEventListener("click", () => fileInput?.click());
  fileInput?.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (file) await loadAdminFile(file);
    fileInput.value = "";
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    dropzone?.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.add("drag-over");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropzone?.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.remove("drag-over");
    });
  });

  dropzone?.addEventListener("drop", async (event) => {
    const file = event.dataTransfer?.files?.[0];
    if (file) await loadAdminFile(file);
  });

  document.getElementById("admin-parse-btn")?.addEventListener("click", () => {
    parseAdminJson(document.getElementById("admin-json-input")?.value || "");
  });

  document.getElementById("admin-load-current-btn")?.addEventListener("click", () => {
    document.getElementById("admin-json-input").value = JSON.stringify(state.courses.map(publicCourseForAdmin), null, 2);
    setText("admin-status", "현재 목록을 편집창에 불러왔습니다.");
  });

  document.getElementById("admin-reset-btn")?.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_COURSES);
    state.courses = [...sampleCourses];
    setText("admin-status", "기본 seed 목록으로 되돌렸습니다.");
    renderAll();
    setupReviewsQna();
  });
}

async function loadAdminFile(file) {
  const text = await file.text();
  document.getElementById("admin-json-input").value = text;
  parseAdminJson(text, false);
}

function parseAdminJson(raw, apply = true) {
  if (!raw.trim()) {
    setText("admin-status", "JSON을 붙여넣거나 파일을 선택해 주세요.");
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    const candidates = Array.isArray(parsed) ? parsed : parsed.courses || [];
    const valid = candidates.filter((course) => course.id && course.title && course.url).map(normalizeCourse);

    renderAdminPreview(valid);
    if (apply) {
      state.courses = mergeCourses(state.courses, valid);
      writeStorage(STORAGE_COURSES, state.courses.filter((course) => !sampleCourses.some((base) => base.id === course.id)));
      renderAll();
      setupReviewsQna();
    }
    setText("admin-status", `${valid.length}개 후보를 ${apply ? "반영" : "미리보기"}했습니다.`);
  } catch (error) {
    setText("admin-status", `JSON 해석 실패: ${error.message}`);
  }
}

function renderAdminPreview(courses) {
  const container = document.getElementById("staging-preview");
  if (!container) return;

  if (!courses.length) {
    container.innerHTML = `<div class="staging-empty">미리볼 후보가 없습니다.</div>`;
    return;
  }

  container.innerHTML = `
    <table class="staging-table">
      <thead>
        <tr>
          <th>상태</th>
          <th>교육/행사</th>
          <th>운영처</th>
          <th>지역</th>
          <th>형태</th>
        </tr>
      </thead>
      <tbody>
        ${courses.slice(0, 30).map((course) => `
          <tr>
            <td><span class="badge-status badge-status-new">NEW</span></td>
            <td>${course.title}</td>
            <td>${course.institution || "-"}</td>
            <td>${course.region || "-"}</td>
            <td>${course.type || "-"}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function publicCourseForAdmin(course) {
  const {
    priority,
    tspFit,
    mappedProcesses,
    mappedJobs,
    scrapedAt,
    updatedAt,
    crawledFrom,
    sourceUrl,
    status,
    ...publicCourse
  } = course;
  return publicCourse;
}

function setupSites() {
  document.getElementById("site-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = document.getElementById("site-name")?.value.trim();
    const url = document.getElementById("site-url")?.value.trim();
    const category = document.getElementById("site-category")?.value.trim() || "사용자 추가";
    const notes = document.getElementById("site-notes")?.value.trim() || "";
    if (!name || !url) return;

    state.customSites.unshift({ id: makeId("site"), name, url, category, notes });
    writeStorage(STORAGE_SITES, state.customSites);
    event.target.reset();
    renderSites();
  });
}

function renderSites() {
  const defaultGrid = document.getElementById("default-sites-grid");
  if (defaultGrid) {
    defaultGrid.innerHTML = crawlerSources.map((source) => siteCard({
      name: source.name,
      url: source.url,
      category: source.group,
      notes: `키워드: ${(source.keywords || []).slice(0, 5).join(", ")}`
    })).join("");
  }

  const customGrid = document.getElementById("custom-sites-grid");
  if (customGrid) {
    customGrid.innerHTML = state.customSites.length
      ? state.customSites.map(siteCard).join("")
      : `<div class="empty-state">아직 추가한 사이트가 없습니다.</div>`;
  }
}

function siteCard(site) {
  return `
    <a class="site-card" href="${site.url}" target="_blank" rel="noopener">
      <span class="platform-badge badge-region-global">${site.category}</span>
      <h3>${site.name}</h3>
      <p>${site.notes || site.url}</p>
    </a>
  `;
}

function setupReviewsQna() {
  const reviewCourse = document.getElementById("review-course");
  if (reviewCourse) {
    const selected = reviewCourse.value;
    reviewCourse.innerHTML = state.courses.slice(0, 100).map((course) => `<option value="${course.id}">${course.title}</option>`).join("");
    if (selected) reviewCourse.value = selected;
  }

  const reviewForm = document.getElementById("review-form");
  if (reviewForm && !reviewForm.dataset.bound) {
    reviewForm.dataset.bound = "true";
    reviewForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const courseId = document.getElementById("review-course")?.value;
      const rating = Number(document.getElementById("review-rating")?.value || 5);
      const text = document.getElementById("review-text")?.value.trim();
      if (!courseId || !text) return;

      state.reviews.unshift({ courseId, author: "사용자", rating, text, date: toDateKey(new Date()) });
      writeStorage(STORAGE_REVIEWS, state.reviews);
      event.target.reset();
      renderReviewsQna();
    });
  }

  const qnaForm = document.getElementById("qna-form");
  if (qnaForm && !qnaForm.dataset.bound) {
    qnaForm.dataset.bound = "true";
    qnaForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const title = document.getElementById("qna-title")?.value.trim();
      const text = document.getElementById("qna-text")?.value.trim();
      if (!title || !text) return;

      state.qna.unshift({ title, text, date: toDateKey(new Date()) });
      writeStorage(STORAGE_QNA, state.qna);
      event.target.reset();
      renderReviewsQna();
    });
  }
}

function renderReviewsQna() {
  const reviewList = document.getElementById("review-list");
  if (reviewList) {
    reviewList.innerHTML = state.reviews.map((review) => {
      const course = state.courses.find((item) => item.id === review.courseId);
      return `
        <div class="review-item">
          <strong>${course?.title || "교육/행사"}</strong>
          <div class="rating-stars">${stars(review.rating || 5)}</div>
          <p>${review.text}</p>
          <small>${review.author} · ${review.date}</small>
        </div>
      `;
    }).join("");
  }

  const qnaList = document.getElementById("qna-list");
  if (qnaList) {
    qnaList.innerHTML = state.qna.map((item) => `
      <div class="qna-item">
        <strong>${item.title}</strong>
        <p>${item.text}</p>
        <small>${item.date}</small>
      </div>
    `).join("");
  }
}

function stars(rating) {
  const value = Math.max(1, Math.min(5, Number(rating) || 5));
  return "★".repeat(value) + "☆".repeat(5 - value);
}

function readableFit(value) {
  const labels = {
    "Very High": "매우 높은 적합도",
    High: "높은 적합도",
    "High/Reference": "참고 가치 높음",
    "Medium/High": "중상 수준 적합도",
    Medium: "기본 적합도",
    "Low/Medium": "키워드 확인 필요"
  };
  return labels[value] || "후공정 역량 연계";
}

function setupKeyboard() {
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    closeCourseDetail();
    closeQuickFinder();
    closeSidebarOnMobile();
  });
}

function normalize(value) {
  return String(value || "").toLowerCase().trim();
}
