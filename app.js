/* ============================================================
   NURSING EXAM PREP — STUDENT HUB
   app.js — Client-side logic & API integration
   ============================================================ */

"use strict";

// ── Configuration ────────────────────────────────────────────
// TODO: Replace this URL with your actual live backend URL after deploying to Render/Railway
const LIVE_API_BASE = "https://nursing-exam-api.onrender.com/api"; 

const API_BASE = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ? "http://localhost:3001/api"
  : LIVE_API_BASE;

// ── Sample data (shown while API loads or if offline) ────────
const SAMPLE_CATEGORIES = [
  { name: "Adult Medical-Surgical Nursing", done: 284, total: 420, color: "#6C63FF" },
  { name: "Pharmacology",                  done: 97,  total: 180, color: "#00D4AA" },
  { name: "Pediatric Nursing",             done: 143, total: 200, color: "#F59E0B" },
  { name: "Psychiatric-Mental Health",     done: 62,  total: 150, color: "#EF4444" },
  { name: "Obstetric & Neonatal Nursing",  done: 88,  total: 120, color: "#10B981" },
];

const SAMPLE_ACTIVITY = [
  {
    status: "correct",
    question: "A nurse is caring for a client admitted with acute decompensated heart failure. Which assessment finding requires immediate intervention?",
    category: "Cardiovascular",
    difficulty: "Easy",
    time: "2 min ago",
  },
  {
    status: "wrong",
    question: "A client with ventricular tachycardia has a pulse but becomes hypotensive and confused. Which intervention should the nurse anticipate?",
    category: "Cardiovascular",
    difficulty: "Hard",
    time: "8 min ago",
  },
  {
    status: "correct",
    question: "Which statement by a client prescribed sublingual nitroglycerin indicates correct understanding of teaching?",
    category: "Pharmacology",
    difficulty: "Easy",
    time: "15 min ago",
  },
  {
    status: "skipped",
    question: "A client with infective endocarditis suddenly develops right-sided weakness and difficulty speaking. Which action is the nurse's priority?",
    category: "Cardiovascular",
    difficulty: "Hard",
    time: "32 min ago",
  },
  {
    status: "correct",
    question: "A nurse is teaching a client with hypertension about lifestyle modifications. Which statement by the client indicates understanding?",
    category: "Cardiovascular",
    difficulty: "Easy",
    time: "1 hr ago",
  },
];

const SAMPLE_SESSIONS = [
  { day: "Mon", date: 23, title: "Cardiovascular Review", sub: "25 questions · 45 min", type: "practice" },
  { day: "Wed", date: 25, title: "Mock Exam #3 — Full", sub: "75 questions · 2 hrs", type: "exam" },
  { day: "Fri", date: 27, title: "Pharmacology Weak Spots", sub: "20 questions · 30 min", type: "review" },
  { day: "Mon", date: 30, title: "Pediatric Nursing Intro", sub: "30 questions · 50 min", type: "practice" },
];

// ── Exam target date ──────────────────────────────────────────
const EXAM_DATE = new Date("2026-08-23T09:00:00");

// ============================================================
// INIT
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  setHeaderContent();
  renderCountdown();
  renderCategories();
  renderActivity();
  renderSessions();
  renderCalendar();
  wireNavigation();
  wireQuickActions();

  // Fire both API calls in parallel — neither blocks the other
  fetchUserStats();        // ← NEW: powers the 4 stat cards
  fetchCategoriesFromAPI();
});

// ============================================================
// HEADER
// ============================================================

function setHeaderContent() {
  const now = new Date();
  const hour = now.getHours();

  let greeting = "Good morning";
  if (hour >= 12 && hour < 17) greeting = "Good afternoon";
  else if (hour >= 17)          greeting = "Good evening";

  const el = document.getElementById("header-greeting");
  if (el) el.textContent = `${greeting}, Mukesh 👋`;

  const dateEl = document.getElementById("header-date");
  if (dateEl) {
    dateEl.textContent = now.toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
  }
}

// ============================================================
// COUNTDOWN
// ============================================================

