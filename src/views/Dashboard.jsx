import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { deriveCompanionTone, formatLongDate, formatShortDate, getCycleInfo, latestByDate } from '../utils/cycle';

export default function Dashboard() {
  const profile = useStore((state) => state.profile);
  const logs = useStore((state) => state.logs);
  const drafts = useStore((state) => state.drafts);

  const cycle = getCycleInfo(profile);
  const companion = deriveCompanionTone(cycle, logs, drafts, profile);
  const latestMood = latestByDate(logs.moods);
  const latestSymptom = latestByDate(logs.symptoms);
  const latestJournal = latestByDate(logs.journals);

  const phaseText = {
    period: "Your period phase is here. Keep things gentle today.",
    follicular: "Energy is building. This is a nice moment for steady routines.",
    ovulation: "You may feel more energized and social right now.",
    luteal: "This is a good time for softer plans and more care."
  }[cycle?.phaseKey || "follicular"];

  const capitalize = (s) => typeof s === 'string' && s.length > 0 ? s.charAt(0).toUpperCase() + s.slice(1) : "";

  return (
    <section className="dashboard-grid">
      <div className="card hero-card">
        <div className="eyebrow">Today</div>
        <h1 className="hero-title">{cycle.phase} phase, day {cycle.dayInCycle} of {cycle.cycleLength}</h1>
        <p className="hero-copy">{phaseText} Next predicted period: <strong>{formatLongDate(cycle.nextPeriodDate)}</strong>.</p>
        <div className="hero-meta">
          <div className="meta-chip"><span className="meta-dot"></span> {cycle.daysUntilNext} days until next period</div>
          <div className="meta-chip"><span className="meta-dot" style={{ background: 'var(--app-secondary)' }}></span> Cycle started {formatShortDate(profile.cycleStartDate)}</div>
        </div>
      </div>

      <div className="card companion-card">
        <div className="companion-wrap">
          <div className="companion-orb" style={{ '--companion-color': companion.color }} aria-hidden="true"></div>
          <div className="companion-copy">
            <h3>Companion feels {companion.label}</h3>
            <p>{capitalize(companion.mood)} mood, {companion.phaseNote} phase. It stays subtle, but it reacts to how you’re doing.</p>
          </div>
        </div>
      </div>

      <div className="content-grid">
        <div className="panel">
          <div className="section-heading">
            <h2>Cycle summary</h2>
            <button className="mini-link" onClick={() => useStore.getState().startPeriod(new Date().toISOString().slice(0, 10))}>Start period today</button>
          </div>
          <div className="stack">
            <div className="summary-card">
              <span className="section-label">Estimated progress</span>
              <div className="progress-bar"><span style={{ width: `${cycle.progress}%` }}></span></div>
              <div className="summary-note">{cycle.progress}% through your current cycle</div>
            </div>
            <div className="summary-grid">
              <div className="summary-card">
                <span className="section-label">Current phase</span>
                <div className="summary-value">{cycle.phase}</div>
                <div className="summary-note">{phaseText}</div>
              </div>
              <div className="summary-card">
                <span className="section-label">Next period</span>
                <div className="summary-value">{formatShortDate(cycle.nextPeriodDate)}</div>
                <div className="summary-note">{cycle.daysUntilNext} days from now</div>
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="section-heading">
            <h2>Recent mood</h2>
            <Link to="/track" className="mini-link">Log now</Link>
          </div>
          {latestMood ? (
            <div className="entry">
              <div className="entry-top">
                <strong>{latestMood.mood}</strong>
                <span>{formatShortDate(latestMood.date)}</span>
              </div>
              <p>{latestMood.note || "No note yet."}</p>
            </div>
          ) : (
            <p className="muted">No mood logged yet. The companion will learn from your first check-in.</p>
          )}
          
          <div className="bottom-space"></div>
          <div className="section-heading">
            <h2>Quick actions</h2>
          </div>
          <div className="quick-actions">
            <Link to="/track" className="action-btn"><strong>Mood</strong><span>Log how you feel today.</span></Link>
            <Link to="/track" className="action-btn"><strong>Symptoms</strong><span>Track cramps, bloating, and more.</span></Link>
            <Link to="/journal" className="action-btn"><strong>Journal</strong><span>Capture a thought or reflection.</span></Link>
            <button className="action-btn" onClick={() => useStore.getState().startPeriod(new Date().toISOString().slice(0, 10))}>
              <strong>Period start</strong><span>Reset the cycle anchor.</span>
            </button>
          </div>
        </div>
      </div>

      <div className="content-grid">
        <div className="panel">
          <div className="section-heading"><h2>Latest symptom log</h2></div>
          {latestSymptom ? (
            <div className="entry">
              <div className="entry-top">
                <strong>{latestSymptom.symptoms?.join(", ")}</strong>
                <span>{formatShortDate(latestSymptom.date)}</span>
              </div>
              <p>Intensity: {latestSymptom.intensity}. {latestSymptom.note}</p>
            </div>
          ) : (
            <p className="muted">No symptom entries yet.</p>
          )}
        </div>
        <div className="panel">
          <div className="section-heading"><h2>Latest journal note</h2></div>
          {latestJournal ? (
            <div className="entry">
              <div className="entry-top">
                <strong>{latestJournal.title || "Journal entry"}</strong>
                <span>{formatShortDate(latestJournal.date)}</span>
              </div>
              <p>{latestJournal.body}</p>
            </div>
          ) : (
            <p className="muted">Journal entries show up here once you start writing.</p>
          )}
        </div>
      </div>
    </section>
  );
}
