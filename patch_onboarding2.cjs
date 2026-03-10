const fs = require('fs');

let jsx = fs.readFileSync('client/src/pages/Home.tsx', 'utf8');

const s2Regex = /\{\/\* ── S2 ONBOARDING ── \*\/\}(.|\n)*?\{\/\* ── S3 MODE SELECT ── \*\/\}/g;

const newS2 = `{/* ── S2 ONBOARDING ── */}
      <div className={getScreenClass('s2')} id="s2">
        <div className="ob-hero" ref={heroRef}>
          <div className="ob-aurora"></div>
          <div className="ob-constellation" id="constell">
            {cstars.map((s, i) => <div key={\`s-\${i}\`} className="cstar" style={s}></div>)}
            {clines.map((s, i) => <div key={\`l-\${i}\`} className="cline" style={s}></div>)}
          </div>
          <div className="ob-moon">
            <div className="ob-moon-crater" style={{width:'8px', height:'8px', top:'10px', left:'12px'}}></div>
            <div className="ob-moon-crater" style={{width:'5px', height:'5px', top:'22px', left:'22px'}}></div>
          </div>
          <div className="firefly" style={{left:'15%', top:'60%', '--ft':'7s', '--fd':'0s', '--fx':'30px', '--fy':'-50px', '--fx2':'60px', '--fy2':'10px'} as any}></div>
          <div className="firefly" style={{left:'75%', top:'55%', '--ft':'6s', '--fd':'1.2s', '--fx':'-20px', '--fy':'-40px', '--fx2':'-40px', '--fy2':'15px'} as any}></div>
          <div className="firefly" style={{left:'40%', top:'70%', '--ft':'8s', '--fd':'2.5s', '--fx':'40px', '--fy':'-30px', '--fx2':'10px', '--fy2':'20px'} as any}></div>
          <div className="firefly" style={{left:'60%', top:'65%', '--ft':'5.5s', '--fd':'.8s', '--fx':'-30px', '--fy':'-45px', '--fx2':'-50px', '--fy2':'5px'} as any}></div>
          
          <div className="ob-scene" style={{ opacity: obStep === 0 ? 1 : 0, transition: 'opacity 0.4s ease', pointerEvents: obStep === 0 ? 'auto' : 'none', position: 'absolute', bottom: 'clamp(28px,5dvh,50px)', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 4 }}>
            <div className="ob-star-halo">
              <div className="ob-star-ring"></div>
              <div className="ob-star-ring2"></div>
              ⭐
            </div>
            <div className="ob-robot-glow"></div>
            <div className="ob-robot-wrap">🤖</div>
          </div>

          <div className="ob-scene" style={{ opacity: obStep === 1 ? 1 : 0, transition: 'opacity 0.4s ease', pointerEvents: obStep === 1 ? 'auto' : 'none', position: 'absolute', bottom: 'clamp(28px,5dvh,50px)', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 4 }}>
            <div className="ob-star-halo" style={{ background: 'radial-gradient(circle,rgba(85,97,232,0.9),rgba(85,97,232,0.4) 40%,transparent 70%)', filter: 'drop-shadow(0 0 16px rgba(85,97,232,0.8))' }}>
              <div className="ob-star-ring" style={{ borderColor: 'rgba(85,97,232,0.25)' }}></div>
              <div className="ob-star-ring2" style={{ borderColor: 'rgba(85,97,232,0.12)' }}></div>
              🎨
            </div>
            <div className="ob-robot-glow" style={{ background: 'radial-gradient(ellipse,rgba(85,97,232,0.4),transparent 70%)' }}></div>
            <div className="ob-robot-wrap">✨</div>
          </div>

          <div className="ob-scene" style={{ opacity: obStep === 2 ? 1 : 0, transition: 'opacity 0.4s ease', pointerEvents: obStep === 2 ? 'auto' : 'none', position: 'absolute', bottom: 'clamp(28px,5dvh,50px)', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 4 }}>
            <div className="ob-star-halo" style={{ background: 'radial-gradient(circle,rgba(208,64,128,0.9),rgba(208,64,128,0.4) 40%,transparent 70%)', filter: 'drop-shadow(0 0 16px rgba(208,64,128,0.8))' }}>
              <div className="ob-star-ring" style={{ borderColor: 'rgba(208,64,128,0.25)' }}></div>
              <div className="ob-star-ring2" style={{ borderColor: 'rgba(208,64,128,0.12)' }}></div>
              🎧
            </div>
            <div className="ob-robot-glow" style={{ background: 'radial-gradient(ellipse,rgba(208,64,128,0.4),transparent 70%)' }}></div>
            <div className="ob-robot-wrap">📖</div>
          </div>

          <div className="ob-ground-glow"></div>
          <svg className="ob-forest-svg" viewBox="0 0 375 80" fill="none" preserveAspectRatio="none" height="80">
            <path d="M0,80 L0,55 L18,30 L36,55 L36,80 Z" fill="#080b1a"/>
            <path d="M25,80 L25,50 L48,20 L71,50 L71,80 Z" fill="#0a0d20"/>
            <path d="M60,80 L60,52 L80,24 L100,52 L100,80 Z" fill="#080b1a"/>
            <path d="M88,80 L88,56 L104,35 L120,56 L120,80 Z" fill="#0c0f24"/>
            <path d="M255,80 L255,56 L271,35 L287,56 L287,80 Z" fill="#0c0f24"/>
            <path d="M275,80 L275,52 L295,24 L315,52 L315,80 Z" fill="#080b1a"/>
            <path d="M304,80 L304,50 L327,20 L350,50 L350,80 Z" fill="#0a0d20"/>
            <path d="M339,80 L339,55 L357,30 L375,55 L375,80 Z" fill="#080b1a"/>
            <path d="M0,80 L375,80 L375,70 L0,70 Z" fill="#0a0c1e"/>
          </svg>
          <div className="ob-dots">
            <div className={\`od \${obStep === 0 ? 'on' : ''}\`} onClick={() => setObStep(0)}></div>
            <div className={\`od \${obStep === 1 ? 'on' : ''}\`} onClick={() => setObStep(1)}></div>
            <div className={\`od \${obStep === 2 ? 'on' : ''}\`} onClick={() => setObStep(2)}></div>
          </div>
        </div>
        
        <div className="ob-body" style={{ position: 'relative' }}>
          {/* Step 0 Content */}
          <div style={{ opacity: obStep === 0 ? 1 : 0, transition: 'opacity 0.4s ease', pointerEvents: obStep === 0 ? 'auto' : 'none', position: 'absolute', inset: 'var(--sp-md) var(--sp-lg) 0', display: 'flex', flexDirection: 'column', gap: 'var(--sp-xs)' }}>
            <div className="ob-eyebrow">Step 1 of 3 <div className="ob-line"></div></div>
            <div className="ob-h1">Speak your idea.<br/><em>Watch it become a book.</em></div>
            <div className="ob-p">One sentence is all it takes. StoryForge plans the full arc, generates illustrations, and narrates — all at once.</div>
            <div className="ob-pills">
              <div className="ob-pill"><div className="op-dot" style={{background:'var(--amber)'}}></div>Real-time voice</div>
            </div>
          </div>

          {/* Step 1 Content */}
          <div style={{ opacity: obStep === 1 ? 1 : 0, transition: 'opacity 0.4s ease', pointerEvents: obStep === 1 ? 'auto' : 'none', position: 'absolute', inset: 'var(--sp-md) var(--sp-lg) 0', display: 'flex', flexDirection: 'column', gap: 'var(--sp-xs)' }}>
            <div className="ob-eyebrow">Step 2 of 3 <div className="ob-line"></div></div>
            <div className="ob-h1">Stunning Art.<br/><em>In your chosen style.</em></div>
            <div className="ob-p">From delicate watercolours to vibrant pixel art, every page is beautifully illustrated to match your story's mood.</div>
            <div className="ob-pills">
              <div className="ob-pill"><div className="op-dot" style={{background:'var(--indigo)'}}></div>Illustrations</div>
            </div>
          </div>

          {/* Step 2 Content */}
          <div style={{ opacity: obStep === 2 ? 1 : 0, transition: 'opacity 0.4s ease', pointerEvents: obStep === 2 ? 'auto' : 'none', position: 'absolute', inset: 'var(--sp-md) var(--sp-lg) 0', display: 'flex', flexDirection: 'column', gap: 'var(--sp-xs)' }}>
            <div className="ob-eyebrow">Step 3 of 3 <div className="ob-line"></div></div>
            <div className="ob-h1">Sit back.<br/><em>And listen.</em></div>
            <div className="ob-p">Warm, dynamic voices bring your characters to life. Share the final interactive book with family and friends.</div>
            <div className="ob-pills">
              <div className="ob-pill"><div className="op-dot" style={{background:'var(--teal)'}}></div>Live narration</div>
            </div>
          </div>
        </div>
        
        <div className="ob-actions">
          <button className="btn-ghost" onClick={() => go('s3')}>Skip</button>
          <button className="btn-primary" onClick={() => {
            if (obStep < 2) setObStep(obStep + 1);
            else go('s3');
          }}>{obStep < 2 ? 'Next →' : 'Get Started →'}</button>
        </div>
      </div>

      {/* ── S3 MODE SELECT ── */}`;

jsx = jsx.replace(s2Regex, newS2);

fs.writeFileSync('client/src/pages/Home.tsx', jsx);
console.log('Patched onboarding slider');