function renderCountdown() {
  const el = document.getElementById("countdown-days");
  if (!el) return;

  const now = new Date();
  const diff = Math.ceil((EXAM_DATE - now) / (1000 * 60 * 60 * 24));
  el.textContent = diff > 0 ? diff : "Today!";

  // Update every minute
  setInterval(() => {
    const d = Math.ceil((EXAM_DATE - new Date()) / (1000 * 60 * 60 * 24));
    el.textContent = d > 0 ? d : "Today!";
  }, 60_000);
}

// ============================================================
// CATEGORY PROGRESS
// ============================================================

function renderCategories(categories = SAMPLE_CATEGORIES) {
  const container = document.getElementById("category-progress-list");
  if (!container) return;

  container.innerHTML = "";

  categories.forEach((cat) => {
    const pct = Math.round((cat.done / cat.total) * 100);
    const item = document.createElement("div");
    item.className = "progress-item";

    let pctColor = "var(--clr-danger)";
    if (pct >= 80) pctColor = "var(--clr-success)";
    else if (pct >= 60) pctColor = "var(--clr-accent)";
    else if (pct >= 40) pctColor = "var(--clr-warn)";

    item.innerHTML = `
      <div class="progress-item__top">
        <span class="progress-item__label">${escHtml(cat.name)}</span>
        <div class="progress-item__meta">
          <span class="progress-item__count">${cat.done}/${cat.total}</span>
          <span class="progress-item__pct" style="color:${pctColor}">${pct}%</span>
        </div>
      </div>
      <div class="progress-bar-track">
        <div
          class="progress-bar-fill"
          style="width:0; background:${cat.color};"
          data-target="${pct}"
          role="progressbar"
          aria-valuenow="${pct}"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="${cat.name} progress"
        ></div>
      </div>
    `;
    container.appendChild(item);
  });

  // Animate bars after a short delay so CSS transition triggers
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      container.querySelectorAll(".progress-bar-fill").forEach((bar) => {
        bar.style.width = bar.dataset.target + "%";
      });
    });
  });
}

// ============================================================
// ACTIVITY FEED
// ============================================================

function renderActivity(activities = SAMPLE_ACTIVITY) {
  const list = document.getElementById("activity-list");
  if (!list) return;

  list.innerHTML = "";

  activities.forEach((a) => {
    const li = document.createElement("li");
    li.className = "activity-item";
    li.setAttribute("role", "listitem");

    li.innerHTML = `
      <div class="activity-item__dot ${a.status}" aria-label="${a.status}" title="${a.status}"></div>
      <div class="activity-item__content">
        <div class="activity-item__question">${escHtml(a.question)}</div>
        <div class="activity-item__meta">
          <span class="activity-tag activity-tag--category">${escHtml(a.category)}</span>
          <span class="activity-tag activity-tag--difficulty">${escHtml(a.difficulty)}</span>
        </div>
      </div>
      <span class="activity-item__time">${escHtml(a.time)}</span>
    `;
    list.appendChild(li);
  });
}

// ============================================================
// SESSIONS LIST
// ============================================================

function renderSessions(sessions = SAMPLE_SESSIONS) {
  const container = document.getElementById("sessions-list");
  if (!container) return;

  container.innerHTML = "";

  sessions.forEach((s) => {
    const div = document.createElement("div");
    div.className = "session-item";
    div.setAttribute("role", "listitem");
    div.setAttribute("tabindex", "0");

    div.innerHTML = `
      <div class="session-item__time-block">
        <span class="session-item__time-day">${escHtml(s.day)}</span>
        <span class="session-item__time-num">${s.date}</span>
      </div>
      <div class="session-item__content">
        <div class="session-item__title">${escHtml(s.title)}</div>
        <div class="session-item__sub">${escHtml(s.sub)}</div>
      </div>
      <span class="session-item__badge session-item__badge--${s.type}">${capitalise(s.type)}</span>
    `;
    container.appendChild(div);
  });
}

// ============================================================
// CALENDAR
// ============================================================

let calYear, calMonth;

// Days on which the user has "studied" (relative to month)
const STUDIED_DAYS = [2, 5, 7, 9, 10, 11, 12, 14, 16, 17, 18, 19, 20, 21, 22];
// Days with scheduled exams
const EXAM_DAYS = [25];

