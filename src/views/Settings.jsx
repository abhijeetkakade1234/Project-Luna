import { useStore } from '../store/useStore';
import { deriveCompanionTone, formatLongDate, getCycleInfo, isoToday } from '../utils/cycle';

export default function Settings() {
  const profile = useStore((state) => state.profile);
  const logs = useStore((state) => state.logs);
  const drafts = useStore((state) => state.drafts);
  const updateProfile = useStore((state) => state.updateProfile);
  const deleteEverything = useStore((state) => state.deleteEverything);

  const cycle = getCycleInfo(profile);
  const companion = deriveCompanionTone(cycle, logs, drafts, profile);

  const toggleAnonymousMode = () => updateProfile({ anonymousMode: !profile.anonymousMode });
  const toggleLocalOnly = () => updateProfile({ localOnly: !profile.localOnly });

  const exportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(useStore.getState(), null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "project_luna_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleCycleStartChange = (e) => updateProfile({ cycleStartDate: e.target.value });
  const handleCycleLengthChange = (e) => updateProfile({ cycleLength: Number(e.target.value) });

  return (
    <section className="settings-grid">
      <div className="panel settings-card">
        <div className="section-heading">
          <h2>Privacy</h2>
        </div>
        <div className="settings-list">
          <div className="settings-item">
            <div>
              <strong>Anonymous mode</strong>
              <span>{profile.anonymousMode ? "Enabled" : "Disabled"}</span>
            </div>
            <button className={`chip ${profile.anonymousMode ? "is-active" : ""}`} onClick={toggleAnonymousMode}>Toggle</button>
          </div>
          <div className="settings-item">
            <div>
              <strong>Local-first storage</strong>
              <span>{profile.localOnly ? "On this device only" : "Changed"}</span>
            </div>
            <button className={`chip ${profile.localOnly ? "is-active" : ""}`} onClick={toggleLocalOnly}>Toggle</button>
          </div>
          <div className="settings-item">
            <div>
              <strong>Notifications</strong>
              <span>{profile.reminderEnabled ? "Permission granted" : "Not enabled"}</span>
            </div>
            <button className="chip">Request</button>
          </div>
        </div>
      </div>

      <div className="panel settings-card">
        <div className="section-heading">
          <h2>Data controls</h2>
        </div>
        <div className="settings-list">
          <button className="action-btn" onClick={exportData}>
            <strong>Export data</strong>
            <span>Download your cycle, mood, symptom, and journal history as JSON.</span>
          </button>
          <button className="danger-btn" onClick={() => { if(window.confirm('Delete everything?')) deleteEverything(); }}>Delete everything</button>
        </div>
      </div>

      <div className="panel settings-card">
        <div className="section-heading">
          <h2>Cycle details</h2>
        </div>
        <div className="settings-list">
          <div className="settings-item">
            <div>
              <strong>Cycle start</strong>
              <span>{formatLongDate(profile.cycleStartDate || isoToday())}</span>
            </div>
          </div>
          <div className="settings-item">
            <div>
              <strong>Usual cycle length</strong>
              <span>{cycle.cycleLength} days</span>
            </div>
          </div>
          <div className="settings-item">
            <div>
              <strong>Current phase</strong>
              <span>{cycle.phase}</span>
            </div>
          </div>
        </div>
        <div className="settings-list" style={{ marginTop: '1rem' }}>
          <label className="field">
            <span>Update cycle start</span>
            <input type="date" value={profile.cycleStartDate || isoToday()} onChange={handleCycleStartChange} />
          </label>
          <label className="field">
            <span>Update cycle length</span>
            <input type="number" min="21" max="45" value={profile.cycleLength} onChange={handleCycleLengthChange} />
          </label>
        </div>
      </div>

      <div className="panel settings-card">
        <div className="section-heading">
          <h2>Companion tuning</h2>
        </div>
        <p className="muted">The mascot stays subtle, but it can echo your current mood or your current cycle phase.</p>
        <div className="entry">
          <div className="entry-top">
            <strong>Current tone</strong>
            <span>{companion.label}</span>
          </div>
          <p>It will animate softly and adapt to mood logs once you add them.</p>
        </div>
      </div>
    </section>
  );
}
