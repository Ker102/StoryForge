import { Home as HomeIcon, BookOpen, Compass, User, Plus } from 'lucide-react';

interface BottomNavProps {
  active: string;
  onChange: (page: string) => void;
}

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background-dark/95 backdrop-blur-md border-t border-white/5 px-6 py-4 flex justify-between items-center z-50 max-w-4xl mx-auto">
      <button type="button" onClick={() => onChange('home')} className={`flex flex-col items-center gap-1 ${active === 'home' ? 'text-primary' : 'text-slate-500'}`}>
        <HomeIcon size={24} fill={active === 'home' ? 'currentColor' : 'none'} />
        <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
      </button>
      <button type="button" onClick={() => onChange('library')} className={`flex flex-col items-center gap-1 ${active === 'library' ? 'text-primary' : 'text-slate-500'}`}>
        <BookOpen size={24} fill={active === 'library' ? 'currentColor' : 'none'} />
        <span className="text-[10px] font-bold uppercase tracking-widest">Library</span>
      </button>
      <div className="relative -top-8">
        <button
          type="button"
          onClick={() => onChange('settings')}
          aria-label="Create story"
          className="bg-primary text-slate-900 w-14 h-14 rounded-2xl shadow-[0_8px_20px_rgba(244,209,37,0.4)] flex items-center justify-center transform rotate-45"
        >
          <Plus className="transform -rotate-45" size={32} strokeWidth={3} />
        </button>
      </div>
      <button type="button" onClick={() => onChange('explore')} className={`flex flex-col items-center gap-1 ${active === 'explore' ? 'text-primary' : 'text-slate-500'}`}>
        <Compass size={24} fill={active === 'explore' ? 'currentColor' : 'none'} />
        <span className="text-[10px] font-bold uppercase tracking-widest">Explore</span>
      </button>
      <button type="button" onClick={() => onChange('profile')} className={`flex flex-col items-center gap-1 ${active === 'profile' ? 'text-primary' : 'text-slate-500'}`}>
        <User size={24} fill={active === 'profile' ? 'currentColor' : 'none'} />
        <span className="text-[10px] font-bold uppercase tracking-widest">Profile</span>
      </button>
    </nav>
  );
}