function renderCalendar(year, month) {
  const now = new Date();

  if (year === undefined) { year = now.getFullYear(); calYear = year; }
  if (month === undefined) { month = now.getMonth();  calMonth = month; }

  calYear = year;
  calMonth = month;

  const label = document.getElementById("cal-month-label");
  if (label) {
    label.textContent = new Date(year, month, 1).toLocaleDateString("en-US", {
      month: "long", year: "numeric",
    });
  }

  const grid = document.getElementById("cal-grid");
  if (!grid) return;

  // Remove only day cells (keep the 7 header labels)
  const headers = grid.querySelectorAll(".calendar__day-label");
  grid.innerHTML = "";
  headers.forEach((h) => grid.appendChild(h));

  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const totalDays = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;

  // Empty leading cells
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("div");
    empty.className = "calendar__day calendar__day--empty";
    grid.appendChild(empty);
  }

  // Day cells
  for (let d = 1; d <= totalDays; d++) {
    const cell = document.createElement("div");
    cell.className = "calendar__day";
    cell.textContent = d;
    cell.setAttribute("role", "gridcell");
    cell.setAttribute("aria-label", `${d} ${label ? label.textContent : ""}`);
    cell.setAttribute("tabindex", "0");

    if (isCurrentMonth && d === today) {
      cell.classList.add("calendar__day--today");
      cell.setAttribute("aria-current", "date");
    } else if (STUDIED_DAYS.includes(d) && isCurrentMonth) {
      cell.classList.add("calendar__day--studied");
    }

    if (EXAM_DAYS.includes(d) && isCurrentMonth) {
      cell.classList.add("calendar__day--has-exam");
      cell.setAttribute("aria-label", `${d} — Exam scheduled`);
    }

    cell.addEventListener("click", () => onDayClick(d));
    cell.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onDayClick(d); }
    });

    grid.appendChild(cell);
  }
}

function onDayClick(day) {
  // Placeholder: in Phase 3 this will open a day detail modal
  console.log(`[Calendar] Day clicked: ${day} ${calMonth + 1} ${calYear}`);
}

// Calendar navigation
document.getElementById("cal-prev")?.addEventListener("click", () => {
  let m = calMonth - 1, y = calYear;
  if (m < 0) { m = 11; y--; }
  renderCalendar(y, m);
});

document.getElementById("cal-next")?.addEventListener("click", () => {
  let m = calMonth + 1, y = calYear;
  if (m > 11) { m = 0; y++; }
  renderCalendar(y, m);
});

// ============================================================
// NAVIGATION
// ============================================================

function wireNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      navItems.forEach((n) => {
        n.classList.remove("active");
        n.removeAttribute("aria-current");
      });
      item.classList.add("active");
      item.setAttribute("aria-current", "page");

      // In Phase 3 this will drive actual route changes
      const label = item.querySelector(".nav-item__label")?.textContent.trim();
      console.log(`[Nav] Navigated to: ${label}`);
    });
  });
}

// ============================================================
// QUICK ACTIONS
// ============================================================

function wireQuickActions() {
  const actions = {
    "qaction-timed":   () => startSession({ mode: "timed",  limit: 25, shuffle: true }),
    "qaction-weak":    () => startSession({ mode: "weak",   limit: 20, shuffle: true }),
    "qaction-random":  () => startSession({ mode: "random", limit: 30, shuffle: true }),
    "qaction-cardio":  () => startSession({ mode: "category", category: "Adult Medical-Surgical Nursing", limit: 25, shuffle: true }),
    "qaction-pharm":   () => startSession({ mode: "category", category: "Pharmacology",                  limit: 25, shuffle: true }),
    "qaction-sata":    () => startSession({ mode: "sata",   limit: 20, shuffle: true }),
  };

  Object.entries(actions).forEach(([id, fn]) => {
    document.getElementById(id)?.addEventListener("click", fn);
  });

  document.getElementById("btn-start-practice")?.addEventListener("click", () => {
    startSession({ mode: "random", limit: 25, shuffle: true });
  });

  document.getElementById("btn-study-plan")?.addEventListener("click", () => {
    console.log("[Action] View study plan clicked");
    // Phase 3: navigate to study plan view
  });
}

