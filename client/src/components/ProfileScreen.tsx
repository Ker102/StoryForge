import { ArrowLeft, User, BookOpen, Settings as SettingsIcon, Cloud, ChevronRight, LogOut, Pencil } from 'lucide-react';
import type { User as FirebaseUser } from 'firebase/auth';
import { motion } from 'motion/react';

interface ProfileScreenProps {
  user: FirebaseUser | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function ProfileScreen({ user, onNavigate, onLogout }: ProfileScreenProps) {
  const displayName = user?.displayName || 'Storyteller';
  const email = user?.email || '';
  const photoURL = user?.photoURL;

  return (
    <div className="min-h-screen bg-background-dark pb-28">
      <header className="flex items-center p-4 sticky top-0 bg-background-dark/95 backdrop-blur-md z-10">
        <button type="button" onClick={() => onNavigate('home')} aria-label="Back to home" className="p-2 hover:bg-white/5 rounded-full"><ArrowLeft size={24} /></button>
        <h2 className="text-lg font-bold flex-1 text-center pr-10">Profile</h2>
      </header>
      <section className="flex flex-col items-center py-8">
        <div className="relative group">
          <div className="absolute -inset-2 bg-gradient-to-tr from-primary to-yellow-300 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition duration-500" />
          <div className="relative h-32 w-32 rounded-full border-2 border-primary/40 p-1">
            {photoURL ? (
              <img src={photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center">
                <User size={48} className="text-primary" />
              </div>
            )}
          </div>
          <button type="button" aria-label="Edit profile picture" className="absolute bottom-1 right-1 bg-primary p-2 rounded-full shadow-lg border-2 border-slate-900">
            <Pencil size={14} className="text-slate-900" />
          </button>
        </div>
        <div className="mt-6 text-center">
          <h2 className="text-2xl font-extrabold">{displayName}</h2>
          <p className="text-slate-400 font-medium text-sm mt-1">{email}</p>
          <div className="mt-4 inline-flex px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-bold tracking-wider uppercase border border-primary/40">
            Storyteller
          </div>
        </div>
      </section>
      <section className="px-4 space-y-6">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 px-2 py-2">General Settings</h3>
          <div className="space-y-2">
            {[
              { icon: <User size={20} />, label: 'Account' },
              { icon: <BookOpen size={20} />, label: 'My Stories' },
              { icon: <SettingsIcon size={20} />, label: 'Preferences' },
              { icon: <Cloud size={20} />, label: 'Notifications', badge: true },
            ].map(item => (
              <motion.button 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }} 
                type="button" 
                key={item.label} 
                className="w-full flex items-center justify-between p-4 glass-card rounded-xl hover:bg-primary/10 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-primary/30 p-2.5 rounded-lg group-hover:bg-primary/40 transition-colors text-primary">
                    {item.icon}
                  </div>
                  <span className="font-semibold">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.badge && <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
                  <ChevronRight size={20} className="text-slate-500" />
                </div>
              </motion.button>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 px-2 py-2">Support & Security</h3>
          <div className="space-y-2">
            <motion.button 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }} 
              type="button" 
              className="w-full flex items-center justify-between p-4 glass-card rounded-xl hover:bg-primary/10 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-primary/30 p-2.5 rounded-lg text-primary"><SettingsIcon size={20} /></div>
                <span className="font-semibold">Help Center</span>
              </div>
              <ChevronRight size={20} className="text-slate-500" />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }} 
              type="button" 
              onClick={onLogout} 
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 font-bold"
            >
              <div className="bg-red-500/20 p-2.5 rounded-lg"><LogOut size={20} /></div>
              <span>Logout</span>
            </motion.button>
          </div>
        </div>
      </section>
      <footer className="mt-8 text-center">
        <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em]">StoryForge v1.0.0</p>
      </footer>
    </div>
  );
}
