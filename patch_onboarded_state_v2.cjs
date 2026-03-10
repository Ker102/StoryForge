const fs = require('fs');

let jsx = fs.readFileSync('client/src/pages/Home.tsx', 'utf8');

// I also need to update the "New Story" path from S7 to S3 instead of S4
jsx = jsx.replace(
  /<div role="button" tabIndex=\{0\} className="new-card" onClick=\{[(][)] => go[(]'s4'[)]\} onKeyDown=\{\(e\) => \{ if[(]e\.key==='Enter'\|\|e\.key===' '[)] \{ e\.preventDefault[(][)]; go[(]'s4'[)]; \} \}\}>/g,
  `<div role="button" tabIndex={0} className="new-card" onClick={() => go('s3')} onKeyDown={(e) => { if(e.key==='Enter'||e.key===' ') { e.preventDefault(); go('s3'); } }}>`
);

jsx = jsx.replace(
  /<div key=\{t\.id\} className=\{\`tab \$\{selectedTab === t\.id \? 'on' : ''\}\`\} onClick=\{[(][)] => \{ setSelectedTab[(]t\.id[)]; if[(]t\.action[)] t\.action[(][)]; \}\} onKeyDown=\{\(e\) => \{ if[(]e\.key==='Enter'\|\|e\.key===' '[)] \{ e\.preventDefault[(][)]; setSelectedTab[(]t\.id[)]; if[(]t\.action[)] t\.action[(][)]; \} \}\}>/g,
  `<div role="button" tabIndex={0} key={t.id} className={\`tab \${selectedTab === t.id ? 'on' : ''}\`} onClick={() => { setSelectedTab(t.id); if(t.action) t.action(); }} onKeyDown={(e) => { if(e.key==='Enter'||e.key===' ') { e.preventDefault(); setSelectedTab(t.id); if(t.action) t.action(); } }}>`
);

// We need to fix the t.action() from "go('s4')" to "go('s3')" on the tabbar
jsx = jsx.replace(
  /\{ id: 'Create', ico: '✨', action: [(][)] => go[(]'s4'[)] \},/g,
  `{ id: 'Create', ico: '✨', action: () => go('s3') },`
);

// And we should ensure the Back button on Mode Select (s3) goes to Library (s7) if onboarded, else Splash (s1)
jsx = jsx.replace(
  /<button className="btn-back" aria-label="Go back" onClick=\{[(][)] => go[(]'s2'[)]\}>←<\/button>/g,
  `<button className="btn-back" aria-label="Go back" onClick={() => go(hasOnboarded ? 's7' : 's1')}>←</button>`
);

fs.writeFileSync('client/src/pages/Home.tsx', jsx);
console.log("Patched routing for S3");
