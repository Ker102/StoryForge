const fs = require('fs');

let jsx = fs.readFileSync('client/src/pages/Home.tsx', 'utf8');

// 1. Add onboarded state
jsx = jsx.replace(
  /const \[obStep, setObStep\] = useState\(0\);/,
  `const [obStep, setObStep] = useState(0);\n  const [hasOnboarded, setHasOnboarded] = useState(false);`
);

// 2. Change the "Begin Your Story" button on Splash (s1)
// If they have onboarded, go to S7 (Library/Home). Otherwise, go to S2 (Onboarding).
jsx = jsx.replace(
  /<button className="btn-gold" onClick=\{[(][)] => go[(]'s2'[)]\}>Begin Your Story <span className="btn-arrow">→<\/span><\/button>/g,
  `<button className="btn-gold" onClick={() => go(hasOnboarded ? 's7' : 's2')}>Begin Your Story <span className="btn-arrow">→</span></button>`
);

// 3. Update Onboarding finishes/skips to set hasOnboarded=true and go to S7 (not S3 immediately)
// Wait, the flow was Splash -> Onboarding -> Mode Select -> Config -> Speak.
// Let's just make Onboarding skip/finish set onboarded and go to mode select if they are making a new story,
// OR if the request is that returning users see the Library/Home, let's update S1 to just "Open StoryForge" if onboarded,
// AND in the onboarding, when they click "Skip" or "Get Started", we set onboarded.
// Actually, let's set it so the app naturally goes to Mode Select (s3) when they finish onboarding,
// but the 'hasOnboarded' state means the NEXT time they are on splash (s1), it takes them to library (s7).

jsx = jsx.replace(
  /<button className="btn-ghost" onClick=\{[(][)] => go[(]'s3'[)]\}>Skip<\/button>/g,
  `<button className="btn-ghost" onClick={() => { setHasOnboarded(true); go('s7'); }}>Skip</button>`
);

jsx = jsx.replace(
  /<button className="btn-primary" onClick=\{[(][)] => \{\n\s*if [(]obStep < 2[)] setObStep[(]obStep \+ 1[)];\n\s*else go[(]'s3'[)];\n\s*\}\}>/g,
  `<button className="btn-primary" onClick={() => {\n            if (obStep < 2) setObStep(obStep + 1);\n            else { setHasOnboarded(true); go('s7'); }\n          }}>`
);

// Update Splash to go to Library if onboarded, else Onboarding
jsx = jsx.replace(
  /<button className="btn-gold" onClick=\{[(][)] => go[(]hasOnboarded \? 's7' : 's2'[)]\}>Begin Your Story <span className="btn-arrow">→<\/span><\/button>/g,
  `<button className="btn-gold" onClick={() => go(hasOnboarded ? 's7' : 's2')}>{hasOnboarded ? 'Open Library' : 'Begin Your Story'} <span className="btn-arrow">→</span></button>`
);

fs.writeFileSync('client/src/pages/Home.tsx', jsx);
console.log("Patched onboard state");
