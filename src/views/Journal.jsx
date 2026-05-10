import { useStore } from '../store/useStore';
import { formatShortDate } from '../utils/cycle';

export default function Journal() {
  const logs = useStore((state) => state.logs);
  const drafts = useStore((state) => state.drafts);
  const updateDraft = useStore((state) => state.updateDraft);
  const saveJournal = useStore((state) => state.saveJournal);

  const handleJournalSubmit = () => {
    saveJournal({
      title: drafts.journalTitle,
      body: drafts.journalBody
    });
  };

  const sortedJournals = logs.journals?.slice().sort((a, b) => new Date(b.date) - new Date(a.date)) || [];

  return (
    <section className="section">
      <div className="panel">
        <div className="section-heading">
          <h2>Journal</h2>
          <span className="muted">Private notes stay on your device</span>
        </div>
        <div className="form-grid">
          <label className="field">
            <span>Title</span>
            <input 
              type="text" 
              value={drafts.journalTitle}
              onChange={(e) => updateDraft('journalTitle', e.target.value)}
              placeholder="A small note about today" 
            />
          </label>
          <label className="field">
            <span>Entry</span>
            <textarea 
              value={drafts.journalBody}
              onChange={(e) => updateDraft('journalBody', e.target.value)}
              placeholder="Write whatever feels useful." 
            />
          </label>
          <button className="primary-btn" onClick={handleJournalSubmit}>Save entry</button>
        </div>
      </div>

      <div className="panel">
        <div className="section-heading">
          <h2>Recent entries</h2>
        </div>
        <div className="entry-list">
          {sortedJournals.length > 0 ? (
            sortedJournals.map((entry) => (
              <article key={entry.id} className="entry">
                <div className="entry-top">
                  <strong>{entry.title || "Journal entry"}</strong>
                  <span>{formatShortDate(entry.date)}</span>
                </div>
                <p>{entry.body}</p>
              </article>
            ))
          ) : (
            <p className="muted">You haven’t written anything yet. Start with a simple line about how your body feels.</p>
          )}
        </div>
      </div>
    </section>
  );
}
