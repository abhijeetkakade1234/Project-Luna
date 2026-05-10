export const MS_PER_DAY = 24 * 60 * 60 * 1000;
export const moodOptions = ["calm", "good", "tired", "anxious", "irritable", "crampy"];
export const symptomOptions = ["cramps", "bloating", "headache", "fatigue", "acne", "back pain"];

export function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

export function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function parseISO(iso) {
  if (!iso) return new Date();
  if (iso.includes('T')) return new Date(iso);
  return new Date(`${iso}T00:00:00`);
}

export function addDays(iso, days) {
  const date = parseISO(iso);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function formatLongDate(iso) {
  if (!iso) return "Not set";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  }).format(parseISO(iso));
}

export function formatShortDate(iso) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(parseISO(iso));
}

export function daysBetween(later, earlier) {
  return Math.floor((startOfDay(later) - startOfDay(earlier)) / MS_PER_DAY);
}

export function latestByDate(list) {
  if (!list || list.length === 0) return null;
  return [...list].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))[0];
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function getCycleInfo(profile) {
  const today = startOfDay(new Date());
  const cycleStart = parseISO(profile.cycleStartDate || isoToday());
  const cycleLength = clamp(Number(profile.cycleLength) || 28, 21, 45);
  const elapsed = Math.max(0, daysBetween(today, cycleStart));
  const dayInCycle = (elapsed % cycleLength) + 1;
  const cyclesCompleted = Math.floor(elapsed / cycleLength);
  const nextPeriodDate = addDays(profile.cycleStartDate || isoToday(), (cyclesCompleted + 1) * cycleLength);
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

  const progress = Math.min(100, Math.max(0, Math.round((dayInCycle / cycleLength) * 100)));
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

export function deriveCompanionTone(cycle, logs, drafts, profile) {
  const mood = latestByDate(logs.moods)?.mood || drafts.moodSelection || profile.moodPreferences[0] || "calm";
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