function startSession(opts) {
  // Phase 3: this will navigate to the question session view
  console.log("[Session] Starting session with options:", opts);
  alert(`Starting ${opts.mode} session (${opts.limit} questions)...\n\nQuestion session view coming in Phase 3!`);
}

// ============================================================
// API INTEGRATION
// ============================================================

// ── Stat Cards — live data ────────────────────────────────────

/**
 * Fetches GET /api/user-stats and animates all 4 stat card values.
 * Falls back gracefully (no UI change) when the API is unreachable.
 */
async function fetchUserStats() {
  try {
    const res = await fetch(`${API_BASE}/user-stats`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const stats = await res.json();

    // ── 1. Questions Answered ──────────────────────────────────
    animateStatCard(
      "stat-total-questions",
      stats.total_questions_answered,
      { format: (v) => v.toLocaleString() }
    );

    // ── 2. Overall Accuracy ────────────────────────────────────
    animateStatCard(
      "stat-accuracy",
      stats.overall_accuracy_pct,
      { suffix: "%" }
    );
    // Accuracy delta badge
    updateDeltaBadge(
      "stat-accuracy",
      stats.accuracy_delta,
      { suffix: "pp" }
    );

    // ── 3. Daily Streak ────────────────────────────────────────
    animateStatCard(
      "stat-streak",
      stats.current_daily_streak,
      { suffix: "" }
    );
    // Also sync the sidebar streak counter
    const sidebarStreak = document.getElementById("streak-count");
    if (sidebarStreak) sidebarStreak.textContent = stats.current_daily_streak;

    // ── 4. Exam Readiness ──────────────────────────────────────
    animateStatCard(
      "stat-readiness",
      stats.nclex_readiness_score,
      { suffix: "%" }
    );

    // ── Premium Activation UI Sync ─────────────────────────────
    const upgradeBtn = document.getElementById("btn-open-upgrade");
    if (upgradeBtn) {
      if (stats.is_premium) {
        upgradeBtn.innerHTML = `<span>👑</span> Premium Active`;
        upgradeBtn.style.pointerEvents = "none";
        upgradeBtn.style.background = "linear-gradient(135deg, var(--clr-warn), var(--clr-success))";
        upgradeBtn.style.color = "#fff";
        upgradeBtn.style.borderColor = "transparent";
        upgradeBtn.style.boxShadow = "0 4px 15px rgba(245, 158, 11, 0.4)";
      } else {
        upgradeBtn.innerHTML = `<span>👑</span> Upgrade to Premium <span class="btn-arrow">▶</span>`;
        upgradeBtn.style.pointerEvents = "";
        upgradeBtn.style.background = "";
        upgradeBtn.style.color = "";
        upgradeBtn.style.borderColor = "";
        upgradeBtn.style.boxShadow = "";
      }
    }

    console.log("[API] User stats loaded:", stats);
  } catch (err) {
    // Backend unreachable — static HTML fallback values remain visible
    console.info(
      "[API] /user-stats unreachable — showing static fallback values.",
      err.message
    );
  }
}

/**
 * Smoothly counts a stat card element from 0 to `targetValue`.
 *
 * @param {string} elementId   - ID of the element whose textContent to animate
 * @param {number} targetValue - Final numeric value to animate toward
 * @param {object} opts
 * @param {string}   [opts.suffix=""]    - Text appended after the number (e.g. "%")
 * @param {function} [opts.format]       - Custom formatter; overrides suffix
 * @param {number}   [opts.duration=900] - Animation duration in ms
 */
function animateStatCard(elementId, targetValue, opts = {}) {
  const el = document.getElementById(elementId);
  if (!el || typeof targetValue !== "number" || isNaN(targetValue)) return;

  const suffix   = opts.suffix   ?? "";
  const format   = opts.format   ?? ((v) => `${Math.round(v)}${suffix}`);
  const duration = opts.duration ?? 900;

  const startValue = 0;
  const startTime  = performance.now();

  // Ease-out cubic
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function tick(now) {
    const elapsed  = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const current  = startValue + (targetValue - startValue) * easeOut(progress);
    el.textContent = format(current);
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

/**
 * Updates the delta badge (▲/▼ chip) inside a stat card.
 * Finds the .stat-card__delta sibling within the card that contains `elementId`.
 *
 * @param {string}      elementId - The stat value element ID (used to locate the card)
 * @param {number|null} delta     - Signed numeric delta; null means hide the badge
 * @param {object}      opts
 * @param {string}      [opts.suffix="%"] - Unit shown after the absolute value
 */
function updateDeltaBadge(elementId, delta, opts = {}) {
  const el = document.getElementById(elementId);
  if (!el || delta === null || delta === undefined) return;

  const card  = el.closest(".stat-card");
  if (!card) return;

  const badge = card.querySelector(".stat-card__delta");
  if (!badge) return;

  const suffix = opts.suffix ?? "%";
  const abs    = Math.abs(delta);
  const sign   = delta >= 0 ? "+" : "-";

  badge.textContent = `${sign}${abs}${suffix}`;
  badge.className   = `stat-card__delta ${delta >= 0 ? "up" : "down"}`;
  badge.setAttribute("aria-label",
    `${delta >= 0 ? "Up" : "Down"} ${abs}${suffix} from last week`
  );
}

// ── Categories — live data ────────────────────────────────────

async function fetchCategoriesFromAPI() {
  try {
    const res = await fetch(`${API_BASE}/categories`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // Map API categories to display format (use sample counts for now)
    const colors = ["#6C63FF","#00D4AA","#F59E0B","#EF4444","#10B981","#3B82F6","#8B5CF6"];
    const enriched = data.categories.map((name, i) => ({
      name,
      done:  Math.floor(Math.random() * 150) + 20,
      total: Math.floor(Math.random() * 150) + 100,
      color: colors[i % colors.length],
    }));

    renderCategories(enriched);
    console.log(`[API] Loaded ${data.count} categories from server.`);
  } catch (err) {
    // API unreachable — sample data already rendered; log silently
    console.info("[API] Backend not reachable — showing sample data. Start the server with: npm start");
  }
}

// ============================================================
// UTILITIES
// ============================================================

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function capitalise(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============================================================
// PREMIUM UPGRADE MODAL
// ============================================================

// ── Wallet catalogue ─────────────────────────────────────────
const WALLETS = {
  easypaisa: {
    label      : "Easypaisa",
    number     : "0311-2345678",
    accountName: "NursePrep Payments",
    icon       : "💚",
    iconBg     : "rgba(0,180,80,0.15)",
    sendTag    : "Send {PRICE} to this Easypaisa number",
  },
  jazzcash: {
    label      : "JazzCash",
    number     : "0301-9876543",
    accountName: "NursePrep Education",
    icon       : "🔴",
    iconBg     : "rgba(220,0,0,0.12)",
    sendTag    : "Send {PRICE} to this JazzCash number",
  },
  upay: {
    label      : "uPay (UBL)",
    number     : "0322-1357924",
    accountName: "NursePrep Services",
    icon       : "🔵",
    iconBg     : "rgba(0,80,220,0.12)",
    sendTag    : "Send {PRICE} to this uPay number",
  },
};

// ── Plan prices ──────────────────────────────────────────────
const PLAN_PRICES = {
  monthly  : { label: "Monthly",   price: "PKR 1,999",  ref: "MONTHLY-1999"   },
  quarterly: { label: "Quarterly", price: "PKR 4,999",  ref: "QUARTERLY-4999" },
  annual   : { label: "Annual",    price: "PKR 14,999", ref: "ANNUAL-14999"   },
};

// ── State ────────────────────────────────────────────────────
let modalState = {
  selectedPlan  : "quarterly",
  selectedWallet: "easypaisa",
  activeMethod  : "wallet",   // "wallet" | "bank"
  receiptFile   : null,
};

// ── Init modal on DOMContentLoaded ───────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  wireUpgradeModal();
});

function wireUpgradeModal() {
  // Open trigger
  document.getElementById("btn-open-upgrade")?.addEventListener("click", openUpgradeModal);

  // Close triggers
  document.getElementById("upgrade-close-btn")?.addEventListener("click", closeUpgradeModal);
  document.getElementById("upgrade-overlay")?.addEventListener("click", (e) => {
    if (e.target === document.getElementById("upgrade-overlay")) closeUpgradeModal();
  });
  document.getElementById("upgrade-success-close")?.addEventListener("click", closeUpgradeModal);

  // Plan cards
  document.querySelectorAll(".plan-card").forEach((card) => {
    card.addEventListener("click", () => selectPlan(card.dataset.plan));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectPlan(card.dataset.plan); }
    });
  });

  // Payment method tabs
  document.getElementById("pmt-tab-wallet")?.addEventListener("click", () => switchMethodTab("wallet"));
  document.getElementById("pmt-tab-bank")?.addEventListener("click",   () => switchMethodTab("bank"));

  // Wallet sub-tabs
  document.querySelectorAll(".wallet-tab").forEach((tab) => {
    tab.addEventListener("click", () => selectWallet(tab.dataset.wallet));
  });

  // Copy number button
  document.getElementById("wallet-copy-btn")?.addEventListener("click", copyWalletNumber);

  // File upload wiring
  wireFileUpload();

  // Form submissions
  document.getElementById("wallet-form")?.addEventListener("submit", (e) => {
    e.preventDefault(); submitPayment("wallet");
  });
  document.getElementById("bank-form")?.addEventListener("submit", (e) => {
    e.preventDefault(); submitPayment("bank");
  });

  // Keyboard: close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.getElementById("upgrade-overlay")?.classList.contains("visible")) {
      closeUpgradeModal();
    }
  });
}

