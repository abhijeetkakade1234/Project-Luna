import { useStore } from '../store/useStore';
import { getCycleInfo, moodOptions, symptomOptions } from '../utils/cycle';

export default function Track() {
  const profile = useStore((state) => state.profile);
  const drafts = useStore((state) => state.drafts);
  const updateDraft = useStore((state) => state.updateDraft);
  const saveMood = useStore((state) => state.saveMood);
  const saveSymptoms = useStore((state) => state.saveSymptoms);
  const startPeriod = useStore((state) => state.startPeriod);

  const cycle = getCycleInfo(profile);

  const handleMoodSubmit = () => {
    saveMood({
      mood: drafts.moodSelection,
      note: drafts.moodNote
    });
  };

  const handleSymptomSubmit = () => {
    saveSymptoms({
      symptoms: drafts.symptomSelection,
      intensity: drafts.symptomIntensity,
      note: drafts.symptomNote
    });
  };

  const toggleSymptom = (option) => {
    const list = drafts.symptomSelection || [];
    const newList = list.includes(option) 
      ? list.filter(item => item !== option) 
      : [...list, option];
    updateDraft('symptomSelection', newList);
  };

  return (
    <section className="section">
      <div className="panel">
        <div className="section-heading">
          <h2>Log today</h2>
          <span className="muted">Built for quick one-handed updates</span>
        </div>
        <div className="form-grid">
          <div className="field">
            <span className="section-label">Mood</span>
            <div className="chip-grid">
              {moodOptions.map(option => (
                <button 
                  key={option}
                  type="button" 
                  className={`chip ${drafts.moodSelection === option ? 'is-active' : ''}`}
                  onClick={() => updateDraft('moodSelection', option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          <label className="field">
            <span>Note</span>
            <textarea 
              value={drafts.moodNote}
              onChange={(e) => updateDraft('moodNote', e.target.value)}
              placeholder="What’s shaping today?"
            />
          </label>
          <button className="primary-btn" onClick={handleMoodSubmit}>Save mood</button>
        </div>
      </div>

      <div className="content-grid">
        <div className="panel">
          <div className="section-heading">
            <h2>Symptoms</h2>
            <button className="mini-link" onClick={() => startPeriod(new Date().toISOString().slice(0, 10))}>Log period start</button>
          </div>
          <div className="form-grid">
            <div className="field">
              <span className="section-label">Choose symptoms</span>
              <div className="chip-grid">
                {symptomOptions.map(option => (
                  <button 
                    key={option}
                    type="button" 
                    className={`chip ${drafts.symptomSelection?.includes(option) ? 'is-active' : ''}`}
                    onClick={() => toggleSymptom(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <div className="segmented" role="group" aria-label="Symptom intensity">
              {["mild", "moderate", "strong"].map(value => (
                <button 
                  key={value}
                  type="button" 
                  className={drafts.symptomIntensity === value ? "is-active" : ""}
                  onClick={() => updateDraft('symptomIntensity', value)}
                >
                  {value}
                </button>
              ))}
            </div>
            <label className="field">
              <span>Note</span>
              <textarea 
                value={drafts.symptomNote}
                onChange={(e) => updateDraft('symptomNote', e.target.value)}
                placeholder="Anything specific to remember?"
              />
            </label>
            <button className="primary-btn" onClick={handleSymptomSubmit}>Save symptoms</button>
          </div>
        </div>

        <div className="panel">
          <div className="section-heading">
            <h2>Cycle view</h2>
          </div>
          <div className="timeline">
            <div className="phase-row">
              <span className={`phase-pill ${cycle.phaseKey === "period" ? "is-active" : ""}`}>Period</span>
              <span className={`phase-pill ${cycle.phaseKey === "follicular" ? "is-active" : ""}`}>Follicular</span>
              <span className={`phase-pill ${cycle.phaseKey === "ovulation" ? "is-active" : ""}`}>Ovulation</span>
              <span className={`phase-pill ${cycle.phaseKey === "luteal" ? "is-active" : ""}`}>Luteal</span>
            </div>
            <div>
              <div className="summary-note">Cycle day {cycle.dayInCycle} of {cycle.cycleLength}</div>
              <div className="progress-bar" style={{ marginTop: '10px' }}><span style={{ width: `${cycle.progress}%` }}></span></div>
            </div>
            <p className="muted">This is an approximate cycle model for the MVP. You can refine it later from settings.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
