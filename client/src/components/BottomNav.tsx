import { Home as HomeIcon, BookOpen, Compass, User, Plus } from 'lucide-react';
import { motion } from 'motion/react';

interface BottomNavProps {
  active: string;
  onChange: (page: string) => void;
}

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background-dark/95 backdrop-blur-md border-t border-white/5 px-6 py-4 flex justify-between items-center z-50 max-w-4xl mx-auto">
      <motion.button 
        whileHover={{ y: -4, scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        type="button" 
        onClick={() => onChange('home')} 
        className={`flex flex-col items-center gap-1 ${active === 'home' ? 'text-primary' : 'text-slate-500 hover:text-slate-300 transition-colors'}`}
      >
        <HomeIcon size={24} fill={active === 'home' ? 'currentColor' : 'none'} />
        <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
      </motion.button>
      <motion.button 
        whileHover={{ y: -4, scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        type="button" 
        onClick={() => onChange('library')} 
        className={`flex flex-col items-center gap-1 ${active === 'library' ? 'text-primary' : 'text-slate-500 hover:text-slate-300 transition-colors'}`}
      >
        <BookOpen size={24} fill={active === 'library' ? 'currentColor' : 'none'} />
        <span className="text-[10px] font-bold uppercase tracking-widest">Library</span>
      </motion.button>
      <div className="relative -top-8">
        <motion.button
          whileHover={{ scale: 1.15, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          type="button"
          onClick={() => onChange('settings')}
          aria-label="Create story"
          className="bg-primary text-slate-900 w-14 h-14 rounded-2xl shadow-[0_8px_20px_rgba(244,209,37,0.4)] flex items-center justify-center transform rotate-45 hover:shadow-[0_12px_30px_rgba(244,209,37,0.6)] transition-shadow duration-300"
        >
          <Plus className="transform -rotate-45" size={32} strokeWidth={3} />
        </motion.button>
      </div>
      <motion.button 
        whileHover={{ y: -4, scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        type="button" 
        onClick={() => onChange('explore')} 
        className={`flex flex-col items-center gap-1 ${active === 'explore' ? 'text-primary' : 'text-slate-500 hover:text-slate-300 transition-colors'}`}
      >
        <Compass size={24} fill={active === 'explore' ? 'currentColor' : 'none'} />
        <span className="text-[10px] font-bold uppercase tracking-widest">Explore</span>
      </motion.button>
      <motion.button 
        whileHover={{ y: -4, scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        type="button" 
        onClick={() => onChange('profile')} 
        className={`flex flex-col items-center gap-1 ${active === 'profile' ? 'text-primary' : 'text-slate-500 hover:text-slate-300 transition-colors'}`}
      >
        <User size={24} fill={active === 'profile' ? 'currentColor' : 'none'} />
        <span className="text-[10px] font-bold uppercase tracking-widest">Profile</span>
      </motion.button>
    </nav>
  );
}
