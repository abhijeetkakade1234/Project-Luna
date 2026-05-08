const STORAGE_KEY = "project-luna-local-v1";
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const moodOptions = ["calm", "good", "tired", "anxious", "irritable", "crampy"];
const symptomOptions = ["cramps", "bloating", "headache", "fatigue", "acne", "back pain"];

const defaultState = {
  setupComplete: false,
  activeTab: "dashboard",
  setupStep: 0,
  profile: {
    cycleStartDate: "",
    cycleLength: 28,
    reminderEnabled: false,
    reminderPermission: "default",
    anonymousMode: true,
    localOnly: true,
    moodPreferences: ["calm", "good"],
    symptomPreferences: ["cramps", "fatigue"]
  },
  privacy: {
    exportAvailable: true,
    encryptedBackup: false
  },
  logs: {
    periods: [],
    moods: [],
    symptoms: [],
    journals: []
  },
  ui: {
    drafts: {
      moodSelection: "calm",
      moodNote: "",
      symptomSelection: [],
      symptomIntensity: "moderate",
      symptomNote: "",
      journalTitle: "",
      journalBody: ""
    }
  }
};

let state = loadState();

const app = document.querySelector("#app");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return clone(defaultState);
    const parsed = JSON.parse(raw);
    return mergeState(parsed);
  } catch {
    return clone(defaultState);
  }
}

function mergeState(parsed) {
  const merged = clone(defaultState);
  return {
    ...merged,
    ...parsed,
    profile: { ...merged.profile, ...(parsed.profile || {}) },
    privacy: { ...merged.privacy, ...(parsed.privacy || {}) },
    logs: {
      ...merged.logs,
      ...(parsed.logs || {})
    },
    ui: {
      ...merged.ui,
      ...(parsed.ui || {}),
      drafts: { ...merged.ui.drafts, ...((parsed.ui && parsed.ui.drafts) || {}) }
    }
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setState(updater) {
  updater(state);
  saveState();
  render();
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseISO(iso) {
  return iso ? new Date(`${iso}T00:00:00`) : new Date();
}

function addDays(iso, days) {
  const date = parseISO(iso);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatLongDate(iso) {
  if (!iso) return "Not set";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  }).format(parseISO(iso));
}

function formatShortDate(iso) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(parseISO(iso));
}

function daysBetween(later, earlier) {
  return Math.floor((startOfDay(later) - startOfDay(earlier)) / MS_PER_DAY);
}

function latestByDate(list) {
  return [...list].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))[0];
}

