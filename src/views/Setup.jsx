import { useStore } from '../store/useStore';
import { isoToday, moodOptions, symptomOptions } from '../utils/cycle';

export default function Setup() {
  const setupStep = useStore((state) => state.setupStep);
  const setSetupStep = useStore((state) => state.setSetupStep);
  const completeSetup = useStore((state) => state.completeSetup);
  const profile = useStore((state) => state.profile);
  const updateProfile = useStore((state) => state.updateProfile);

  const total = 4;
  const progressDots = Array.from({ length: total }, (_, index) => (
    <span key={index} className={index === setupStep ? "is-active" : ""}></span>
  ));

  const togglePreference = (key, option) => {
    const list = profile[key] || [];
    const newList = list.includes(option) 
      ? list.filter(item => item !== option) 
      : [...list, option];
    updateProfile({ [key]: newList });
  };

  const screens = [
    {
      title: "A calmer way to track your cycle.",
      subtitle: "Project Luna is a privacy-first period companion that keeps setup gentle, data local, and the experience friendly from the very first step.",
      body: (
        <div className="setup-card-grid">
          <div className="setup-feature">
            <strong>Local-first by default</strong>
            <span>Your information stays on this device unless you choose otherwise later.</span>
          </div>
          <div className="setup-feature">
            <strong>Anonymous mode available</strong>
            <span>Use the app without an account, email, or identity layer.</span>
          </div>
          <div className="setup-feature">
            <strong>Warm, soft, and clear</strong>
            <span>Designed to feel supportive without becoming clinical or overwhelming.</span>
          </div>
        </div>
      )
    },
    {
      title: "When did your last period start?",
      subtitle: "We use this to anchor your cycle predictions. You can update it anytime from the app.",
      body: (
        <div className="field-grid">
          <label className="field">
            <span>Cycle start date</span>
            <input 
              type="date" 
              value={profile.cycleStartDate || isoToday()} 
              onChange={(e) => updateProfile({ cycleStartDate: e.target.value })} 
            />
          </label>
          <label className="field">
            <span>Usual cycle length</span>
            <input 
              type="number" 
              min="21" 
              max="45" 
              value={profile.cycleLength} 
              onChange={(e) => updateProfile({ cycleLength: Number(e.target.value) })} 
            />
          </label>
        </div>
      )
    },
    {
      title: "What would you like to notice?",
      subtitle: "Choose the moods and symptoms you care about most. These preferences help shape the companion and your tracking shortcuts.",
      body: (
        <>
          <div className="field">
            <span>Mood preferences</span>
            <div className="chip-grid">
              {moodOptions.map(option => (
                <button 
                  key={option} 
                  type="button" 
                  className={`chip ${profile.moodPreferences.includes(option) ? "is-active" : ""}`}
                  onClick={() => togglePreference('moodPreferences', option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          <div className="field" style={{ marginTop: '1.5rem' }}>
            <span>Symptom preferences</span>
            <div className="chip-grid">
              {symptomOptions.map(option => (
                <button 
                  key={option} 
                  type="button" 
                  className={`chip ${profile.symptomPreferences.includes(option) ? "is-active" : ""}`}
                  onClick={() => togglePreference('symptomPreferences', option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </>
      )
    },
    {
      title: "Privacy first, always.",
      subtitle: "Project Luna starts local, anonymous, and easy to control. Notifications are optional and you can export or delete your data whenever you want.",
      body: (
        <div className="setup-card-grid">
          <div className="setup-feature">
            <strong>Anonymous mode</strong>
            <span>{profile.anonymousMode ? "On" : "Off"} by default</span>
          </div>
          <div className="setup-feature">
            <strong>Local storage</strong>
            <span>{profile.localOnly ? "Enabled" : "Disabled"} for MVP</span>
          </div>
          <div className="setup-feature">
            <strong>Notifications</strong>
            <span>{profile.reminderEnabled ? "Allowed" : "Not requested yet"}</span>
          </div>
        </div>
      )
    }
  ];

  const current = screens[setupStep];

  return (
    <div className="setup-screen">
      <div className="setup-shell">
        <div className="setup-page">
          <div className="setup-topline">
            <div className="setup-kicker">Project Luna</div>
            <div className="progress-dots" aria-hidden="true">{progressDots}</div>
          </div>
          <div className="setup-panel setup-card">
            <h1 className="setup-title">{current.title}</h1>
            <p className="setup-copy">{current.subtitle}</p>
            
            <div style={{ margin: '2rem 0' }}>
              {current.body}
            </div>

            <div className="setup-footer">
              {setupStep > 0 ? (
                <button className="secondary-btn" onClick={() => setSetupStep(setupStep - 1)}>Back</button>
              ) : <span></span>}
              
              {setupStep < total - 1 ? (
                <button className="secondary-btn" onClick={() => setSetupStep(setupStep + 1)}>Continue</button>
              ) : (
                <button className="primary-btn" onClick={completeSetup}>Finish</button>
              )}
            </div>
            <p className="hint" style={{ marginTop: '18px' }}>
              Privacy note: your data starts on-device and stays under your control.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
