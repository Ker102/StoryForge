const fs = require('fs');

let css = fs.readFileSync('client/src/custom.css', 'utf8');
if (!css.includes('.sr-only')) {
  css += `\n/* ─────────────────────────────────────────
   ACCESSIBILITY & ALIGNMENT
───────────────────────────────────────── */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
*:focus-visible {
  outline: 2px solid var(--indigo, #5561e8);
  outline-offset: 2px;
}
.splash-bottom, .ob-body, .ms-head, .speak-main, .export-top {
  text-align: center;
}
.ob-eyebrow, .ob-pills {
  justify-content: center;
}
.ms-list, .cfg-scroll {
  text-align: left;
}
`;
  fs.writeFileSync('client/src/custom.css', css);
}

let jsx = fs.readFileSync('client/src/pages/Home.tsx', 'utf8');

const replacements = [
  {
    from: /<div key=\{m\.id\} className=\{\`mcard \$\{m\.cls\} \$\{selectedMode === m\.id \? 'picked' : ''\}\`\} onClick=\{[(][)] => handleModePick[(]m\.id[)]\}>/g,
    to: `<div role="button" tabIndex={0} key={m.id} className={\`mcard \${m.cls} \${selectedMode === m.id ? 'picked' : ''}\`} onClick={() => handleModePick(m.id)} onKeyDown={(e) => { if(e.key==='Enter'||e.key===' ') { e.preventDefault(); handleModePick(m.id); } }}>`
  },
  {
    from: /<div key=\{s\.id\} className=\{\`style-tile \$\{selectedStyle === s\.id \? 'on' : ''\}\`\} onClick=\{[(][)] => setSelectedStyle[(]s\.id[)]\}>/g,
    to: `<div role="button" tabIndex={0} key={s.id} className={\`style-tile \${selectedStyle === s.id ? 'on' : ''}\`} onClick={() => setSelectedStyle(s.id)} onKeyDown={(e) => { if(e.key==='Enter'||e.key===' ') { e.preventDefault(); setSelectedStyle(s.id); } }}>`
  },
  {
    from: /<div key=\{c\} className=\{\`chip \$\{selectedLength === c \? 'on' : ''\}\`\} onClick=\{[(][)] => setSelectedLength[(]c[)]\}>/g,
    to: `<div role="button" tabIndex={0} key={c} className={\`chip \${selectedLength === c ? 'on' : ''}\`} onClick={() => setSelectedLength(c)} onKeyDown={(e) => { if(e.key==='Enter'||e.key===' ') { e.preventDefault(); setSelectedLength(c); } }}>`
  },
  {
    from: /<div key=\{c\} className=\{\`chip \$\{selectedVoice === c \? 'on' : ''\}\`\} onClick=\{[(][)] => setSelectedVoice[(]c[)]\}>/g,
    to: `<div role="button" tabIndex={0} key={c} className={\`chip \${selectedVoice === c ? 'on' : ''}\`} onClick={() => setSelectedVoice(c)} onKeyDown={(e) => { if(e.key==='Enter'||e.key===' ') { e.preventDefault(); setSelectedVoice(c); } }}>`
  },
  {
    from: /<div key=\{c\} className=\{\`chip \$\{selectedLang === c \? 'on' : ''\}\`\} onClick=\{[(][)] => setSelectedLang[(]c[)]\}>/g,
    to: `<div role="button" tabIndex={0} key={c} className={\`chip \${selectedLang === c ? 'on' : ''}\`} onClick={() => setSelectedLang(c)} onKeyDown={(e) => { if(e.key==='Enter'||e.key===' ') { e.preventDefault(); setSelectedLang(c); } }}>`
  },
  {
    from: /<div className="new-card" onClick=\{[(][)] => go[(]'s4'[)]\}>/g,
    to: `<div role="button" tabIndex={0} className="new-card" onClick={() => go('s4')} onKeyDown={(e) => { if(e.key==='Enter'||e.key===' ') { e.preventDefault(); go('s4'); } }}>`
  },
  {
    from: /<div className="s-card" onClick=\{[(][)] => go[(]'s6'[)]\}>/g,
    to: `<div role="button" tabIndex={0} className="s-card" onClick={() => go('s6')} onKeyDown={(e) => { if(e.key==='Enter'||e.key===' ') { e.preventDefault(); go('s6'); } }}>`
  },
  {
    from: /<div className="s-card" onClick=\{[(][)] => go[(]'s8'[)]\}>/g,
    to: `<div role="button" tabIndex={0} className="s-card" onClick={() => go('s8')} onKeyDown={(e) => { if(e.key==='Enter'||e.key===' ') { e.preventDefault(); go('s8'); } }}>`
  },
  {
    from: /<div key=\{g\} className=\{\`gpill \$\{selectedGenre === g \? 'on' : ''\}\`\} onClick=\{[(][)] => setSelectedGenre[(]g[)]\}>/g,
    to: `<div role="button" tabIndex={0} key={g} className={\`gpill \${selectedGenre === g ? 'on' : ''}\`} onClick={() => setSelectedGenre(g)} onKeyDown={(e) => { if(e.key==='Enter'||e.key===' ') { e.preventDefault(); setSelectedGenre(g); } }}>`
  },
  {
    from: /<div key=\{t\.id\} className=\{\`tab \$\{selectedTab === t\.id \? 'on' : ''\}\`\} onClick=\{[(][)] => \{ setSelectedTab[(]t\.id[)]; if[(]t\.action[)] t\.action[(][)]; \}\}>/g,
    to: `<div role="button" tabIndex={0} key={t.id} className={\`tab \${selectedTab === t.id ? 'on' : ''}\`} onClick={() => { setSelectedTab(t.id); if(t.action) t.action(); }} onKeyDown={(e) => { if(e.key==='Enter'||e.key===' ') { e.preventDefault(); setSelectedTab(t.id); if(t.action) t.action(); } }}>`
  },
  {
    from: /<button className="btn-back" onClick=\{[(][)] => go[(]'s2'[)]\}>←<\/button>/g,
    to: `<button className="btn-back" aria-label="Go back" onClick={() => go('s2')}>←</button>`
  },
  {
    from: /<button className="btn-back" onClick=\{[(][)] => go[(]'s3'[)]\}>←<\/button>/g,
    to: `<button className="btn-back" aria-label="Go back" onClick={() => go('s3')}>←</button>`
  },
  {
    from: /<button className="btn-close" onClick=\{[(][)] => go[(]'s4'[)]\}>✕<\/button>/g,
    to: `<button className="btn-close" aria-label="Close" onClick={() => go('s4')}>✕</button>`
  },
  {
    from: /<button className="steer-mic" onClick=\{[(][)] => go[(]'s7'[)]\}>🎙️<\/button>/g,
    to: `<button className="steer-mic" aria-label="Speak direction" onClick={() => go('s7')}>🎙️</button>`
  },
  {
    from: /<input className="cfg-input" defaultValue="A small robot who finds a glowing star in a forest" \/>/g,
    to: `<input className="cfg-input" aria-label="Story Seed" defaultValue="A small robot who finds a glowing star in a forest" />`
  },
  {
    from: /<input className="steer-input" placeholder='Say "add a twist"…' \/>/g,
    to: `<input className="steer-input" aria-label="Steer the story" placeholder='Say "add a twist"…' />`
  }
];

replacements.forEach(r => {
  jsx = jsx.replace(r.from, r.to);
});

jsx = jsx.replace(/<span style=\{\{fontWeight:500, textTransform:'none', letterSpacing:0\}\}>\(optional\)<\/span>/g, `<span style={{fontWeight:500, textTransform:'none', letterSpacing:0, fontSize:'var(--t-xs)', color:'var(--dm)'}}>(optional)</span>`);

fs.writeFileSync('client/src/pages/Home.tsx', jsx);
console.log('Patched a11y');
