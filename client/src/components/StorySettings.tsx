import { useState } from 'react';
import { ArrowLeft, Brush, Palette, LayoutGrid, Pencil, Mic } from 'lucide-react';

interface StorySettingsProps {
  onNavigate: (page: string) => void;
  onGenerate: (config: { style: string; age_setting: string; seed: string }) => void;
}

const STYLES = [
  { id: 'watercolour', icon: <Brush />, label: 'Watercolor' },
  { id: 'dreamy_pastel', icon: <Palette />, label: 'Pastel' },
  { id: 'retro_pixel', icon: <LayoutGrid />, label: 'Pixel Art' },
  { id: 'ink_sketch', icon: <Pencil />, label: 'Ink Sketch' },
];

const AGES = [
  { id: 'children_5_8', label: '👧 Young (5-8)' },
  { id: 'teen_13_17', label: '🧒 Teen (13-17)' },
  { id: 'adults', label: '👤 Adults' },
  { id: 'educator', label: '📚 Educator' },
];

export default function StorySettings({ onNavigate, onGenerate }: StorySettingsProps) {
  const [style, setStyle] = useState('watercolour');
  const [age, setAge] = useState('children_5_8');
  const [seed, setSeed] = useState('');

  const handleGenerate = () => {
    onGenerate({ style, age_setting: age, seed: seed || 'A magical adventure in a hidden forest' });
  };

  return (
    <div className="min-h-screen bg-background-dark flex flex-col max-w-6xl mx-auto w-full">
      <header className="flex items-center justify-between p-6 sticky top-0 bg-background-dark/80 backdrop-blur-md z-10">
        <button type="button" onClick={() => onNavigate('home')} aria-label="Back to home" className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">Story Settings</h1>
        <div className="w-10" />
      </header>
      <main className="flex-1 px-6 pb-32 space-y-8">
        {/* Visual Style */}
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Visual Style</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" role="radiogroup" aria-label="Visual style">
            {STYLES.map(s => (
              <button
                type="button"
                key={s.id}
                onClick={() => setStyle(s.id)}
                aria-pressed={style === s.id}
                className={`flex flex-col items-center justify-center p-4 rounded-3xl transition-all border ${style === s.id ? 'bg-primary/10 border-primary text-primary shadow-[0_0_20px_rgba(244,209,37,0.2)]' : 'bg-white/5 border-white/10 text-slate-400'}`}
              >
                <div className="mb-2">{s.icon}</div>
                <p className={`text-sm font-bold ${style === s.id ? 'text-primary' : 'text-slate-300'}`}>{s.label}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Age Setting */}
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Age Group</h3>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Age group">
            {AGES.map(a => (
              <button
                type="button"
                key={a.id}
                onClick={() => setAge(a.id)}
                aria-pressed={age === a.id}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${age === a.id ? 'bg-primary text-slate-900' : 'bg-white/5 text-slate-400'}`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </section>

        {/* Story Seed */}
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Story Seed <span className="opacity-50">(optional)</span></h3>
          <textarea
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            className="w-full bg-slate-900 border border-white/5 rounded-3xl p-6 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary outline-none min-h-[120px] shadow-inner"
            placeholder="A small robot who finds a glowing star in a forest"
          />
        </section>
      </main>
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background-dark to-transparent max-w-6xl mx-auto">
        <button
          type="button"
          onClick={handleGenerate}
          className="w-full bg-primary text-slate-900 font-bold py-5 rounded-[2rem] flex items-center justify-center gap-3 shadow-[0_20px_40px_-10px_rgba(244,209,37,0.3)] active:scale-95 transition-all text-lg"
        >
          <Mic size={20} /> Speak My Story
        </button>
      </div>
    </div>
  );
}