// ── Open / close ─────────────────────────────────────────────
function openUpgradeModal() {
  const overlay = document.getElementById("upgrade-overlay");
  overlay?.classList.add("visible");
  document.body.style.overflow = "hidden";

  // Reset to form state (hide success if it was shown before)
  resetModalToForm();

  // Focus first interactive element for accessibility
  setTimeout(() => document.getElementById("upgrade-close-btn")?.focus(), 100);
}

function closeUpgradeModal() {
  const overlay = document.getElementById("upgrade-overlay");
  overlay?.classList.remove("visible");
  document.body.style.overflow = "";
}

function resetModalToForm() {
  // Hide success, show form
  document.getElementById("upgrade-success")?.classList.remove("visible");
  const formSection = document.getElementById("upgrade-form-section");
  if (formSection) formSection.style.display = "";

  // Reset forms
  document.getElementById("wallet-form")?.reset();
  document.getElementById("bank-form")?.reset();
  clearReceiptFile();
  setButtonLoading("wallet-submit-btn", false);
  setButtonLoading("bank-submit-btn", false);
}

// ── Plan selection ───────────────────────────────────────────
function selectPlan(planKey) {
  if (!PLAN_PRICES[planKey]) return;
  modalState.selectedPlan = planKey;

  // Update card UI
  document.querySelectorAll(".plan-card").forEach((card) => {
    const isSelected = card.dataset.plan === planKey;
    card.classList.toggle("selected", isSelected);
    card.setAttribute("aria-checked", isSelected ? "true" : "false");
  });

  // Update price display in wallet send-to card
  const planInfo = PLAN_PRICES[planKey];
  const priceEl  = document.getElementById("plan-price-label");
  if (priceEl) priceEl.textContent = planInfo.price;

  // Update bank reference
  const refEl = document.getElementById("bank-plan-ref");
  if (refEl) refEl.textContent = planInfo.ref;

  // Refresh wallet send-to tag
  refreshWalletCard();
}

