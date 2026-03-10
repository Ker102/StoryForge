import { useState, useEffect, useRef, useMemo } from 'react';

const pts = [
  {x:14,y:18},{x:28,y:10},{x:45,y:15},{x:58,y:8},{x:72,y:20},
  {x:82,y:12},{x:18,y:38},{x:35,y:32},{x:52,y:40},{x:66,y:28},
  {x:78,y:42},{x:88,y:25},{x:10,y:55},{x:25,y:62},{x:42,y:58},
  {x:55,y:68},{x:70,y:55},{x:85,y:62}
];

export default function Home() {
  const [activeScreen, setActiveScreen] = useState('s1');
  const [exitScreen, setExitScreen] = useState<string | null>(null);

  const go = (id: string) => {
    if (activeScreen === id) return;
    setExitScreen(activeScreen);
    setActiveScreen(id);
    setTimeout(() => setExitScreen(null), 380);

    // Sync tab selection with screen changes
    if (id === 's1' || id === 's2' || id === 's7') setSelectedTab('Home');
    else if (id === 's9') setSelectedTab('Library');
    else if (['s3', 's4', 's5', 's6'].includes(id)) setSelectedTab('Create');
  };

  const getScreenClass = (id: string) => {
    let classes = "screen";
    if (activeScreen === id) classes += " active";
    if (exitScreen === id) classes += " exit";
    return classes;
  };

  const stars = useMemo(() => {
    const result = [];
    for (let i = 0; i < 60; i++) {
      const sz = Math.random() * 2.2 + 0.4;
      result.push({
        id: i,
        width: `${sz}px`,
        height: `${sz}px`,
        top: `${Math.random()*78}%`,
        left: `${Math.random()*100}%`,
        '--d': `${(Math.random()*3+1.5).toFixed(1)}s`,
        '--dl': `${(Math.random()*5).toFixed(1)}s`
      } as React.CSSProperties);
    }
    return result;
  }, []);

  const cstars = useMemo(() => {
    return pts.map((p, i) => {
      const sz = Math.random() * 2.5 + 1;
      return {
        id: i,
        width: `${sz}px`,
        height: `${sz}px`,
        left: `${p.x}%`,
        top: `${p.y}%`,
        '--cd': `${(Math.random()*3+2).toFixed(1)}s`,
        '--cl': `${(Math.random()*4).toFixed(1)}s`
      } as React.CSSProperties;
    });
  }, []);

  const heroRef = useRef<HTMLDivElement>(null);
  const [clines, setClines] = useState<React.CSSProperties[]>([]);

  useEffect(() => {
    const w = heroRef.current ? heroRef.current.offsetWidth : 375;
    const h = heroRef.current ? heroRef.current.offsetHeight : 296;
    const lines = [];
    for (let i = 0; i < pts.length - 1; i += 2) {
      const a = pts[i], b = pts[i+1];
      const dx = ((b.x - a.x) / 100) * w;
      const dy = ((b.y - a.y) / 100) * h;
      const len = Math.sqrt(dx*dx + dy*dy);
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      lines.push({
        width: `${len}px`,
        height: '1px',
        left: `${a.x}%`,
        top: `${a.y}%`,
        transform: `rotate(${angle}deg)`
      } as React.CSSProperties);
    }
    setClines(lines);
  }, []);

  // State for selections
  const [obStep, setObStep] = useState(0);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [selectedMode, setSelectedMode] = useState('ch');
  const [selectedStyle, setSelectedStyle] = useState('wc');
  const [selectedLength, setSelectedLength] = useState('6 pages');
  const [selectedVoice, setSelectedVoice] = useState('🧡 Warm');
  const [selectedLang, setSelectedLang] = useState('🇬🇧 English');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedTab, setSelectedTab] = useState('Home');

  // Trigger pop animation for mode checks by unsetting and resetting a key
  const [modeKey, setModeKey] = useState(0);
  const handleModePick = (id: string) => {
    if (selectedMode !== id) {
      setSelectedMode(id);
      setModeKey(prev => prev + 1);
    }
  };

  return (
    <div className="app">
      {/* ── S1 SPLASH ── */}
      <div className={getScreenClass('s1')} id="s1">
        <div className="splash-stars" id="stars">
          {stars.map((s, i) => (
            <div key={i} className="star" style={s}></div>
          ))}
        </div>
        <div className="splash-aurora"></div>
        <div className="splash-cards">
          <div className="sc sc1">📖</div>
          <div className="sc sc2">✨</div>
          <div className="sc sc3">🌙</div>
        </div>
        <div className="splash-bottom">
          <div className="splash-logo">Story<em>Forge</em></div>
          <div className="splash-tag">Speak a sentence. Get a book.</div>
          <button className="btn-gold" onClick={() => go(hasOnboarded ? 's7' : 's2')}>{hasOnboarded ? 'Open Library' : 'Begin Your Story'} <span className="btn-arrow">→</span></button>
          <div className="splash-link">Already have an account? <a href="#">Sign in</a></div>
        </div>
      </div>

      {/* ── S2 ONBOARDING ── */}
      <div className={getScreenClass('s2')} id="s2">
        <div className="ob-hero" ref={heroRef}>
          <div className="ob-aurora"></div>
          <div className="ob-constellation" id="constell">
            {cstars.map((s, i) => <div key={`s-${i}`} className="cstar" style={s}></div>)}
            {clines.map((s, i) => <div key={`l-${i}`} className="cline" style={s}></div>)}
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
            <div className={`od ${obStep === 0 ? 'on' : ''}`} onClick={() => setObStep(0)}></div>
            <div className={`od ${obStep === 1 ? 'on' : ''}`} onClick={() => setObStep(1)}></div>
            <div className={`od ${obStep === 2 ? 'on' : ''}`} onClick={() => setObStep(2)}></div>
          </div>
        </div>
        
        <div className="ob-body" style={{ display: 'grid', placeItems: 'center' }}>
          {/* Step 0 Content */}
          <div style={{ gridArea: '1/1', opacity: obStep === 0 ? 1 : 0, transition: 'opacity 0.4s ease', pointerEvents: obStep === 0 ? 'auto' : 'none', display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)', width: '100%' }}>
            <div className="ob-h1" style={{ fontSize: 'clamp(32px, 8vw, 42px)' }}>Speak your idea.<br/><em>Watch it become a book.</em></div>
            <div className="ob-p" style={{ fontSize: 'clamp(16px, 4vw, 18px)' }}>One sentence is all it takes. StoryForge plans the full arc, generates illustrations, and narrates — all at once.</div>
            <div className="ob-pills">
              <div className="ob-pill"><div className="op-dot" style={{background:'var(--amber)'}}></div>Real-time voice</div>
            </div>
          </div>

          {/* Step 1 Content */}
          <div style={{ gridArea: '1/1', opacity: obStep === 1 ? 1 : 0, transition: 'opacity 0.4s ease', pointerEvents: obStep === 1 ? 'auto' : 'none', display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)', width: '100%' }}>
            <div className="ob-h1" style={{ fontSize: 'clamp(32px, 8vw, 42px)' }}>Stunning Art.<br/><em>In your chosen style.</em></div>
            <div className="ob-p" style={{ fontSize: 'clamp(16px, 4vw, 18px)' }}>From delicate watercolours to vibrant pixel art, every page is beautifully illustrated to match your story's mood.</div>
            <div className="ob-pills">
              <div className="ob-pill"><div className="op-dot" style={{background:'var(--indigo)'}}></div>Illustrations</div>
            </div>
          </div>

          {/* Step 2 Content */}
          <div style={{ gridArea: '1/1', opacity: obStep === 2 ? 1 : 0, transition: 'opacity 0.4s ease', pointerEvents: obStep === 2 ? 'auto' : 'none', display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)', width: '100%' }}>
            <div className="ob-h1" style={{ fontSize: 'clamp(32px, 8vw, 42px)' }}>Sit back.<br/><em>And listen.</em></div>
            <div className="ob-p" style={{ fontSize: 'clamp(16px, 4vw, 18px)' }}>Warm, dynamic voices bring your characters to life. Share the final interactive book with family and friends.</div>
            <div className="ob-pills">
              <div className="ob-pill"><div className="op-dot" style={{background:'var(--teal)'}}></div>Live narration</div>
            </div>
          </div>
        </div>
        
        <div className="ob-actions">
          <button className="btn-ghost" onClick={() => { setHasOnboarded(true); go('s7'); }}>Skip</button>
          <button className="btn-primary" onClick={() => {
            if (obStep < 2) setObStep(obStep + 1);
            else { setHasOnboarded(true); go('s7'); }
          }}>{obStep < 2 ? 'Next →' : 'Get Started →'}</button>
        </div>
      </div>

      {/* ── S3 MODE SELECT ── */}
      <div className={getScreenClass('s3')} id="s3">
        <div className="topbar">
          <button className="btn-back" aria-label="Go back" onClick={() => go(hasOnboarded ? 's7' : 's1')}>←</button>
          <button className="btn-skip-txt" onClick={() => go('s4')}>Skip</button>
        </div>
        <div className="ms-head">
          <div className="ms-title">Choose your<br/><em>story mode.</em></div>
          <div className="ms-sub">StoryForge adapts vocabulary, themes and pacing to your audience.</div>
        </div>
        <div className="ms-list">
          {[
            { id: 'ch', name: 'Children', ages: 'Ages 4–12', desc: 'Simple words, bright imagery, warm moral arcs. 4–8 pages.', ico: '📖', cls: 'mc-ch' },
            { id: 'te', name: 'Teen', ages: 'Ages 13–17', desc: 'Richer themes, plot twists, complex arcs. Up to 15 pages.', ico: '⚡', cls: 'mc-te' },
            { id: 'cr', name: 'Creator', ages: 'Adults & Writers', desc: 'Full creative freedom. Dark themes, open endings.', ico: '✍️', cls: 'mc-cr' },
            { id: 'ed', name: 'Educator', ages: 'Classroom Use', desc: 'Illustrated explainers with narration and learning cues.', ico: '📚', cls: 'mc-ed' },
          ].map(m => (
            <div role="button" tabIndex={0} key={m.id} className={`mcard ${m.cls} ${selectedMode === m.id ? 'picked' : ''}`} onClick={() => handleModePick(m.id)} onKeyDown={(e) => { if(e.key==='Enter'||e.key===' ') { e.preventDefault(); handleModePick(m.id); } }}>
              <div key={modeKey} className="mcheck">✓</div>
              <div className={`mc-banner mc-banner-${m.id}`}></div>
              <div className="mc-inner">
                <div className={`mc-ico mc-ico-${m.id}`}>{m.ico}</div>
                <div className="mc-text">
                  <div className="mc-name">{m.name}</div>
                  <div className={`mc-ages mc-ages-${m.id}`}>{m.ages}</div>
                  <div className="mc-desc">{m.desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="ms-cta">
          <button className="btn-full" onClick={() => go('s4')}>Configure My Story →</button>
        </div>
      </div>

      {/* ── S4 CONFIGURE ── */}
      <div className={getScreenClass('s4')} id="s4">
        <div className="topbar">
          <button className="btn-back" aria-label="Go back" onClick={() => go('s3')}>←</button>
          <span className="top-title">Story Settings</span>
          <div style={{width:'36px'}}></div>
        </div>
        <div className="cfg-scroll">
          <div className="sec-head">Visual Style</div>
          <div className="style-row">
            {[
              { id: 'wc', lbl: 'Watercolour', img: '🎨', cls: 'st-wc' },
              { id: 'dp', lbl: 'Pastel', img: '🌸', cls: 'st-dp' },
              { id: 'px', lbl: 'Pixel Art', img: '🎮', cls: 'st-px' },
              { id: 'ik', lbl: 'Ink Sketch', img: '✏️', cls: 'st-ik' },
              { id: 'ci', lbl: 'Cinematic', img: '🎬', cls: 'st-ci', style: {color:'#fff', background:'#1a2028'} }
            ].map(s => (
              <div role="button" tabIndex={0} key={s.id} className={`style-tile ${selectedStyle === s.id ? 'on' : ''}`} onClick={() => setSelectedStyle(s.id)} onKeyDown={(e) => { if(e.key==='Enter'||e.key===' ') { e.preventDefault(); setSelectedStyle(s.id); } }}>
                <div className={`st-img ${s.cls}`}>{s.img}</div>
                <div className="st-lbl" style={s.style}>{s.lbl}</div>
              </div>
            ))}
          </div>

          <div className="sec-head">Story Length</div>
          <div className="chip-row">
            {['4 pages', '6 pages', '8 pages', '12 pages'].map(c => (
              <div role="button" tabIndex={0} key={c} className={`chip ${selectedLength === c ? 'on' : ''}`} onClick={() => setSelectedLength(c)} onKeyDown={(e) => { if(e.key==='Enter'||e.key===' ') { e.preventDefault(); setSelectedLength(c); } }}>{c}</div>
            ))}
          </div>

          <div className="sec-head">Story Seed <span style={{fontWeight:500, textTransform:'none', letterSpacing:0, fontSize:'var(--t-xs)', color:'var(--dm)'}}>(optional)</span></div>
          <input className="cfg-input" aria-label="Story Seed" defaultValue="A small robot who finds a glowing star in a forest" />

          <div className="sec-head">Narrator Voice</div>
          <div className="chip-row">
            {['🧡 Warm', '✨ Playful', '🌿 Calm', '⚡ Dynamic'].map(c => (
              <div role="button" tabIndex={0} key={c} className={`chip ${selectedVoice === c ? 'on' : ''}`} onClick={() => setSelectedVoice(c)} onKeyDown={(e) => { if(e.key==='Enter'||e.key===' ') { e.preventDefault(); setSelectedVoice(c); } }}>{c}</div>
            ))}
          </div>

          <div className="sec-head">Language</div>
          <div className="chip-row">
            {['🇬🇧 English', '🇫🇷 French', '🇪🇸 Spanish', '🇳🇬 Yoruba'].map(c => (
              <div role="button" tabIndex={0} key={c} className={`chip ${selectedLang === c ? 'on' : ''}`} onClick={() => setSelectedLang(c)} onKeyDown={(e) => { if(e.key==='Enter'||e.key===' ') { e.preventDefault(); setSelectedLang(c); } }}>{c}</div>
            ))}
          </div>
        </div>
        <div className="cfg-footer">
          <button className="btn-full" onClick={() => go('s5')}>🎙️ &nbsp;Speak My Story</button>
        </div>
      </div>

      {/* ── S5 SPEAK ── */}
      <div className={getScreenClass('s5')} id="s5">
        <div className="speak-top">
          <span className="speak-lbl">Listening…</span>
          <button className="btn-close" aria-label="Close" onClick={() => go('s4')}>✕</button>
        </div>
        <div className="speak-main">
          <div className="mic-wrap">
            <div className="mic-ring3"></div>
            <div className="mic-ring"></div>
            <div className="mic-ring2"></div>
            <div className="mic-btn">🎙️</div>
          </div>
          <div className="waveform">
            <div className="wv"></div><div className="wv"></div><div className="wv"></div>
            <div className="wv"></div><div className="wv"></div><div className="wv"></div>
            <div className="wv"></div><div className="wv"></div><div className="wv"></div>
          </div>
          <div className="tc-card" style={{background: 'rgba(255,255,255,0.06)', padding: '16px', borderRadius: '16px', width: '100%', border: '1px solid rgba(255,255,255,0.1)'}}>
            <div className="tc-lbl" style={{fontSize: 'var(--t-xs)', fontWeight: 700, color: 'var(--nm)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px'}}>
              <div className="tc-lbl-dot" style={{width: '6px', height: '6px', borderRadius: '50%', background: 'var(--rose)', animation: 'livepulse 1.8s infinite'}}></div>
              Transcribing
            </div>
            <div className="tc-text tc-cursor" style={{fontSize: 'var(--t-base)', color: '#fff', lineHeight: 1.4, fontWeight: 500}}>
              A small robot scared of the dark finds a glowing star in a forest…
            </div>
          </div>
          <div className="etags" style={{display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center'}}>
            <span className="etag" style={{padding: '5px 12px', borderRadius: '20px', fontSize: 'var(--t-xs)', fontWeight: 700, background: 'rgba(245,197,24,0.15)', color: 'var(--gold)', border: '1px solid rgba(245,197,24,0.25)'}}>🤖 Pip the robot</span>
            <span className="etag" style={{padding: '5px 12px', borderRadius: '20px', fontSize: 'var(--t-xs)', fontWeight: 700, background: 'rgba(85,97,232,0.15)', color: '#8892ff', border: '1px solid rgba(85,97,232,0.25)'}}>🌲 Glowing forest</span>
            <span className="etag" style={{padding: '5px 12px', borderRadius: '20px', fontSize: 'var(--t-xs)', fontWeight: 700, background: 'rgba(34,197,94,0.15)', color: '#6ee7a0', border: '1px solid rgba(34,197,94,0.25)'}}>✨ Wonder</span>
            <span className="etag" style={{padding: '5px 12px', borderRadius: '20px', fontSize: 'var(--t-xs)', fontWeight: 700, background: 'rgba(208,64,128,0.15)', color: '#f472b6', border: '1px solid rgba(208,64,128,0.25)'}}>🌑 Darkness</span>
          </div>
        </div>
        <div className="speak-bottom">
          <button className="btn-rerecord">↺ Re-record</button>
          <button className="btn-forge" onClick={() => go('s6')}>✓ &nbsp;Forge My Story</button>
        </div>
      </div>

      {/* ── S6 GENERATE ── */}
      <div className={getScreenClass('s6')} id="s6">
        <div className="gen-top">
          <div style={{flex:1, minWidth:0}}>
            <div className="gen-story">Pip and the Glowing Star</div>
            <div className="gen-pinfo">Page 1 of 6 · Watercolour · Children</div>
          </div>
          <div className="live-badge"><div className="live-dot"></div>Live</div>
        </div>
        <div className="gen-illus">
          <div className="gi-layer1"></div>
          <div className="gi-layer2"></div>
          <div className="gi-star-halo"></div>
          <div className="gen-emoji">🤖</div>
          <div className="gi-shadow"></div>
          <div className="gi-trees">🌲🌲🌲🌲🌲🌲🌲🌲🌲🌲🌲🌲🌲</div>
          <div className="shimmer"></div>
          <div className="gen-illus-tag"><div className="ilt-dot"></div>Generating illustration…</div>
          <div className="gen-pages">
            <div className="gp-dot active"></div>
            <div className="gp-dot"></div><div className="gp-dot"></div>
            <div className="gp-dot"></div><div className="gp-dot"></div><div className="gp-dot"></div>
          </div>
        </div>
        <div className="audio-bar">
          <button className="audio-play">▶</button>
          <div className="audio-track">
            <div className="audio-bg"><div className="audio-fill"></div></div>
            <div className="audio-times"><span>0:14</span><span>0:44</span></div>
          </div>
          <span className="audio-voice">🧡 Warm</span>
        </div>
        <div className="gen-prose-wrap">
          <div className="gen-prose">
            <span className="drop-cap">I</span>n a forest where every tree held a secret, there lived a small robot named Pip. Pip was made of copper — and copper things do not like the <span className="hl">dark</span>.<br/><br/>
            Each night, Pip would count screws until morning. One hundred and seven screws. One hundred and seven chances to pretend the dark wasn't there.
          </div>
        </div>
        <div className="agent-strip">
          <div className="a-chip a-done"><div className="a-dot"></div><span className="a-lbl">Arc planned ✓</span></div>
          <div className="a-chip a-done"><div className="a-dot"></div><span className="a-lbl">Pip locked ✓</span></div>
          <div className="a-chip a-active"><div className="a-dot"></div><span className="a-lbl">Tone check</span><div className="a-progress"><div className="a-progress-fill"></div></div></div>
          <div className="a-chip a-idle"><div className="a-dot"></div><span className="a-lbl">Engagement</span></div>
          <div className="a-chip a-idle"><div className="a-dot"></div><span className="a-lbl">Pacing</span></div>
        </div>
        <div className="steer-row">
          <input className="steer-input" aria-label="Steer the story" placeholder='Say "add a twist"…' />
          <button className="steer-mic" aria-label="Speak direction" onClick={() => go('s7')}>🎙️</button>
        </div>
      </div>

      {/* ── S7 HOME / BROWSE ── */}
      <div className={getScreenClass('s7')} id="s7">
        <div className="lib-scroll">
          <div className="lib-top">
            <div><div className="lib-greet">Good evening,</div><div className="lib-name">Amara 👋</div></div>
            <div className="lib-avatar">🧒</div>
          </div>
          <div role="button" tabIndex={0} className="new-card" onClick={() => go('s3')} onKeyDown={(e) => { if(e.key==='Enter'||e.key===' ') { e.preventDefault(); go('s3'); } }}>
            <div className="nc-ico">🎙️</div>
            <div><div className="nc-title">New Story</div><div className="nc-sub">Speak a sentence. Get a book.</div></div>
            <div className="nc-arrow">→</div>
          </div>
          
          <div className="sec-row">
            <span className="sec-title">Browse</span>
            <span className="sec-link" style={{cursor: 'pointer'}} onClick={() => go('s9')}>See all →</span>
          </div>
          <div className="genre-row">
            {['All', 'Adventure', 'Fantasy', 'Mystery', 'Animals'].map(g => (
              <div role="button" tabIndex={0} key={g} className={`gpill ${selectedGenre === g ? 'on' : ''}`} onClick={() => setSelectedGenre(g)} onKeyDown={(e) => { if(e.key==='Enter'||e.key===' ') { e.preventDefault(); setSelectedGenre(g); } }}>{g}</div>
            ))}
          </div>

          <div className="sec-row" style={{paddingTop: 'var(--sp-sm)'}}>
            <span className="sec-title">Library</span>
          </div>
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
            <div className="s-card">
              <div className="sc-cover scc4">🦊<div className="sc-badge">10 pp</div></div>
              <div className="sc-info"><div className="sc-title">The Midnight Fox</div><div className="sc-meta">Finished · Ink</div></div>
            </div>
          </div>
        </div>

        <div className="tabbar">
          {[
            { id: 'Home', ico: '🏠', action: () => go('s7') },
            { id: 'Library', ico: '📚', action: () => go('s9') },
            { id: 'Create', ico: '✨', action: () => go('s3') },
            { id: 'Profile', ico: '👤' }
          ].map(t => (
            <div role="button" tabIndex={0} key={t.id} className={`tab ${selectedTab === t.id ? 'on' : ''}`} onClick={() => { setSelectedTab(t.id); if(t.action) t.action(); }} onKeyDown={(e) => { if(e.key==='Enter'||e.key===' ') { e.preventDefault(); setSelectedTab(t.id); if(t.action) t.action(); } }}>
              <div className="tab-ico">{t.ico}</div>
              <div className="tab-lbl">{t.id}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── S9 FULL LIBRARY ── */}
      <div className={getScreenClass('s9')} id="s9" style={{background: 'var(--day)'}}>
        <div className="topbar" style={{paddingBottom: '10px'}}>
          <div className="top-title" style={{fontSize: 'var(--t-xl)', fontFamily: "'Lora',Georgia,serif"}}>Library</div>
        </div>
        
        <div className="lib-scroll" style={{paddingTop: 0}}>
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
            <div className="s-card">
              <div className="sc-cover scc4">🦊<div className="sc-badge">10 pp</div></div>
              <div className="sc-info"><div className="sc-title">The Midnight Fox</div><div className="sc-meta">Finished · Ink</div></div>
            </div>
            <div className="s-card">
              <div className="sc-cover scc5">🤖<div className="sc-badge">14 pp</div></div>
              <div className="sc-info"><div className="sc-title">Robot's First Friend</div><div className="sc-meta">Page 5 · Vector</div></div>
            </div>
            <div className="s-card">
              <div className="sc-cover scc6">🌲<div className="sc-badge">8 pp</div></div>
              <div className="sc-info"><div className="sc-title">The Whispering Woods</div><div className="sc-meta">Finished · Watercolour</div></div>
            </div>
            <div className="s-card">
              <div className="sc-cover" style={{background: 'linear-gradient(135deg, #4b6cb7, #182848)'}}>🐙<div className="sc-badge">24 pp</div></div>
              <div className="sc-info"><div className="sc-title">Deep Sea Adventure</div><div className="sc-meta">Finished · Watercolour</div></div>
            </div>
            <div className="s-card">
              <div className="sc-cover" style={{background: 'linear-gradient(135deg, #f2709c, #ff9472)'}}>🦄<div className="sc-badge">18 pp</div></div>
              <div className="sc-info"><div className="sc-title">The Magic Meadow</div><div className="sc-meta">Finished · Pastel</div></div>
            </div>
          </div>
        </div>

        <div className="tabbar">
          {[
            { id: 'Home', ico: '🏠', action: () => go('s7') },
            { id: 'Library', ico: '📚', action: () => go('s9') },
            { id: 'Create', ico: '✨', action: () => go('s3') },
            { id: 'Profile', ico: '👤' }
          ].map(t => (
            <div role="button" tabIndex={0} key={t.id} className={`tab ${selectedTab === t.id ? 'on' : ''}`} onClick={() => { setSelectedTab(t.id); if(t.action) t.action(); }} onKeyDown={(e) => { if(e.key==='Enter'||e.key===' ') { e.preventDefault(); setSelectedTab(t.id); if(t.action) t.action(); } }}>
              <div className="tab-ico">{t.ico}</div>
              <div className="tab-lbl">{t.id}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── S8 EXPORT ── */}
      <div className={getScreenClass('s8')} id="s8">
        <div className="cf" style={{top:'17%', left:'12%', '--ct':'3.8s', '--cd':'0s'} as any}>✦</div>
        <div className="cf" style={{top:'13%', right:'16%', '--ct':'4.4s', '--cd':'.6s'} as any}>⭐</div>
        <div className="cf" style={{top:'28%', left:'7%', '--ct':'3.3s', '--cd':'1.2s'} as any}>✨</div>
        <div className="cf" style={{top:'23%', right:'9%', '--ct':'5.1s', '--cd':'.3s'} as any}>✦</div>
        <div className="cf" style={{top:'35%', left:'20%', '--ct':'4.7s', '--cd':'.9s'} as any}>★</div>
        <div className="export-top">
          <span className="export-ttl">Story Complete</span>
          <button className="share-btn">Share ↗</button>
        </div>
        <div className="book-wrap">
          <div className="book-3d">
            <div className="book-spine"></div>
            <div className="book-cover">
              <div className="book-emoji">🌟</div>
              <div className="book-ttl">Pip and the<br/>Glowing Star</div>
              <div className="book-by">by Amara, age 9</div>
            </div>
            <div className="book-stripe"></div>
          </div>
        </div>
        <div className="stats-row">
          <div className="stat"><div className="stat-n">6</div><div className="stat-l">Pages</div></div>
          <div className="stat"><div className="stat-n">6</div><div className="stat-l">Illus.</div></div>
          <div className="stat"><div className="stat-n">3:24</div><div className="stat-l">Listen</div></div>
          <div className="stat"><div className="stat-n">🎨</div><div className="stat-l">Style</div></div>
        </div>
        <div className="export-btns">
          <button className="ebtn ebtn-pdf">📄 &nbsp;Download PDF</button>
          <button className="ebtn ebtn-link">🔗 &nbsp;Copy Share Link</button>
          <button className="ebtn-new" onClick={() => go('s1')}>✦ Forge another story</button>
        </div>
      </div>

    </div>
  );
}
