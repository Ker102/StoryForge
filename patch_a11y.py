import re

# Update CSS
with open('client/src/custom.css', 'r') as f:
    css = f.read()

if '.sr-only' not in css:
    css += """
/* ─────────────────────────────────────────
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
"""
    with open('client/src/custom.css', 'w') as f:
        f.write(css)

# Update JSX
with open('client/src/pages/Home.tsx', 'r') as f:
    jsx = f.read()

replacements = [
    (r'<div key=\{m\.id\} className=\{\`mcard \$\{m\.cls\} \$\{selectedMode === m\.id \? \'picked\' : \'\'\}\`\} onClick=\{[(][)] => handleModePick[(]m\.id[)]\}>',
     r'<div role="button" tabIndex={0} key={m.id} className={`mcard ${m.cls} ${selectedMode === m.id ? \'picked\' : \'\'}`} onClick={() => handleModePick(m.id)} onKeyDown={(e) => { if(e.key===\'Enter\'||e.key===\' \') { e.preventDefault(); handleModePick(m.id); } }}>'),
    
    (r'<div key=\{s\.id\} className=\{\`style-tile \$\{selectedStyle === s\.id \? \'on\' : \'\'\}\`\} onClick=\{[(][)] => setSelectedStyle[(]s\.id[)]\}>',
     r'<div role="button" tabIndex={0} key={s.id} className={`style-tile ${selectedStyle === s.id ? \'on\' : \'\'}`} onClick={() => setSelectedStyle(s.id)} onKeyDown={(e) => { if(e.key===\'Enter\'||e.key===\' \') { e.preventDefault(); setSelectedStyle(s.id); } }}>'),
     
    (r'<div key=\{c\} className=\{\`chip \$\{selectedLength === c \? \'on\' : \'\'\}\`\} onClick=\{[(][)] => setSelectedLength[(]c[)]\}>',
     r'<div role="button" tabIndex={0} key={c} className={`chip ${selectedLength === c ? \'on\' : \'\'}`} onClick={() => setSelectedLength(c)} onKeyDown={(e) => { if(e.key===\'Enter\'||e.key===\' \') { e.preventDefault(); setSelectedLength(c); } }}>'),
     
    (r'<div key=\{c\} className=\{\`chip \$\{selectedVoice === c \? \'on\' : \'\'\}\`\} onClick=\{[(][)] => setSelectedVoice[(]c[)]\}>',
     r'<div role="button" tabIndex={0} key={c} className={`chip ${selectedVoice === c ? \'on\' : \'\'}`} onClick={() => setSelectedVoice(c)} onKeyDown={(e) => { if(e.key===\'Enter\'||e.key===\' \') { e.preventDefault(); setSelectedVoice(c); } }}>'),
     
    (r'<div key=\{c\} className=\{\`chip \$\{selectedLang === c \? \'on\' : \'\'\}\`\} onClick=\{[(][)] => setSelectedLang[(]c[)]\}>',
     r'<div role="button" tabIndex={0} key={c} className={`chip ${selectedLang === c ? \'on\' : \'\'}`} onClick={() => setSelectedLang(c)} onKeyDown={(e) => { if(e.key===\'Enter\'||e.key===\' \') { e.preventDefault(); setSelectedLang(c); } }}>'),
     
    (r'<div className="new-card" onClick=\{[(][)] => go[(]\'s4\'[)]\}>',
     r'<div role="button" tabIndex={0} className="new-card" onClick={() => go(\'s4\')} onKeyDown={(e) => { if(e.key===\'Enter\'||e.key===\' \') { e.preventDefault(); go(\'s4\'); } }}>'),
     
    (r'<div className="s-card" onClick=\{[(][)] => go[(]\'s6\'[)]\}>',
     r'<div role="button" tabIndex={0} className="s-card" onClick={() => go(\'s6\')} onKeyDown={(e) => { if(e.key===\'Enter\'||e.key===\' \') { e.preventDefault(); go(\'s6\'); } }}>'),
     
    (r'<div className="s-card" onClick=\{[(][)] => go[(]\'s8\'[)]\}>',
     r'<div role="button" tabIndex={0} className="s-card" onClick={() => go(\'s8\')} onKeyDown={(e) => { if(e.key===\'Enter\'||e.key===\' \') { e.preventDefault(); go(\'s8\'); } }}>'),
     
    (r'<div key=\{g\} className=\{\`gpill \$\{selectedGenre === g \? \'on\' : \'\'\}\`\} onClick=\{[(][)] => setSelectedGenre[(]g[)]\}>',
     r'<div role="button" tabIndex={0} key={g} className={`gpill ${selectedGenre === g ? \'on\' : \'\'}`} onClick={() => setSelectedGenre(g)} onKeyDown={(e) => { if(e.key===\'Enter\'||e.key===\' \') { e.preventDefault(); setSelectedGenre(g); } }}>'),
     
    (r'<div key=\{t\.id\} className=\{\`tab \$\{selectedTab === t\.id \? \'on\' : \'\'\}\`\} onClick=\{[(][)] => \{ setSelectedTab[(]t\.id[)]; if[(]t\.action[)] t\.action[(][)]; \}\}>',
     r'<div role="button" tabIndex={0} key={t.id} className={`tab ${selectedTab === t.id ? \'on\' : \'\'}`} onClick={() => { setSelectedTab(t.id); if(t.action) t.action(); }} onKeyDown={(e) => { if(e.key===\'Enter\'||e.key===\' \') { e.preventDefault(); setSelectedTab(t.id); if(t.action) t.action(); } }}>'),
     
    (r'<button className="btn-back" onClick=\{[(][)] => go[(]\'s2\'[)]\}>←<\/button>',
     r'<button className="btn-back" aria-label="Go back" onClick={() => go(\'s2\')}>←</button>'),
     
    (r'<button className="btn-back" onClick=\{[(][)] => go[(]\'s3\'[)]\}>←<\/button>',
     r'<button className="btn-back" aria-label="Go back" onClick={() => go(\'s3\')}>←</button>'),
     
    (r'<button className="btn-close" onClick=\{[(][)] => go[(]\'s4\'[)]\}>✕<\/button>',
     r'<button className="btn-close" aria-label="Close" onClick={() => go(\'s4\')}>✕</button>'),
     
    (r'<button className="steer-mic" onClick=\{[(][)] => go[(]\'s7\'[)]\}>🎙️<\/button>',
     r'<button className="steer-mic" aria-label="Speak direction" onClick={() => go(\'s7\')}>🎙️</button>'),
     
    (r'<input className="cfg-input" defaultValue="A small robot who finds a glowing star in a forest" \/>',
     r'<input className="cfg-input" aria-label="Story Seed" defaultValue="A small robot who finds a glowing star in a forest" />'),
     
    (r'<input className="steer-input" placeholder=\'Say "add a twist"…\' \/>',
     r'<input className="steer-input" aria-label="Steer the story" placeholder=\'Say "add a twist"…\' />'),
     
    (r'<span style=\{\{fontWeight:500, textTransform:\'none\', letterSpacing:0\}\}>\(optional\)<\/span>',
     r'<span style={{fontWeight:500, textTransform:\'none\', letterSpacing:0, fontSize:\'var(--t-xs)\', color:\'var(--dm)\'}}>(optional)</span>')
]

for old, new_str in replacements:
    jsx = re.sub(old, new_str, jsx)

with open('client/src/pages/Home.tsx', 'w') as f:
    f.write(jsx)

print("Patched a11y and alignments")