// ── Payment method tabs ──────────────────────────────────────
function switchMethodTab(method) {
  modalState.activeMethod = method;

  document.querySelectorAll(".pmt-tab").forEach((tab) => {
    const isActive = tab.id === `pmt-tab-${method}`;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", isActive ? "true" : "false");
  });

  document.querySelectorAll(".payment-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === `panel-${method}`);
  });
}

// ── Wallet sub-tabs ──────────────────────────────────────────
function selectWallet(walletKey) {
  if (!WALLETS[walletKey]) return;
  modalState.selectedWallet = walletKey;

  document.querySelectorAll(".wallet-tab").forEach((tab) => {
    const isActive = tab.dataset.wallet === walletKey;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  refreshWalletCard();

  // Update label in form
  const labelEl = document.getElementById("wallet-label");
  if (labelEl) labelEl.textContent = WALLETS[walletKey].label;
}

function refreshWalletCard() {
  const wallet   = WALLETS[modalState.selectedWallet];
  const planInfo = PLAN_PRICES[modalState.selectedPlan];
  if (!wallet || !planInfo) return;

  const iconBg   = document.getElementById("wallet-icon-bg");
  const numEl    = document.getElementById("wallet-number");
  const nameEl   = document.getElementById("wallet-account-name");
  const tagEl    = document.querySelector(".wallet-send-to__tag");

  if (iconBg)  { iconBg.textContent = wallet.icon; iconBg.style.background = wallet.iconBg; }
  if (numEl)   numEl.textContent  = wallet.number;
  if (nameEl)  nameEl.textContent = wallet.accountName;
  if (tagEl)   tagEl.innerHTML    = wallet.sendTag.replace("{PRICE}", `<span id="plan-price-label">${planInfo.price}</span>`);
}

// ── Copy wallet number ───────────────────────────────────────
function copyWalletNumber() {
  const number = WALLETS[modalState.selectedWallet]?.number || "";
  navigator.clipboard.writeText(number.replace(/-/g, "")).then(() => {
    const btn = document.getElementById("wallet-copy-btn");
    if (btn) {
      btn.textContent = "✓ Copied!";
      btn.classList.add("copied");
      setTimeout(() => { btn.textContent = "📋 Copy"; btn.classList.remove("copied"); }, 2000);
    }
  }).catch(() => {/* clipboard API not available */});
}

// ── File upload (drag & drop) ─────────────────────────────────
function wireFileUpload() {
  const zone    = document.getElementById("receipt-dropzone");
  const input   = document.getElementById("receipt-file-input");
  const preview = document.getElementById("file-preview");
  const nameEl  = document.getElementById("file-preview-name");
  const removeBtn = document.getElementById("file-remove-btn");

  if (!zone) return;

  // Click on zone triggers hidden input
  zone.addEventListener("click", (e) => {
    if (!e.target.closest(".file-preview__remove")) input?.click();
  });
  zone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input?.click(); }
  });

  // Drag events
  zone.addEventListener("dragover", (e) => { e.preventDefault(); zone.classList.add("drag-over"); });
  zone.addEventListener("dragleave", ()  => zone.classList.remove("drag-over"));
  zone.addEventListener("drop", (e) => {
    e.preventDefault(); zone.classList.remove("drag-over");
    const files = e.dataTransfer?.files;
    if (files?.[0]) handleFileChosen(files[0]);
  });

  // Input change
  input?.addEventListener("change", (e) => {
    if (e.target.files?.[0]) handleFileChosen(e.target.files[0]);
  });

  // Remove button
  removeBtn?.addEventListener("click", (e) => { e.stopPropagation(); clearReceiptFile(); });
  removeBtn?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); clearReceiptFile(); }
  });
}

