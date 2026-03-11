const fs = require('fs');

let jsx = fs.readFileSync('client/src/pages/Home.tsx', 'utf8');

// We will reconstruct the S7 section.
const s7Regex = /\{\/\* ── S7 LIBRARY ── \*\/\}(.|\n)*?\{\/\* ── S8 EXPORT ── \*\/\}/g;

const newS7 = `{/* ── S7 LIBRARY ── */}
      <div className={getScreenClass('s7')} id="s7">
        <div className="lib-top">
          <div><div className="lib-greet">Good evening,</div><div className="lib-name">Amara 👋</div></div>
          <div className="lib-avatar">🧒</div>
        </div>
        <div role="button" tabIndex={0} className="new-card" onClick={() => go('s3')} onKeyDown={(e) => { if(e.key==='Enter'||e.key===' ') { e.preventDefault(); go('s3'); } }}>
          <div className="nc-ico">🎙️</div>
          <div><div className="nc-title">New Story</div><div className="nc-sub">Speak a sentence. Get a book.</div></div>
          <div className="nc-arrow">→</div>
        </div>
        
        <div className="sec-row"><span className="sec-title">Browse</span><span className="sec-link">See all →</span></div>
        <div className="genre-row">
          {['All', 'Adventure', 'Fantasy', 'Mystery', 'Animals'].map(g => (
            <div role="button" tabIndex={0} key={g} className={\`gpill \${selectedGenre === g ? 'on' : ''}\`} onClick={() => setSelectedGenre(g)} onKeyDown={(e) => { if(e.key==='Enter'||e.key===' ') { e.preventDefault(); setSelectedGenre(g); } }}>{g}</div>
          ))}
        </div>

        <div className="sec-row" style={{paddingTop: 'var(--sp-sm)'}}><span className="sec-title">Library</span></div>
        <div className="s-row">
          <div role="button" tabIndex={0} className="s-card" onClick={() => go('s6')} onKeyDown={(e) => { if(e.key==='Enter'||e.key===' ') { e.preventDefault(); go('s6'); } }}>
            <div className="sc-cover scc1">🌟<div className="sc-badge">6 pp</div></div>
            <div className="sc-info"><div className="sc-title">Pip and the Glowing Star</div><div className="sc-meta">Page 3 · Watercolour</div></div>
          </div>
          <div className="s-card">
            <div className="sc-cover scc2">🦋<div className="sc-badge">8 pp</div></div>
            <div className="sc-info"><div className="sc-title">Luna and the Moongate</div><div className="sc-meta">Finished · Pastel</div></div>
          </div>
          <div role="button" tabIndex={0} className="s-card" onClick={() => go('s8')} onKeyDown={(e) => { if(e.key==='Enter'||e.key===' ') { e.preventDefault(); go('s8'); } }}>
            <div className="sc-cover scc3">🐉<div className="sc-badge">12 pp</div></div>
            <div className="sc-info"><div className="sc-title">The Last Dragon Keeper</div><div className="sc-meta">Page 7 · Cinematic</div></div>
          </div>
        </div>

        <div className="tabbar">
          {[
            { id: 'Home', ico: '🏠' },
            { id: 'Library', ico: '📚' },
            { id: 'Create', ico: '✨', action: () => go('s3') },
            { id: 'Profile', ico: '👤' }
          ].map(t => (
            <div role="button" tabIndex={0} key={t.id} className={\`tab \${selectedTab === t.id ? 'on' : ''}\`} onClick={() => { setSelectedTab(t.id); if(t.action) t.action(); }} onKeyDown={(e) => { if(e.key==='Enter'||e.key===' ') { e.preventDefault(); setSelectedTab(t.id); if(t.action) t.action(); } }}>
              <div className="tab-ico">{t.ico}</div>
              <div className="tab-lbl">{t.id}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── S8 EXPORT ── */}`;

jsx = jsx.replace(s7Regex, newS7);

fs.writeFileSync('client/src/pages/Home.tsx', jsx);
console.log('Patched S7 layout');