function getCycleInfo() {
  const today = startOfDay(new Date());
  const cycleStart = parseISO(state.profile.cycleStartDate || isoToday());
  const cycleLength = clamp(Number(state.profile.cycleLength) || 28, 21, 45);
  const elapsed = Math.max(0, daysBetween(today, cycleStart));
  const dayInCycle = (elapsed % cycleLength) + 1;
  const cyclesCompleted = Math.floor(elapsed / cycleLength);
  const nextPeriodDate = addDays(state.profile.cycleStartDate || isoToday(), (cyclesCompleted + 1) * cycleLength);
  const daysUntilNext = Math.max(0, daysBetween(parseISO(nextPeriodDate), today));
  const periodLength = Math.min(5, Math.max(3, Math.round(cycleLength * 0.18)));
  const ovulationStart = Math.max(periodLength + 5, Math.round(cycleLength * 0.48));
  const ovulationEnd = Math.min(cycleLength - 5, ovulationStart + 2);

  let phase = "Follicular";
  let phaseKey = "follicular";
  if (dayInCycle <= periodLength) {
    phase = "Menstrual";
    phaseKey = "period";
  } else if (dayInCycle <= ovulationStart) {
    phase = "Follicular";
    phaseKey = "follicular";
  } else if (dayInCycle <= ovulationEnd) {
    phase = "Ovulation";
    phaseKey = "ovulation";
  } else {
    phase = "Luteal";
    phaseKey = "luteal";
  }

  const progress = Math.min(100, Math.round((dayInCycle / cycleLength) * 100));
  return {
    cycleLength,
    dayInCycle,
    daysUntilNext,
    nextPeriodDate,
    phase,
    phaseKey,
    progress,
    periodLength,
    ovulationStart
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function deriveCompanionTone() {
  const cycle = getCycleInfo();
  const mood = latestByDate(state.logs.moods)?.mood || state.ui.drafts.moodSelection || state.profile.moodPreferences[0] || "calm";
  const moodTone = {
    calm: { color: "#3d99b9", label: "soft and steady" },
    good: { color: "#7ed321", label: "bright and easy" },
    tired: { color: "#d9b5ef", label: "resting gently" },
    anxious: { color: "#6c80de", label: "quiet and reassuring" },
    irritable: { color: "#ff6b6b", label: "a little frayed" },
    crampy: { color: "#ee6c4d", label: "needs care" }
  };

  const phaseTone = {
    period: "restorative",
    follicular: "steady",
    ovulation: "energized",
    luteal: "softening"
  };

  const tone = moodTone[mood] || moodTone.calm;
  return {
    mood,
    color: tone.color,
    label: tone.label,
    phaseNote: phaseTone[cycle.phaseKey] || "steady"
  };
}

function render() {
  document.body.dataset.mode = state.setupComplete ? "app" : "setup";
  app.innerHTML = state.setupComplete ? renderApp() : renderSetup();
  wireBodyStyles();
}

function wireBodyStyles() {
  const tone = deriveCompanionTone();
  document.documentElement.style.setProperty("--companion-color", tone.color);
}

function renderSetup() {
  const step = state.setupStep;
  const total = 4;
  const progress = Array.from({ length: total }, (_, index) =>
    `<span class="${index === step ? "is-active" : ""}"></span>`
  ).join("");

  const screens = [
    {
      title: "A calmer way to track your cycle.",
      subtitle:
        "Project Luna is a privacy-first period companion that keeps setup gentle, data local, and the experience friendly from the very first step.",
      body: `
        <div class="setup-card-grid">
          <div class="setup-feature">
            <strong>Local-first by default</strong>
            <span>Your information stays on this device unless you choose otherwise later.</span>
          </div>
          <div class="setup-feature">
            <strong>Anonymous mode available</strong>
            <span>Use the app without an account, email, or identity layer.</span>
          </div>
          <div class="setup-feature">
            <strong>Warm, soft, and clear</strong>
            <span>Designed to feel supportive without becoming clinical or overwhelming.</span>
          </div>
        </div>
        <button class="primary-btn" data-action="setup-next">Start setup</button>
      `
    },
    {
      title: "When did your last period start?",
      subtitle:
        "We use this to anchor your cycle predictions. You can update it anytime from the app.",
      body: `
        <div class="field-grid">
          <label class="field">
            <span>Cycle start date</span>
            <input type="date" name="cycleStartDate" value="${escapeHtml(state.profile.cycleStartDate || isoToday())}" />
          </label>
          <label class="field">
            <span>Usual cycle length</span>
            <input type="number" name="cycleLength" min="21" max="45" value="${escapeHtml(state.profile.cycleLength)}" />
          </label>
        </div>
      `
    },
    {
      title: "What would you like to notice?",
      subtitle:
        "Choose the moods and symptoms you care about most. These preferences help shape the companion and your tracking shortcuts.",
      body: `
        <div class="field">
          <span>Mood preferences</span>
            <div class="chip-grid" data-group="moodPreferences">
              ${moodOptions
                .map(
                  (option) =>
                  `<button type="button" class="chip ${state.profile.moodPreferences.includes(option) ? "is-active" : ""}" data-toggle-profile="moodPreferences" data-value="${option}">${option}</button>`
                )
                .join("")}
            </div>
          </div>
          <div class="field">
            <span>Symptom preferences</span>
            <div class="chip-grid" data-group="symptomPreferences">
              ${symptomOptions
                .map(
                  (option) =>
                  `<button type="button" class="chip ${state.profile.symptomPreferences.includes(option) ? "is-active" : ""}" data-toggle-profile="symptomPreferences" data-value="${option}">${option}</button>`
                )
                .join("")}
            </div>
          </div>
      `
    },
    {
      title: "Privacy first, always.",
      subtitle:
        "Project Luna starts local, anonymous, and easy to control. Notifications are optional and you can export or delete your data whenever you want.",
      body: `
        <div class="setup-card-grid">
          <div class="setup-feature">
            <strong>Anonymous mode</strong>
            <span>${state.profile.anonymousMode ? "On" : "Off"} by default</span>
          </div>
          <div class="setup-feature">
            <strong>Local storage</strong>
            <span>${state.profile.localOnly ? "Enabled" : "Disabled"} for MVP</span>
          </div>
          <div class="setup-feature">
            <strong>Notifications</strong>
            <span>${state.profile.reminderEnabled ? "Allowed" : "Not requested yet"}</span>
          </div>
        </div>
        <button class="primary-btn" data-action="request-notifications">Allow notifications</button>
      `
    }
  ];

  const current = screens[step];
  return `
    <div class="setup-screen">
      <div class="setup-shell">
        <div class="setup-page">
          <div class="setup-topline">
            <div class="setup-kicker">Project Luna</div>
            <div class="progress-dots" aria-hidden="true">${progress}</div>
          </div>
          <div class="setup-panel setup-card">
            <h1 class="setup-title">${current.title}</h1>
            <p class="setup-copy">${current.subtitle}</p>
            ${current.body}
            <div class="setup-footer">
              ${
                step > 0
                  ? `<button class="secondary-btn" data-action="setup-prev">Back</button>`
                  : `<span></span>`
              }
              ${
                step < total - 1
                  ? `<button class="secondary-btn" data-action="setup-next">Continue</button>`
                  : `<button class="secondary-btn" data-action="finish-setup">Finish</button>`
              }
            </div>
            <p class="hint" style="margin-top: 18px;">
              Privacy note: your data starts on-device and stays under your control.
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderApp() {
  const cycle = getCycleInfo();
  const companion = deriveCompanionTone();
  const latestMood = latestByDate(state.logs.moods);
  const latestSymptom = latestByDate(state.logs.symptoms);
  const latestJournal = latestByDate(state.logs.journals);

  const activeView = {
    dashboard: renderDashboard(cycle, companion, latestMood, latestSymptom, latestJournal),
    track: renderTrack(cycle),
    journal: renderJournal(),
    settings: renderSettings(cycle)
  }[state.activeTab];

  const tabNames = [
    ["dashboard", "Home"],
    ["track", "Track"],
    ["journal", "Journal"],
    ["settings", "Settings"]
  ];

  return `
    <div class="app-shell">
      <div class="shell-inner">
        <div class="topbar">
          <div class="brand">
            <div class="brand-mark" aria-hidden="true"></div>
            <div class="brand-text">
              <strong>Project Luna</strong>
              <span>Local-first, friendly, and private</span>
            </div>
          </div>
          <div class="status-pill">Anonymous mode on</div>
        </div>

        ${activeView}
      </div>

      <nav class="tabbar" aria-label="Primary">
        <div class="tabbar-inner">
          ${tabNames
            .map(
              ([key, label]) =>
                `<button class="tab-btn ${state.activeTab === key ? "is-active" : ""}" data-action="switch-tab" data-tab="${key}">${label}</button>`
            )
            .join("")}
        </div>
      </nav>
    </div>
  `;
}

function renderDashboard(cycle, companion, latestMood, latestSymptom, latestJournal) {
  const phaseText = {
    period: "Your period phase is here. Keep things gentle today.",
    follicular: "Energy is building. This is a nice moment for steady routines.",
    ovulation: "You may feel more energized and social right now.",
    luteal: "This is a good time for softer plans and more care."
  }[cycle.phaseKey];

  return `
    <section class="dashboard-grid">
      <div class="card hero-card">
        <div class="eyebrow">Today</div>
        <h1 class="hero-title">${cycle.phase} phase, day ${cycle.dayInCycle} of ${cycle.cycleLength}</h1>
        <p class="hero-copy">${phaseText} Next predicted period: <strong>${formatLongDate(cycle.nextPeriodDate)}</strong>.</p>
        <div class="hero-meta">
          <div class="meta-chip"><span class="meta-dot"></span> ${cycle.daysUntilNext} days until next period</div>
          <div class="meta-chip"><span class="meta-dot" style="background: var(--app-secondary);"></span> Cycle started ${formatShortDate(state.profile.cycleStartDate || isoToday())}</div>
        </div>
      </div>

      <div class="card companion-card">
        <div class="companion-wrap">
          <div class="companion-orb" style="--companion-color: ${companion.color};" aria-hidden="true"></div>
          <div class="companion-copy">
            <h3>Companion feels ${companion.label}</h3>
            <p>${capitalize(companion.mood)} mood, ${companion.phaseNote} phase. It stays subtle, but it reacts to how you’re doing.</p>
          </div>
        </div>
      </div>

      <div class="content-grid">
        <div class="panel">
          <div class="section-heading">
            <h2>Cycle summary</h2>
            <button class="mini-link" data-action="start-period-today">Start period today</button>
          </div>
          <div class="stack">
            <div class="summary-card">
              <span class="section-label">Estimated progress</span>
              <div class="progress-bar"><span style="width: ${cycle.progress}%"></span></div>
              <div class="summary-note">${cycle.progress}% through your current cycle</div>
            </div>
            <div class="summary-grid">
              <div class="summary-card">
                <span class="section-label">Current phase</span>
                <div class="summary-value">${cycle.phase}</div>
                <div class="summary-note">${phaseText}</div>
              </div>
              <div class="summary-card">
                <span class="section-label">Next period</span>
                <div class="summary-value">${formatShortDate(cycle.nextPeriodDate)}</div>
                <div class="summary-note">${cycle.daysUntilNext} days from now</div>
              </div>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="section-heading">
            <h2>Recent mood</h2>
            <button class="mini-link" data-action="switch-tab" data-tab="track">Log now</button>
          </div>
          ${
            latestMood
              ? `<div class="entry"><div class="entry-top"><strong>${escapeHtml(latestMood.mood)}</strong><span>${formatShortDate(latestMood.date)}</span></div><p>${escapeHtml(latestMood.note || "No note yet.")}</p></div>`
              : `<p class="muted">No mood logged yet. The companion will learn from your first check-in.</p>`
          }
          <div class="bottom-space"></div>
          <div class="section-heading">
            <h2>Quick actions</h2>
          </div>
          <div class="quick-actions">
            <button class="action-btn" data-action="quick-mood"><strong>Mood</strong><span>Log how you feel today.</span></button>
            <button class="action-btn" data-action="switch-tab" data-tab="track"><strong>Symptoms</strong><span>Track cramps, bloating, and more.</span></button>
            <button class="action-btn" data-action="switch-tab" data-tab="journal"><strong>Journal</strong><span>Capture a thought or reflection.</span></button>
            <button class="action-btn" data-action="start-period-today"><strong>Period start</strong><span>Reset the cycle anchor.</span></button>
          </div>
        </div>
      </div>

      <div class="content-grid">
        <div class="panel">
          <div class="section-heading"><h2>Latest symptom log</h2></div>
          ${
            latestSymptom
              ? `<div class="entry"><div class="entry-top"><strong>${escapeHtml(latestSymptom.symptoms.join(", "))}</strong><span>${formatShortDate(latestSymptom.date)}</span></div><p>Intensity: ${escapeHtml(latestSymptom.intensity)}. ${escapeHtml(latestSymptom.note || "")}</p></div>`
              : `<p class="muted">No symptom entries yet.</p>`
          }
        </div>
        <div class="panel">
          <div class="section-heading"><h2>Latest journal note</h2></div>
          ${
            latestJournal
              ? `<div class="entry"><div class="entry-top"><strong>${escapeHtml(latestJournal.title || "Journal entry")}</strong><span>${formatShortDate(latestJournal.date)}</span></div><p>${escapeHtml(latestJournal.body)}</p></div>`
              : `<p class="muted">Journal entries show up here once you start writing.</p>`
          }
        </div>
      </div>
    </section>
  `;
}

function renderTrack(cycle) {
  const selectedMoods = state.ui.drafts.moodSelection ? [state.ui.drafts.moodSelection] : [];
  const selectedSymptoms = state.ui.drafts.symptomSelection || [];

  return `
    <section class="section">
      <div class="panel">
        <div class="section-heading">
          <h2>Log today</h2>
          <span class="muted">Built for quick one-handed updates</span>
        </div>
        <div class="form-grid">
          <div class="field">
            <span class="section-label">Mood</span>
            <div class="chip-grid">
              ${moodOptions
                .map(
                  (option) =>
                    `<button type="button" class="chip ${selectedMoods.includes(option) ? "is-active" : ""}" data-toggle-draft="moodSelection" data-value="${option}">${option}</button>`
                )
                .join("")}
            </div>
          </div>
          <label class="field">
            <span>Note</span>
            <textarea name="moodNote" placeholder="What’s shaping today?" data-draft="moodNote">${escapeHtml(state.ui.drafts.moodNote)}</textarea>
          </label>
          <button class="primary-btn" data-action="save-mood">Save mood</button>
        </div>
      </div>

      <div class="content-grid">
        <div class="panel">
          <div class="section-heading">
            <h2>Symptoms</h2>
            <button class="mini-link" data-action="start-period-today">Log period start</button>
          </div>
          <div class="form-grid">
            <div class="field">
              <span class="section-label">Choose symptoms</span>
              <div class="chip-grid">
                ${symptomOptions
                  .map(
                    (option) =>
                      `<button type="button" class="chip ${selectedSymptoms.includes(option) ? "is-active" : ""}" data-toggle-array="symptomSelection" data-value="${option}">${option}</button>`
                  )
                  .join("")}
              </div>
            </div>
            <div class="segmented" role="group" aria-label="Symptom intensity">
              ${["mild", "moderate", "strong"]
                .map(
                  (value) =>
                    `<button type="button" class="${state.ui.drafts.symptomIntensity === value ? "is-active" : ""}" data-toggle-one="symptomIntensity" data-value="${value}">${value}</button>`
                )
                .join("")}
            </div>
            <label class="field">
              <span>Note</span>
              <textarea name="symptomNote" placeholder="Anything specific to remember?" data-draft="symptomNote">${escapeHtml(state.ui.drafts.symptomNote)}</textarea>
            </label>
            <button class="primary-btn" data-action="save-symptoms">Save symptoms</button>
          </div>
        </div>

        <div class="panel">
          <div class="section-heading">
            <h2>Cycle view</h2>
          </div>
          <div class="timeline">
            <div class="phase-row">
              <span class="phase-pill ${cycle.phaseKey === "period" ? "is-active" : ""}">Period</span>
              <span class="phase-pill ${cycle.phaseKey === "follicular" ? "is-active" : ""}">Follicular</span>
              <span class="phase-pill ${cycle.phaseKey === "ovulation" ? "is-active" : ""}">Ovulation</span>
              <span class="phase-pill ${cycle.phaseKey === "luteal" ? "is-active" : ""}">Luteal</span>
            </div>
            <div>
              <div class="summary-note">Cycle day ${cycle.dayInCycle} of ${cycle.cycleLength}</div>
              <div class="progress-bar" style="margin-top: 10px;"><span style="width: ${cycle.progress}%"></span></div>
            </div>
            <p class="muted">This is an approximate cycle model for the MVP. You can refine it later from settings.</p>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderJournal() {
  return `
    <section class="section">
      <div class="panel">
        <div class="section-heading">
          <h2>Journal</h2>
          <span class="muted">Private notes stay on your device</span>
        </div>
        <div class="form-grid">
          <label class="field">
            <span>Title</span>
            <input type="text" name="journalTitle" placeholder="A small note about today" data-draft="journalTitle" value="${escapeHtml(state.ui.drafts.journalTitle)}" />
          </label>
          <label class="field">
            <span>Entry</span>
            <textarea name="journalBody" placeholder="Write whatever feels useful." data-draft="journalBody">${escapeHtml(state.ui.drafts.journalBody)}</textarea>
          </label>
          <button class="primary-btn" data-action="save-journal">Save entry</button>
        </div>
      </div>

      <div class="panel">
        <div class="section-heading">
          <h2>Recent entries</h2>
        </div>
        <div class="entry-list">
          ${
            state.logs.journals.length
              ? state.logs.journals
                  .slice()
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map(
                    (entry) => `
                      <article class="entry">
                        <div class="entry-top">
                          <strong>${escapeHtml(entry.title || "Journal entry")}</strong>
                          <span>${formatShortDate(entry.date)}</span>
                        </div>
                        <p>${escapeHtml(entry.body)}</p>
                      </article>
                    `
                  )
                  .join("")
              : `<p class="muted">You haven’t written anything yet. Start with a simple line about how your body feels.</p>`
          }
        </div>
      </div>
    </section>
  `;
}

function renderSettings(cycle) {
  return `
    <section class="settings-grid">
      <div class="panel settings-card">
        <div class="section-heading">
          <h2>Privacy</h2>
        </div>
        <div class="settings-list">
          <div class="settings-item">
            <div>
              <strong>Anonymous mode</strong>
              <span>${state.profile.anonymousMode ? "Enabled" : "Disabled"}</span>
            </div>
            <button class="chip ${state.profile.anonymousMode ? "is-active" : ""}" data-action="toggle-privacy" data-key="anonymousMode">Toggle</button>
          </div>
          <div class="settings-item">
            <div>
              <strong>Local-first storage</strong>
              <span>${state.profile.localOnly ? "On this device only" : "Changed"}</span>
            </div>
            <button class="chip ${state.profile.localOnly ? "is-active" : ""}" data-action="toggle-privacy" data-key="localOnly">Toggle</button>
          </div>
          <div class="settings-item">
            <div>
              <strong>Notifications</strong>
              <span>${state.profile.reminderEnabled ? "Permission granted" : "Not enabled"}</span>
            </div>
            <button class="chip" data-action="request-notifications">Request</button>
          </div>
        </div>
      </div>

      <div class="panel settings-card">
        <div class="section-heading">
          <h2>Data controls</h2>
        </div>
        <div class="settings-list">
          <button class="action-btn" data-action="export-data">
            <strong>Export data</strong>
            <span>Download your cycle, mood, symptom, and journal history as JSON.</span>
          </button>
          <button class="danger-btn" data-action="delete-data">Delete everything</button>
          <button class="action-btn" data-action="restart-setup">
            <strong>Restart onboarding</strong>
            <span>Walk through setup again from the beginning.</span>
          </button>
        </div>
      </div>

      <div class="panel settings-card">
        <div class="section-heading">
          <h2>Cycle details</h2>
        </div>
        <div class="settings-list">
          <div class="settings-item">
            <div>
              <strong>Cycle start</strong>
              <span>${formatLongDate(state.profile.cycleStartDate || isoToday())}</span>
            </div>
          </div>
          <div class="settings-item">
            <div>
              <strong>Usual cycle length</strong>
              <span>${cycle.cycleLength} days</span>
            </div>
          </div>
          <div class="settings-item">
            <div>
              <strong>Current phase</strong>
              <span>${cycle.phase}</span>
            </div>
          </div>
        </div>
        <div class="settings-list">
          <label class="field">
            <span>Update cycle start</span>
            <input type="date" name="cycleStartDate" value="${escapeHtml(state.profile.cycleStartDate || isoToday())}" data-setting="cycleStartDate" />
          </label>
          <label class="field">
            <span>Update cycle length</span>
            <input type="number" min="21" max="45" value="${escapeHtml(state.profile.cycleLength)}" data-setting="cycleLength" />
          </label>
        </div>
      </div>

      <div class="panel settings-card">
        <div class="section-heading">
          <h2>Companion tuning</h2>
        </div>
        <p class="muted">The mascot stays subtle, but it can echo your current mood or your current cycle phase.</p>
        <div class="entry">
          <div class="entry-top">
            <strong>Current tone</strong>
            <span>${escapeHtml(deriveCompanionTone().label)}</span>
          </div>
          <p>It will animate softly and adapt to mood logs once you add them.</p>
        </div>
      </div>
    </section>
  `;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function toggleArray(target, value) {
  const list = state.ui.drafts[target] || [];
  state.ui.drafts[target] = list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function handleClick(event) {
  const actionEl = event.target.closest("[data-action]");
  if (actionEl) {
    const action = actionEl.dataset.action;
    if (action === "setup-next") {
      state.setupStep = Math.min(3, state.setupStep + 1);
      saveState();
      render();
      return;
    }
    if (action === "setup-prev") {
      state.setupStep = Math.max(0, state.setupStep - 1);
      saveState();
      render();
      return;
    }
    if (action === "finish-setup") {
      state.setupComplete = true;
      state.setupStep = 0;
      saveState();
      render();
      return;
    }
    if (action === "switch-tab") {
      state.activeTab = actionEl.dataset.tab;
      saveState();
      render();
      return;
    }
    if (action === "request-notifications") {
      requestNotifications();
      return;
    }
    if (action === "start-period-today") {
      const today = isoToday();
      state.profile.cycleStartDate = today;
      state.logs.periods.push({ date: today, createdAt: new Date().toISOString() });
      state.activeTab = "dashboard";
      saveState();
      render();
      return;
    }
    if (action === "quick-mood") {
      state.activeTab = "track";
      saveState();
      render();
      return;
    }
    if (action === "save-mood") {
      saveMood();
      return;
    }
    if (action === "save-symptoms") {
      saveSymptoms();
      return;
    }
    if (action === "save-journal") {
      saveJournal();
      return;
    }
    if (action === "toggle-privacy") {
      const key = actionEl.dataset.key;
      state.profile[key] = !state.profile[key];
      saveState();
      render();
      return;
    }
    if (action === "export-data") {
      exportData();
      return;
    }
    if (action === "delete-data") {
      deleteData();
      return;
    }
    if (action === "restart-setup") {
      state.setupComplete = false;
      state.setupStep = 0;
      saveState();
      render();
      return;
    }
  }

  const profileToggle = event.target.closest("[data-toggle-profile]");
  if (profileToggle) {
    const key = profileToggle.dataset.toggleProfile;
    const value = profileToggle.dataset.value;
    const list = state.profile[key] || [];
    state.profile[key] = list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
    saveState();
    render();
    return;
  }

  const draftToggle = event.target.closest("[data-toggle-draft]");
  if (draftToggle) {
    const key = draftToggle.dataset.toggleDraft;
    state.ui.drafts[key] = draftToggle.dataset.value;
    saveState();
    render();
    return;
  }

  const toggleArrayButton = event.target.closest("[data-toggle-array]");
  if (toggleArrayButton) {
    const key = toggleArrayButton.dataset.toggleArray;
    toggleArray(key, toggleArrayButton.dataset.value);
    saveState();
    render();
    return;
  }

  const toggleOne = event.target.closest("[data-toggle-one]");
  if (toggleOne) {
    state.ui.drafts[toggleOne.dataset.toggleOne] = toggleOne.dataset.value;
    saveState();
    render();
  }
}

function handleInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.matches("[name='cycleStartDate']")) {
    state.profile.cycleStartDate = target.value;
    saveState();
    return;
  }
  if (target.matches("[name='cycleLength']")) {
    state.profile.cycleLength = clamp(Number(target.value) || 28, 21, 45);
    saveState();
    return;
  }
  const setting = target.dataset.setting;
  if (setting === "cycleStartDate") {
    state.profile.cycleStartDate = target.value;
    saveState();
    return;
  }
  if (setting === "cycleLength") {
    state.profile.cycleLength = clamp(Number(target.value) || 28, 21, 45);
    saveState();
    return;
  }
  const draft = target.dataset.draft;
  if (draft) {
    state.ui.drafts[draft] = target.value;
    saveState();
  }
}

function saveMood() {
  const mood = state.ui.drafts.moodSelection || "calm";
  state.logs.moods.push({
    mood,
    note: state.ui.drafts.moodNote.trim(),
    date: isoToday(),
    createdAt: new Date().toISOString()
  });
  state.profile.moodPreferences = uniqueList([...state.profile.moodPreferences, mood]).slice(0, 6);
  state.ui.drafts.moodNote = "";
  saveState();
  render();
}

function saveSymptoms() {
  state.logs.symptoms.push({
    symptoms: [...state.ui.drafts.symptomSelection],
    intensity: state.ui.drafts.symptomIntensity,
    note: state.ui.drafts.symptomNote.trim(),
    date: isoToday(),
    createdAt: new Date().toISOString()
  });
  state.profile.symptomPreferences = uniqueList([...state.profile.symptomPreferences, ...state.ui.drafts.symptomSelection]).slice(0, 8);
  state.ui.drafts.symptomSelection = [];
  state.ui.drafts.symptomNote = "";
  state.ui.drafts.symptomIntensity = "moderate";
  saveState();
  render();
}

function saveJournal() {
  const body = state.ui.drafts.journalBody.trim();
  if (!body) return;
  state.logs.journals.push({
    id: crypto.randomUUID(),
    title: state.ui.drafts.journalTitle.trim(),
    body,
    date: isoToday(),
    createdAt: new Date().toISOString()
  });
  state.ui.drafts.journalTitle = "";
  state.ui.drafts.journalBody = "";
  saveState();
  render();
}

function uniqueList(values) {
  return [...new Set(values.filter(Boolean))];
}

async function requestNotifications() {
  if (!("Notification" in window)) {
    state.profile.reminderEnabled = false;
    state.profile.reminderPermission = "unsupported";
    saveState();
    render();
    return;
  }
  const permission = await Notification.requestPermission();
  state.profile.reminderPermission = permission;
  state.profile.reminderEnabled = permission === "granted";
  saveState();
  render();
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `project-luna-export-${isoToday()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function deleteData() {
  const confirmed = window.confirm("Delete all local Project Luna data? This cannot be undone.");
  if (!confirmed) return;
  localStorage.removeItem(STORAGE_KEY);
  state = clone(defaultState);
  render();
}

document.addEventListener("click", handleClick);
document.addEventListener("input", handleInput);

render();