function handleFileChosen(file) {
  if (file.size > 5 * 1024 * 1024) {
    showModalError("bank-submit-btn", "File is too large (max 5 MB). Please compress and re-upload.");
    return;
  }
  modalState.receiptFile = file;
  const nameEl  = document.getElementById("file-preview-name");
  const preview = document.getElementById("file-preview");
  if (nameEl)  nameEl.textContent = file.name;
  if (preview) preview.classList.add("visible");
}

function clearReceiptFile() {
  modalState.receiptFile = null;
  const input   = document.getElementById("receipt-file-input");
  const preview = document.getElementById("file-preview");
  if (input)   input.value = "";
  if (preview) preview.classList.remove("visible");
}

// ── Submission ────────────────────────────────────────────────
async function submitPayment(method) {
  const submitBtnId = method === "wallet" ? "wallet-submit-btn" : "bank-submit-btn";

  // Validate
  if (method === "wallet") {
    const num  = document.getElementById("wallet-sender-number")?.value.trim();
    const txn  = document.getElementById("wallet-txn-id")?.value.trim();
    const name = document.getElementById("wallet-sender-name")?.value.trim();
    if (!num)  return markError("wallet-sender-number",  "Please enter your mobile wallet number.");
    if (!txn)  return markError("wallet-txn-id",         "Please enter the Transaction ID.");
    if (!name) return markError("wallet-sender-name",    "Please enter your full name.");
  }

  if (method === "bank") {
    const name = document.getElementById("bank-sender-name")?.value.trim();
    if (!name)                 return markError("bank-sender-name", "Please enter your full name.");
    if (!modalState.receiptFile) {
      document.getElementById("receipt-dropzone")?.classList.add("drag-over");
      setTimeout(() => document.getElementById("receipt-dropzone")?.classList.remove("drag-over"), 1200);
      return;
    }
  }

  // Build FormData
  const fd = new FormData();
  fd.append("payment_method", method);
  fd.append("plan", modalState.selectedPlan);

  if (method === "wallet") {
    fd.append("wallet_type",    modalState.selectedWallet);
    fd.append("sender_number",  document.getElementById("wallet-sender-number")?.value.trim());
    fd.append("transaction_id", document.getElementById("wallet-txn-id")?.value.trim());
    fd.append("sender_name",    document.getElementById("wallet-sender-name")?.value.trim());
  } else {
    fd.append("sender_name",  document.getElementById("bank-sender-name")?.value.trim());
    fd.append("sender_email", document.getElementById("bank-sender-email")?.value.trim());
    fd.append("receipt", modalState.receiptFile, modalState.receiptFile.name);
  }

  // Submit
  setButtonLoading(submitBtnId, true);

  try {
    const res = await fetch(`${API_BASE}/payments/verify`, {
      method: "POST",
      body  : fd,
      // Do NOT set Content-Type — browser sets multipart boundary automatically
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `Server error ${res.status}`);
    }

    // ── Show success screen ──────────────────────────────────
    setButtonLoading(submitBtnId, false);
    showSuccessScreen(data);

  } catch (err) {
    setButtonLoading(submitBtnId, false);
    showModalError(submitBtnId, err.message || "Submission failed. Please try again.");
    console.error("[Payment] Submission error:", err.message);
  }
}

function showSuccessScreen(data) {
  // Hide form sections, show success
  document.getElementById("upgrade-form-section").style.display = "none";
  document.querySelector(".plan-row").style.display        = "none";
  document.querySelector(".upgrade-benefits").style.display = "none";
  document.querySelector(".upgrade-divider").style.display  = "none";
  document.querySelector(".payment-method-tabs").style.display = "none";
  document.querySelectorAll(".payment-panel").forEach((p) => p.style.display = "none");
  document.querySelector(".upgrade-modal__footer").style.display = "none";

  const msgEl = document.getElementById("upgrade-success-msg");
  if (msgEl) {
    msgEl.textContent = data.message ||
      "Your payment proof has been submitted. Our team will verify it within 24 hours.";
  }

  const idEl = document.getElementById("upgrade-request-id");
  if (idEl && data.request_id) {
    idEl.textContent = `Request ID: ${data.request_id.toUpperCase().slice(0, 8)}`;
  }

  document.getElementById("upgrade-success")?.classList.add("visible");

  // Scroll to top of modal
  document.getElementById("upgrade-modal")?.scrollTo({ top: 0, behavior: "smooth" });
}

// ── UI helpers ────────────────────────────────────────────────
function setButtonLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.classList.toggle("loading", loading);
  btn.disabled = loading;
}

function markError(fieldId, message) {
  const el = document.getElementById(fieldId);
  if (el) {
    el.classList.add("error");
    el.focus();
    el.addEventListener("input", () => el.classList.remove("error"), { once: true });
  }
  console.warn("[Payment Validation]", message);
}

function showModalError(nearBtnId, message) {
  // Re-use a simple alert for now; Phase 3 will use an inline toast
  alert(`⚠️ ${message}`);
}
