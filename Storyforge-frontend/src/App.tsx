import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  ArrowRight, 
  ChevronRight, 
  Star, 
  Home as HomeIcon, 
  Library as LibraryIcon, 
  Compass, 
  User, 
  Plus, 
  Menu, 
  Search, 
  ArrowLeft, 
  Settings as SettingsIcon,
  LogOut,
  Brush,
  Palette,
  LayoutGrid,
  Pencil,
  Heart,
  PartyPopper,
  Cloud,
  Bolt,
  CheckCircle,
  BookOpen,
  Sparkles,
  Circle,
  Bookmark,
  PlayCircle,
  Type,
  FileText,
  Share2,
  Volume2,
  ChevronLeft,
  SkipBack,
  SkipForward,
  MoreVertical,
  PlusCircle,
  Play,
  Pause,
  Wand2
} from 'lucide-react';
import { Story, Template, VisualStyle, NarratorVoice, Language, GeneratedStory } from './types';
import { generateStory, generatePageImage, textToSpeech } from './services/gemini';

// --- Mock Data ---
const MOCK_STORIES: Story[] = [
  { id: '1', title: 'Pip and the Glowing Star', coverImage: 'https://picsum.photos/seed/mouse/400/600', style: 'Watercolor style', totalPages: 24, currentPage: 12, isFinished: false, genre: 'Adventure' },
  { id: '2', title: 'Luna and the Moongate', coverImage: 'https://picsum.photos/seed/moon/400/600', style: 'Pastel style', totalPages: 8, currentPage: 8, isFinished: true, genre: 'Fantasy' },
  { id: '3', title: 'Dippy the Dragon', coverImage: 'https://picsum.photos/seed/dragon/400/600', style: 'Oil Painting', totalPages: 12, currentPage: 0, isFinished: false, genre: 'Adventure' },
  { id: '4', title: 'Rusty the Fox', coverImage: 'https://picsum.photos/seed/fox/400/600', style: 'Sketch style', totalPages: 10, currentPage: 0, isFinished: false, genre: 'Animals' },
];

const MOCK_TEMPLATES: Template[] = [
  { id: 't1', title: 'The Space Explorer', description: 'A lone pilot discovers an ancient signal originating from the edge of the Andromeda galaxy.', image: 'https://picsum.photos/seed/space/800/450', category: 'Sci-Fi', author: 'SF', uses: '1.2k' },
  { id: 't2', title: 'Magic Forest', description: 'Deep within the Whispering Woods, a forgotten shrine begins to glow for the first time in centuries.', image: 'https://picsum.photos/seed/forest/800/450', category: 'Fantasy', author: 'SF', uses: '850' },
  { id: 't3', title: 'The Silent Witness', description: 'A detective finds an antique locket at a crime scene that shouldn\'t exist in this timeline.', image: 'https://picsum.photos/seed/mystery/800/450', category: 'Mystery', author: 'SF', uses: '2.4k' },
];

// --- Components ---

const BottomNav = ({ active, onChange }: { active: string, onChange: (page: string) => void }) => (
  <nav className="fixed bottom-0 left-0 right-0 bg-background-dark/95 backdrop-blur-md border-t border-white/5 px-6 py-4 flex justify-between items-center z-50 max-w-4xl mx-auto">
    <button onClick={() => onChange('home')} className={`flex flex-col items-center gap-1 ${active === 'home' ? 'text-primary' : 'text-slate-500'}`}>
      <HomeIcon size={24} fill={active === 'home' ? 'currentColor' : 'none'} />
      <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
    </button>
    <button onClick={() => onChange('library')} className={`flex flex-col items-center gap-1 ${active === 'library' ? 'text-primary' : 'text-slate-500'}`}>
      <BookOpen size={24} fill={active === 'library' ? 'currentColor' : 'none'} />
      <span className="text-[10px] font-bold uppercase tracking-widest">Library</span>
    </button>
    <div className="relative -top-8">
      <button 
        onClick={() => onChange('settings')}
        className="bg-primary text-slate-900 w-14 h-14 rounded-2xl shadow-[0_8px_20px_rgba(244,209,37,0.4)] flex items-center justify-center transform rotate-45"
      >
        <Plus className="transform -rotate-45" size={32} strokeWidth={3} />
      </button>
    </div>
    <button onClick={() => onChange('explore')} className={`flex flex-col items-center gap-1 ${active === 'explore' ? 'text-primary' : 'text-slate-500'}`}>
      <Compass size={24} fill={active === 'explore' ? 'currentColor' : 'none'} />
      <span className="text-[10px] font-bold uppercase tracking-widest">Explore</span>
    </button>
    <button onClick={() => onChange('profile')} className={`flex flex-col items-center gap-1 ${active === 'profile' ? 'text-primary' : 'text-slate-500'}`}>
      <User size={24} fill={active === 'profile' ? 'currentColor' : 'none'} />
      <span className="text-[10px] font-bold uppercase tracking-widest">Profile</span>
    </button>
  </nav>
);

const Onboarding = ({ onFinish }: { onFinish: () => void }) => {
  const [step, setStep] = useState(0);
  const steps = [
    {
      title: "Speak your idea. Watch it become a book.",
      description: "Storyforge magic brings your imagination to life in seconds.",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB0SDSbAxZKb87LVSB6vM1n41b5Qg0BYvs5uFsNytnoinqhkPeCDmNFsFjhRWxS87rKYxunf7K2hn1AQbJdI0Se3VgwPEjpHDfegbTpBPC71X3YlPuFnt6q25v3m3IHYl2MBiNvUbzYLPijZ1kTwWC6tUvVrK5XilxnC1YDWEW5Fu3FLBY14Y_tu_U6p3xlqehkMzQ1dU_OTIV7Lp5Xz8HPP4RGFNKGdPP5zuSbWNQuCpLp5vXUX0Gyhu-6S66jiUKLmsxoKSEcRj0",
      accent: "Watch it become a book."
    },
    {
      title: "Stunning Art. In your chosen style.",
      description: "From delicate watercolors to vibrant 3D renders, you choose the look.",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDnVxQVT6H608pGCH5-_t1V-B5SbpV0hK9g0MSbtkkUOv2ktnjWLVWXgO1wspK1Jb5kBU24xHNZubKjs46DtrmOlfymL-Tapz3t7B04k0B6BKWqSeHUmEP1ue4Hoc6pGzw0Psxy3t88HiUC0oW-9CCYaiw8XLz-gRCo0V_7XFrXhSybcwEB2yd7heVemkNEhfrM0vWgRnhPEV98Yd59n2hUnLjKX9ycTpepUKjV48aGmmvYsWPqTUMR5g-A7-KNgrF3BZqAIBd9Cpk",
      accent: "In your chosen style."
    },
    {
      title: "Sit back. And listen.",
      description: "Warm, dynamic voices bring your story to life for the perfect bedtime experience.",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD3z3Vt61DtymFZrL6oMWx9IubvkPU6cdbaL_zPHjcLRDB-6oz2IlI-uZAk18Zn_SUhTARYtW3sGvtAqVgIPI5VMHv1c2mOWp3fkQgWeM94TvX-T_CouQNXzsqrLFJGlpKeDzxynlpa5rYvMKpCyz3AfJHRZgnD9nJaYF7fez54-OX5KjGgCvrcSLm_3qwV6RD0S8yhlssRzVeGSQ4_hktPLCsQyVUhd_ql2buMw3q7pOCP5qo9TpuvGIxPd1tTHTxLaOkFtYvw854",
      accent: "And listen."
    }
  ];

  const next = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else onFinish();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background-dark">
      <header className="flex justify-end p-6">
        <button onClick={onFinish} className="text-primary font-bold">Skip</button>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <AnimatePresence mode="wait">
          <motion.div 
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-sm"
          >
            <div className="relative aspect-square mb-12 rounded-3xl overflow-hidden border border-primary/20">
              <img src={steps[step].image} alt="Onboarding" className="w-full h-full object-cover" />
            </div>
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-extrabold leading-tight">
                {steps[step].title.split(steps[step].accent)[0]}
                <span className="text-primary">{steps[step].accent}</span>
              </h1>
              <p className="text-slate-400 text-lg">{steps[step].description}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
      <footer className="p-8 flex flex-col items-center gap-8">
        <div className="flex gap-3">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-8 bg-primary shadow-[0_0_10px_rgba(244,209,37,0.5)]' : 'w-2 bg-slate-800'}`} />
          ))}
        </div>
        <button 
          onClick={next}
          className="w-full max-w-md bg-primary text-slate-900 font-bold py-5 rounded-xl text-lg flex items-center justify-center gap-2"
        >
          {step === steps.length - 1 ? 'Get Started' : 'Next'}
          <ArrowRight size={20} />
        </button>
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Step {step + 1} of 3</p>
      </footer>
    </div>
  );
};

const Auth = ({ onLogin }: { onLogin: () => void }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background-dark p-6 text-center">
    <div className="mb-12">
      <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-slate-900 mx-auto mb-4 shadow-lg">
        <BookOpen size={32} />
      </div>
      <h1 className="font-serif text-5xl font-bold italic mb-2">StoryForge</h1>
    </div>
    <div className="w-full max-w-sm aspect-square rounded-3xl overflow-hidden mb-8 shadow-2xl border border-white/5">
      <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBUPYgqdAO9nli1fuDdVjedba7iJtwojohU039B1fXP8JNmh5l1TKx0JJlkDQoaRc0eJH0rb6XPjMV8trsa7CpHJ2VchSPF1xlBWq6Af9kWy5zSFIbvuL05894KuACfOfnB9L5IBayofugGfwUtrRP4X38opbNxUsj06XRBxvGUyHOrptQwvuqwQOHTYdAXzFI8MTKwdYXxrHLQn0yMryoEGT7YX5keC-niSPNGCPAYJ40sQ09Xu88HTFEE77wGLKFGbd8kOnlOCkY" alt="Hero" className="w-full h-full object-cover" />
    </div>
    <p className="text-slate-300 text-lg mb-12 max-w-xs">Your gateway to infinite adventures and legendary tales. Step into the forge where stories come to life.</p>
    <div className="w-full max-w-sm space-y-4">
      <button onClick={onLogin} className="w-full bg-primary text-slate-900 font-bold py-4 rounded-xl text-lg flex items-center justify-center gap-2">
        Sign In <ArrowRight size={20} />
      </button>
      <button onClick={onLogin} className="w-full border-2 border-primary text-primary font-bold py-4 rounded-xl text-lg">
        Create Account
      </button>
    </div>
    <div className="mt-12 flex gap-4 text-slate-500 text-sm">
      <a href="#">Privacy Policy</a>
      <span>•</span>
      <a href="#">Terms of Service</a>
    </div>
  </div>
);

const Home = ({ onNavigate, onRead }: { onNavigate: (page: string) => void, onRead: () => void }) => (
  <div className="p-6 space-y-8">
    <header className="flex items-center justify-between pt-4">
      <h1 className="font-serif text-2xl font-bold italic">Good evening, Amara 👋</h1>
      <div className="w-11 h-11 rounded-full border-2 border-primary overflow-hidden">
        <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuArihbGoE9lxkqYk5F10Ek52mcxf4qvaz65kZnVVNxaDYaRCQcd4edZ4qw2GvKA8rOBKBgeIDtgvAMmmUS0eMdn96BR0V1ziJi3MuBVs9Xm018UwanmI1UZH88eZ31cGfNoUKVUh2RZAkbYXV3xqNOy7Kr3qBYd4eIDOX8ntDdYIWpLjf9rRW3YhT25RliTT0nayuBQ-NG5TW3Nqr-kpUeIH9Cih3uRooH3ueiYxfa_J1JFzfHUn5_mIXDv46tR36pMmNiesacuAfU" alt="Avatar" className="w-full h-full object-cover" />
      </div>
    </header>

    <section onClick={() => onNavigate('settings')} className="bg-gradient-to-br from-yellow-500 to-primary rounded-[2.5rem] p-8 shadow-xl shadow-primary/20 relative overflow-hidden cursor-pointer group">
      <Mic size={120} className="absolute -right-4 -top-4 opacity-10 text-white" />
      <div className="relative z-10 flex items-center justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md"><Mic size={20} className="text-white" /></div>
            <span className="text-white/90 font-bold text-xs uppercase tracking-wider">Voice Input</span>
          </div>
          <h2 className="text-2xl font-bold text-white leading-tight">Speak a sentence.<br/>Get a book.</h2>
        </div>
        <div className="bg-white/20 rounded-full p-4 group-hover:bg-white/30 transition-colors">
          <ChevronRight size={32} className="text-white" />
        </div>
      </div>
    </section>

    <section>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-extrabold">My Genres</h3>
        <button className="text-sm font-semibold text-slate-500">See all</button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {['All', 'Adventure', 'Fantasy', 'Mystery', 'Animals'].map((genre, i) => (
          <button key={genre} className={`px-6 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all ${i === 0 ? 'bg-primary text-slate-900 shadow-md' : 'bg-slate-800 text-slate-400'}`}>
            {genre}
          </button>
        ))}
      </div>
    </section>

    <section>
      <h3 className="text-lg font-extrabold mb-4">Library</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {MOCK_STORIES.map(story => (
          <button 
            key={story.id} 
            onClick={onRead}
            className="rounded-3xl p-5 aspect-[3/4.2] relative overflow-hidden group shadow-md text-left w-full"
          >
            <img src={story.coverImage} className="absolute inset-0 w-full h-full object-cover brightness-50 group-hover:scale-105 transition-transform" alt={story.title} />
            <div className="relative h-full flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="bg-black/30 backdrop-blur-md text-[10px] px-2 py-1 rounded-full font-bold">{story.totalPages}pp</span>
                <div className="bg-primary/20 p-2 rounded-full">
                  <Star size={16} className="text-primary" fill="currentColor" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-white/80 text-[10px] font-extrabold uppercase tracking-widest">{story.style}</p>
                <h4 className="text-white font-bold text-base leading-tight">{story.title}</h4>
                {story.isFinished ? (
                  <div className="mt-2 flex items-center gap-1">
                    <CheckCircle size={12} className="text-primary" />
                    <span className="text-[10px] text-white/70 font-bold uppercase">FINISHED</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${(story.currentPage / story.totalPages) * 100}%` }} />
                    </div>
                    <span className="text-[10px] text-white/70 font-bold">Page {story.currentPage}</span>
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  </div>
);

const Library = ({ onRead }: { onRead: () => void }) => {
  const [activeTab, setActiveTab] = useState('All Stories');

  return (
    <div className="min-h-screen bg-background-dark">
      <header className="sticky top-0 z-10 bg-background-dark/95 backdrop-blur-lg px-6 py-5 border-b border-white/5 flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold italic">StoryForge</h1>
        <div className="w-10 h-10 rounded-full border-2 border-primary overflow-hidden">
          <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuArihbGoE9lxkqYk5F10Ek52mcxf4qvaz65kZnVVNxaDYaRCQcd4edZ4qw2GvKA8rOBKBgeIDtgvAMmmUS0eMdn96BR0V1ziJi3MuBVs9Xm018UwanmI1UZH88eZ31cGfNoUKVUh2RZAkbYXV3xqNOy7Kr3qBYd4eIDOX8ntDdYIWpLjf9rRW3YhT25RliTT0nayuBQ-NG5TW3Nqr-kpUeIH9Cih3uRooH3ueiYxfa_J1JFzfHUn5_mIXDv46tR36pMmNiesacuAfU" alt="Avatar" className="w-full h-full object-cover" />
        </div>
      </header>
      <div className="flex border-b border-white/5 justify-center gap-8">
        {['All Stories', 'In Progress', 'Finished'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 pt-4 text-sm font-bold transition-all ${activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-slate-500'}`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4 pb-24">
        {MOCK_STORIES.filter(s => activeTab === 'All Stories' || (activeTab === 'Finished' && s.isFinished) || (activeTab === 'In Progress' && !s.isFinished)).map(story => (
          <button 
            key={story.id} 
            onClick={onRead}
            className="flex flex-col gap-3 group text-left w-full"
          >
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-xl w-full">
              <img src={story.coverImage} className="w-full h-full object-cover brightness-75 group-hover:scale-105 transition-transform" alt={story.title} />
              {story.isFinished && (
                <div className="absolute top-2 right-2 bg-yellow-50/10 backdrop-blur-md border border-primary/20 rounded-full px-2 py-0.5">
                  <p className="text-[10px] font-bold text-primary">FINISHED</p>
                </div>
              )}
              {!story.isFinished && (
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden">
                    <div className="bg-primary h-full" style={{ width: `${(story.currentPage / story.totalPages) * 100}%` }} />
                  </div>
                </div>
              )}
            </div>
            <div className="px-1">
              <p className="text-sm font-bold leading-tight">{story.title}</p>
              <p className={`text-xs font-medium mt-1 ${story.isFinished ? 'text-slate-500' : 'text-primary'}`}>
                {story.isFinished ? 'Finished • 100%' : `Page ${story.currentPage} of ${story.totalPages}`}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

const Explore = () => (
  <div className="min-h-screen bg-background-dark">
    <header className="sticky top-0 z-10 bg-background-dark/95 backdrop-blur-lg px-4 py-4 border-b border-white/5 flex items-center justify-between">
      <div className="size-10 flex items-center justify-center rounded-full bg-slate-800"><Menu size={20} /></div>
      <h1 className="text-lg font-bold">Explore</h1>
      <div className="size-10 flex items-center justify-center rounded-full bg-slate-800"><Search size={20} /></div>
    </header>
    <main className="p-4 pb-24 space-y-6">
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input className="w-full rounded-xl border-none bg-slate-800/50 py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/50" placeholder="Search story templates..." />
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide">
        <button className="px-5 py-2 bg-primary text-slate-900 rounded-full font-bold text-sm">All</button>
        {['Sci-Fi', 'Fantasy', 'Mystery', 'Cyberpunk'].map(cat => (
          <button key={cat} className="px-5 py-2 bg-slate-800 text-slate-300 rounded-full font-medium text-sm flex items-center gap-1">
            {cat} <ChevronRight size={14} className="rotate-90" />
          </button>
        ))}
      </div>
      <div className="pt-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-extrabold">Templates</h2>
          <button className="text-sm font-semibold text-primary">View all</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {MOCK_TEMPLATES.map(template => (
            <div key={template.id} className="group glass-card rounded-2xl overflow-hidden transition-all hover:scale-[1.01]">
              <div className="aspect-[16/9] relative overflow-hidden">
                <img src={template.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={template.title} />
                <div className="absolute top-3 left-3">
                  <span className="bg-black/40 backdrop-blur-md text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">{template.category}</span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-bold">{template.title}</h3>
                <p className="mt-1 text-sm text-slate-400 line-clamp-2">{template.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    <div className="size-6 rounded-full border-2 border-slate-800 bg-primary/30 flex items-center justify-center text-[8px] font-bold text-primary">{template.author}</div>
                    <div className="size-6 rounded-full border-2 border-slate-800 bg-slate-700" />
                  </div>
                  <button className="text-sm font-semibold text-primary flex items-center gap-1">
                    Start Story <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  </div>
);

const Profile = ({ onNavigate, onLogout }: { onNavigate: (page: string) => void, onLogout: () => void }) => (
  <div className="min-h-screen bg-background-dark pb-24">
    <header className="flex items-center p-4 sticky top-0 bg-background-dark/95 backdrop-blur-md z-10">
      <button onClick={() => onNavigate('home')} className="p-2 hover:bg-white/5 rounded-full"><ArrowLeft size={24} /></button>
      <h2 className="text-lg font-bold flex-1 text-center pr-10">Profile</h2>
    </header>
    <section className="flex flex-col items-center py-8">
      <div className="relative group">
        <div className="absolute -inset-2 bg-gradient-to-tr from-primary to-yellow-300 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition duration-500" />
        <div className="relative h-32 w-32 rounded-full border-2 border-primary/40 p-1">
          <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDUgIba4VBS4aY_nrubyPGQjMsf_45SunUGgbQcna34aK6ce7fxw9xTEjkGYl0ZZcySMwme2mFSHzKF1vcXSV6_GtoV6hIAfFBhMXGpphAtHaxHJvw8D9un4ipRyWpIUlJXmiWHJACXRtdbw_nwMsLhTM5UYxW0E1yKsJn1bRTWQ6JZ6s7HVJVScwhU-zOTLgrG18K9R1ZESXrF8271wvjcIatUdyFtnMDeRJiLBoeBz-yyxZfvYyVle79wv6gU9kRdOGGei9KDpmM" alt="Profile" className="w-full h-full rounded-full object-cover" />
        </div>
        <button className="absolute bottom-1 right-1 bg-primary p-2 rounded-full shadow-lg border-2 border-slate-900">
          <Pencil size={14} className="text-slate-900" />
        </button>
      </div>
      <div className="mt-6 text-center">
        <h2 className="text-2xl font-extrabold">Amara</h2>
        <p className="text-slate-400 font-medium text-sm mt-1">amara@storyforge.cosmos</p>
        <div className="mt-4 inline-flex px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-bold tracking-wider uppercase border border-primary/40">
          Grand Weaver
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
            <button key={item.label} className="w-full flex items-center justify-between p-4 glass-card rounded-xl hover:bg-primary/10 transition-all group">
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
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 px-2 py-2">Support & Security</h3>
        <div className="space-y-2">
          <button className="w-full flex items-center justify-between p-4 glass-card rounded-xl hover:bg-primary/10 transition-all group">
            <div className="flex items-center gap-4">
              <div className="bg-primary/30 p-2.5 rounded-lg text-primary">
                <SettingsIcon size={20} />
              </div>
              <span className="font-semibold">Help Center</span>
            </div>
            <ChevronRight size={20} className="text-slate-500" />
          </button>
          <button onClick={onLogout} className="w-full flex items-center gap-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 font-bold">
            <div className="bg-red-500/20 p-2.5 rounded-lg"><LogOut size={20} /></div>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </section>
    <footer className="mt-8 text-center">
      <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em]">StoryForge v2.4.0-Cosmic</p>
    </footer>
  </div>
);

const StorySettings = ({ onNavigate, onGenerate }: { onNavigate: (page: string) => void, onGenerate: (params: any) => void }) => {
  const [style, setStyle] = useState<VisualStyle>('watercolor');
  const [length, setLength] = useState(5);
  const [voice, setVoice] = useState<NarratorVoice>('warm');
  const [lang, setLang] = useState<Language>('english');
  const [prompt, setPrompt] = useState('');

  const handleGenerate = () => {
    onGenerate({
      prompt: prompt || "A magical adventure in a hidden forest",
      style,
      genre: "Adventure",
      length,
      lang,
      voice
    });
  };

  return (
    <div className="min-h-screen bg-background-dark flex flex-col">
      <header className="flex items-center justify-between p-6 sticky top-0 bg-background-dark/80 backdrop-blur-md z-10">
        <button onClick={() => onNavigate('home')} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10"><ArrowLeft size={20} /></button>
        <h1 className="text-xl font-bold">Story Settings</h1>
        <div className="w-10" />
      </header>
      <main className="flex-1 px-6 pb-32 space-y-8">
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Visual Style</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'watercolor', icon: <Brush />, label: 'Watercolor' },
              { id: 'pastel', icon: <Palette />, label: 'Pastel' },
              { id: 'pixel', icon: <LayoutGrid />, label: 'Pixel Art' },
              { id: 'ink', icon: <Pencil />, label: 'Ink Sketch' },
            ].map(s => (
              <button 
                key={s.id}
                onClick={() => setStyle(s.id as VisualStyle)}
                className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all border ${style === s.id ? 'bg-primary/10 border-primary text-primary' : 'bg-white/5 border-white/10 text-slate-400'}`}
              >
                <div className="mb-2">{s.icon}</div>
                <p className={`text-sm font-bold ${style === s.id ? 'text-primary' : 'text-slate-300'}`}>{s.label}</p>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Story Length</h3>
          <div className="flex flex-wrap gap-2">
            {[3, 5, 8, 10].map(l => (
              <button 
                key={l}
                onClick={() => setLength(l)}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${length === l ? 'bg-primary text-slate-900' : 'bg-white/5 text-slate-400'}`}
              >
                {l} pages
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Story Seed <span className="opacity-50">(optional)</span></h3>
          <textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full bg-slate-900 border border-white/5 rounded-xl p-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary outline-none min-h-[100px]" 
            placeholder="A small robot who finds a glowing star in a forest"
          />
        </section>

        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Narrator Voice</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'warm', icon: <Heart />, label: 'Warm' },
              { id: 'playful', icon: <PartyPopper />, label: 'Playful' },
              { id: 'calm', icon: <Cloud />, label: 'Calm' },
              { id: 'dynamic', icon: <Bolt />, label: 'Dynamic' },
            ].map(v => (
              <button 
                key={v.id}
                onClick={() => setVoice(v.id as NarratorVoice)}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${voice === v.id ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20' : 'bg-white/5 text-slate-400'}`}
              >
                {v.icon}
                <span className="text-sm font-bold">{v.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Language</h3>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'english', label: 'English', flag: '🇺🇸' },
              { id: 'french', label: 'French', flag: '🇫🇷' },
              { id: 'spanish', label: 'Spanish', flag: '🇪🇸' },
              { id: 'yoruba', label: 'Yoruba', flag: '🇳🇬' },
            ].map(l => (
              <button 
                key={l.id}
                onClick={() => setLang(l.id as Language)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${lang === l.id ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20' : 'bg-white/5 text-slate-400'}`}
              >
                <span className="text-lg">{l.flag}</span>
                <span className="text-sm font-bold">{l.label}</span>
              </button>
            ))}
          </div>
        </section>
      </main>
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background-dark to-transparent max-w-4xl mx-auto">
        <button 
          onClick={handleGenerate}
          className="w-full bg-primary text-slate-900 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all"
        >
          <Mic size={20} /> Speak My Story
        </button>
      </div>
    </div>
  );
};

const Loading = ({ params, onComplete, onStoryGenerated }: { params: any, onComplete: () => void, onStoryGenerated: (story: GeneratedStory) => void }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Weaving your tale...");

  useEffect(() => {
    let isMounted = true;

    const generate = async () => {
      try {
        // 1. Generate Story Text
        setStatus("Forging the narrative...");
        setProgress(10);
        const story = await generateStory(params.prompt, params.style, params.genre, params.length, params.lang);
        if (!isMounted) return;
        setProgress(30);

        // 2. Generate Images for each page
        const pagesWithImages = [];
        for (let i = 0; i < story.pages.length; i++) {
          setStatus(`Illustrating page ${i + 1} of ${story.pages.length}...`);
          const imageUrl = await generatePageImage(story.pages[i].imagePrompt, params.style);
          if (!isMounted) return;
          pagesWithImages.push({ ...story.pages[i], imageUrl });
          setProgress(30 + Math.floor(((i + 1) / story.pages.length) * 60));
        }

        const finalStory: GeneratedStory = { 
          ...story, 
          pages: pagesWithImages,
          voice: params.voice,
          language: params.lang
        };
        onStoryGenerated(finalStory);
        setProgress(100);
        setStatus("Your story is ready!");
        
        setTimeout(() => {
          if (isMounted) onComplete();
        }, 1000);

      } catch (error) {
        console.error("Generation failed:", error);
        setStatus("Magic failed... please try again.");
      }
    };

    generate();

    return () => {
      isMounted = false;
    };
  }, [params, onComplete, onStoryGenerated]);

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-gradient-to-b from-background-dark via-[#2e2700] to-background-dark overflow-hidden">
      {/* Cosmic Background Stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <Circle className="absolute top-[10%] left-[15%] text-white" size={8} fill="currentColor" />
        <Star className="absolute top-[25%] left-[80%] text-white" size={10} fill="currentColor" />
        <Star className="absolute top-[60%] left-[10%] text-white" size={12} fill="currentColor" />
        <Circle className="absolute top-[80%] left-[70%] text-white" size={8} fill="currentColor" />
        <Sparkles className="absolute top-[40%] left-[50%] text-white" size={14} />
      </div>

      {/* Top App Bar with Back Button */}
      <div className="flex items-center p-4 pb-2 justify-between">
        <button aria-label="Go back" className="text-white flex size-12 shrink-0 items-center justify-start focus:outline-none">
          <ArrowLeft size={24} />
        </button>
      </div>

      {/* Main Content Area: Illustration */}
      <div className="flex w-full grow items-center justify-center p-6">
        <div className="w-full max-w-sm aspect-[4/5] relative flex items-center justify-center">
          {/* Decorative Glow Background */}
          <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full animate-pulse"></div>
          
          {/* Central Illustration Container */}
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl">
            <div className="flex flex-col items-center gap-6">
              {/* Magic Book Illustration */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="relative w-48 h-48 bg-center bg-contain bg-no-repeat" 
                style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBetzJqUP13wvRXFbQl_yoYTKt3uweFxad087U2BbDGh757ZpVS4n33e9XYhDH0XOGO-Fgvi65kf8tNmEWwf2mQbqeCfKvsBSmXzmBc9LSf3jK_HM74951NuZtXJAzoM70krkjeBimkaAE37y2BwCutTEr1Z1PJJVWn4816qne023-oCjrF_kqfhh0uGMgx3vOD8fHZjsQgsrQoEr9H8rhbulwJHCKNGb7VvXvqbUkMLfPS1BMkhlJMPIvOtxETb-CjRjoP3erYExU')" }}
              />
              
              {/* Floating Magic Sparkles */}
              <div className="absolute inset-0 pointer-events-none">
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute top-1/4 right-1/4 text-primary"
                >
                  <Sparkles size={24} />
                </motion.div>
                <motion.div 
                  animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.8, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2.5, delay: 0.5 }}
                  className="absolute bottom-1/4 left-1/4 text-primary"
                >
                  <Star size={20} fill="currentColor" />
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress and Status Section */}
      <div className="flex flex-col gap-6 p-8 pb-16">
        {/* Progress Header */}
        <div className="flex justify-between items-end">
          <div className="flex flex-col gap-1">
            <h2 className="text-white text-xl font-bold leading-tight">{status}</h2>
          </div>
          <p className="text-lg font-bold leading-none text-primary">{progress}%</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full">
          <div className="h-3 w-full rounded-full bg-white/5 overflow-hidden border border-white/5">
            <motion.div 
              className="h-full bg-primary rounded-full" 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Status Subtext */}
        <div className="flex items-center gap-2">
          <Pencil className="text-primary" size={16} />
          <p className="text-sm font-medium tracking-wide text-white/60">{status}</p>
        </div>
      </div>

      {/* Decorative Element at Bottom */}
      <div className="h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
    </div>
  );
};

const Success = ({ story, onRead }: { story: GeneratedStory | null, onRead: () => void }) => {
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-gradient-to-b from-background-dark via-[#2e2700] to-background-dark overflow-hidden">
      {/* Cosmic Background Stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <Circle className="absolute top-[10%] left-[15%] text-white" size={8} fill="currentColor" />
        <Star className="absolute top-[25%] left-[80%] text-white" size={10} fill="currentColor" />
        <Star className="absolute top-[60%] left-[10%] text-white" size={12} fill="currentColor" />
        <Circle className="absolute top-[80%] left-[70%] text-white" size={8} fill="currentColor" />
        <Sparkles className="absolute top-[40%] left-[50%] text-white" size={14} />
      </div>

      {/* Top App Bar */}
      <div className="flex items-center p-4 pb-2 justify-between">
        <div className="w-12" />
        <h1 className="text-lg font-bold">Story Ready!</h1>
        <div className="w-12" />
      </div>

      {/* Main Content Area: Illustration */}
      <div className="flex w-full grow items-center justify-center p-6">
        <div className="w-full max-w-sm aspect-[4/5] relative flex items-center justify-center">
          {/* Decorative Glow Background */}
          <div className="absolute inset-0 bg-primary/30 blur-[120px] rounded-full"></div>
          
          {/* Central Illustration Container */}
          <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl p-8 text-center">
            <motion.div 
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 12 }}
              className="relative mb-8"
            >
              <div className="absolute inset-0 bg-primary blur-2xl opacity-20 animate-pulse" />
              <PartyPopper size={80} className="text-primary relative z-10" />
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold mb-2"
            >
              Your Tale is Forged!
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-white/60 mb-8"
            >
              "{story?.title || "The Whispering Woods"}" is now part of your magical library.
            </motion.p>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              onClick={() => onRead()}
              className="w-full py-4 bg-primary text-background-dark font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
            >
              <BookOpen size={20} />
              Read Now
            </motion.button>
          </div>
        </div>
      </div>

      {/* Progress and Status Section */}
      <div className="flex flex-col gap-6 p-8 pb-16">
        <div className="flex justify-between items-end">
          <div className="flex flex-col gap-1">
            <h2 className="text-white text-xl font-bold leading-tight">Story successfully created</h2>
          </div>
          <p className="text-lg font-bold leading-none text-primary">100%</p>
        </div>

        <div className="w-full">
          <div className="h-3 w-full rounded-full bg-white/5 overflow-hidden border border-white/5">
            <div className="h-full bg-primary rounded-full w-full" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CheckCircle className="text-primary" size={16} />
          <p className="text-sm font-medium tracking-wide text-white/60">Your magical adventure is ready.</p>
        </div>
      </div>

      {/* Decorative Element at Bottom */}
      <div className="h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
    </div>
  );
};

const StoryReader = ({ story, onBack, onSwitchMode, onListeningMode }: { story: GeneratedStory | null, onBack: () => void, onSwitchMode: () => void, onListeningMode: () => void }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isReadingAloud, setIsReadingAloud] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const pages = story?.pages || [
    { text: "Once upon a time, in a world of magic...", imagePrompt: "" },
    { text: "The little robot found a glowing star.", imagePrompt: "" }
  ];

  const handleReadAloud = async () => {
    if (isReadingAloud) {
      audioRef.current?.pause();
      setIsReadingAloud(false);
      return;
    }

    try {
      setIsReadingAloud(true);
      const audioUrl = await textToSpeech(pages[currentPage].text, story?.voice);
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
      } else {
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.play();
        audio.onended = () => setIsReadingAloud(false);
      }
    } catch (error) {
      console.error("TTS failed:", error);
      setIsReadingAloud(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-white dark:bg-background-dark text-slate-900 dark:text-slate-100 overflow-x-hidden">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center bg-white/80 dark:bg-background-dark/80 backdrop-blur-md px-4 py-3 justify-between border-b border-slate-100 dark:border-white/5">
        <button 
          onClick={onBack}
          className="text-slate-900 dark:text-white flex size-10 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1 flex flex-col items-center">
          <h2 className="text-slate-900 dark:text-white text-base font-bold tracking-tight truncate max-w-[200px]">{story?.title || "Classic Reader"}</h2>
          <div className="flex gap-4">
            <button onClick={onSwitchMode} className="text-[10px] text-primary font-bold uppercase tracking-widest">Modern</button>
            <button onClick={onListeningMode} className="text-[10px] text-primary font-bold uppercase tracking-widest">Listening</button>
          </div>
        </div>
        <div className="flex size-10 items-center justify-end">
          <button 
            onClick={handleReadAloud}
            className={`flex items-center justify-center rounded-full transition-colors ${isReadingAloud ? 'text-red-500' : 'text-primary'}`}
          >
            {isReadingAloud ? <Volume2 size={24} /> : <PlayCircle size={24} />}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto pb-32">
        {/* Hero Illustration */}
        <div className="p-4">
          <div className="aspect-[4/3] w-full bg-slate-100 dark:bg-white/5 rounded-xl overflow-hidden relative shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            <img 
              alt="Story illustration" 
              className="w-full h-full object-cover" 
              src={pages[currentPage].imageUrl || "https://picsum.photos/seed/story/800/600"}
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Title & Author */}
        <div className="px-6 pt-4 pb-6 text-center">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2 uppercase">{story?.title || "The Whispering Stars"}</h1>
          <p className="font-medium text-sm tracking-wide text-slate-500 dark:text-white/60">StoryForge AI</p>
        </div>

        {/* Controls */}
        <div className="px-6 flex justify-center gap-4 mb-8">
          <button 
            onClick={handleReadAloud}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold shadow-lg transition-all active:scale-95 ${isReadingAloud ? 'bg-red-500 text-white animate-pulse' : 'bg-primary text-background-dark shadow-primary/20 hover:bg-primary/90'}`}
          >
            {isReadingAloud ? <Volume2 size={20} /> : <PlayCircle size={20} fill="currentColor" />}
            <span>{isReadingAloud ? 'Stop Reading' : 'Read Aloud'}</span>
          </button>
          <button className="flex items-center justify-center size-11 rounded-full border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
            <Type size={20} />
          </button>
        </div>

        {/* Story Text */}
        <div className="px-8 pb-12">
          <div className="font-serif text-lg leading-relaxed text-slate-800 dark:text-slate-200">
            <span className="text-5xl font-bold text-primary mr-3 float-left leading-[0.8] mt-2">{pages[currentPage].text.charAt(0)}</span>
            {pages[currentPage].text.slice(1)}
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-background-dark/95 backdrop-blur-md border-t border-slate-100 dark:border-white/5 px-6 pb-8 pt-3 flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button 
          disabled={currentPage === 0}
          onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
          className="flex flex-col items-center gap-1 group disabled:opacity-30"
        >
          <div className="text-slate-400 dark:text-white/40 transition-colors flex h-8 items-center justify-center">
            <ChevronLeft size={24} />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/40">Previous</p>
        </button>
        
        <div className="flex gap-1">
          {pages.map((_, i) => (
            <div key={i} className={`h-1 rounded-full transition-all ${i === currentPage ? 'w-8 bg-primary' : 'w-2 bg-primary/20'}`} />
          ))}
        </div>

        <button 
          disabled={currentPage === pages.length - 1}
          onClick={() => setCurrentPage(p => Math.min(pages.length - 1, p + 1))}
          className="flex flex-col items-center gap-1 group disabled:opacity-30"
        >
          <div className="text-slate-400 dark:text-white/40 transition-colors flex h-8 items-center justify-center">
            <ChevronRight size={24} />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/40">Next</p>
        </button>
      </nav>
    </div>
  );
};

const ModernReader = ({ story, onBack, onSwitchMode, onListeningMode, onNewStory }: { story: GeneratedStory | null, onBack: () => void, onSwitchMode: () => void, onListeningMode: () => void, onNewStory: () => void }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isReadingAloud, setIsReadingAloud] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const pages = story?.pages || [
    { text: "Once upon a time, in a world of magic...", imagePrompt: "" },
    { text: "The little robot found a glowing star.", imagePrompt: "" }
  ];

  const handleReadAloud = async () => {
    if (isReadingAloud) {
      audioRef.current?.pause();
      setIsReadingAloud(false);
      return;
    }

    try {
      setIsReadingAloud(true);
      const audioUrl = await textToSpeech(pages[currentPage].text, story?.voice);
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
      } else {
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.play();
        audio.onended = () => setIsReadingAloud(false);
      }
    } catch (error) {
      console.error("TTS failed:", error);
      setIsReadingAloud(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 overflow-x-hidden">
      {/* Header / Branding */}
      <header className="flex items-center bg-background-light dark:bg-background-dark p-4 border-b border-white/5 sticky top-0 z-10">
        <button 
          onClick={onBack}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 px-4">
          <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight truncate max-w-[200px]">{story?.title || "StoryForge"}</h2>
          <div className="flex gap-4">
            <button onClick={onSwitchMode} className="text-[10px] text-primary font-bold uppercase tracking-widest">Classic</button>
            <button onClick={onListeningMode} className="text-[10px] text-primary font-bold uppercase tracking-widest">Listening</button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleReadAloud}
            className={`flex size-10 items-center justify-center rounded-full shadow-lg transition-all ${isReadingAloud ? 'bg-red-500 text-white animate-pulse' : 'bg-primary text-black shadow-primary/20 hover:scale-105'}`}
          >
            {isReadingAloud ? <Volume2 size={20} /> : <PlayCircle size={20} />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto custom-scrollbar pb-32">
        {/* Hero Illustration */}
        <div className="w-full">
          <div className="px-0 sm:px-4 sm:py-4">
            <div className="relative w-full aspect-[4/3] sm:rounded-xl overflow-hidden bg-primary/5 group">
              <div className="absolute inset-0 bg-gradient-to-t from-background-dark/80 via-transparent to-transparent z-10"></div>
              <img 
                className="w-full h-full object-cover" 
                alt="Story illustration" 
                src={pages[currentPage].imageUrl || "https://picsum.photos/seed/story/800/600"}
                referrerPolicy="no-referrer"
              />
              {/* Page Navigation Indicators Overlay */}
              <div 
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                className="absolute inset-y-0 left-0 w-16 flex items-center justify-center z-20 cursor-pointer hover:bg-white/5 transition-colors"
              >
                <ChevronLeft className={currentPage === 0 ? "text-white/10" : "text-white/50"} size={32} />
              </div>
              <div 
                onClick={() => setCurrentPage(p => Math.min(pages.length - 1, p + 1))}
                className="absolute inset-y-0 right-0 w-16 flex items-center justify-center z-20 cursor-pointer hover:bg-white/5 transition-colors"
              >
                <ChevronRight className={currentPage === pages.length - 1 ? "text-white/10" : "text-white/50"} size={32} />
              </div>
            </div>
          </div>
        </div>

        {/* Story Content */}
        <article className="px-6 py-8 flex-1">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">Page {currentPage + 1}</span>
              <div className="h-1 flex-1 bg-primary/10 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${((currentPage + 1) / pages.length) * 100}%` }}></div>
              </div>
              <span className="text-xs text-slate-500 dark:text-white/40 font-medium">{currentPage + 1} of {pages.length}</span>
            </div>
            <h1 className="text-slate-900 dark:text-slate-100 text-3xl font-bold leading-tight mb-6">{story?.title || "The Star-Bound Voyager"}</h1>
            <div className="space-y-6 text-lg leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                {pages[currentPage].text}
              </p>
            </div>
          </div>
        </article>

        {/* Read Aloud Control / Floating Action */}
        <div className="px-6 py-4 flex justify-center">
          <button 
            onClick={handleReadAloud}
            className={`flex items-center gap-3 px-6 py-3 rounded-full font-bold shadow-xl transition-all active:scale-95 ${isReadingAloud ? 'bg-red-500 text-white animate-pulse' : 'bg-primary text-black shadow-primary/30 hover:scale-105'}`}
          >
            {isReadingAloud ? <Volume2 size={24} /> : <PlayCircle size={24} fill="currentColor" />}
            <span>{isReadingAloud ? 'Stop Reading' : 'Read Aloud'}</span>
          </button>
        </div>
      </main>

      {/* Bottom Navigation / Toolbar */}
      <nav className="border-t border-slate-100 dark:border-white/5 bg-background-light dark:bg-background-dark px-4 pb-8 pt-3 sticky bottom-0 z-20">
        <div className="flex justify-around items-center max-w-lg mx-auto">
          <button className="flex flex-col items-center gap-1 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-full group-hover:bg-primary/10 text-slate-500 dark:text-white/40 group-hover:text-primary transition-colors">
              <FileText size={20} />
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-white/40 group-hover:text-primary">PDF</p>
          </button>
          
          <button className="flex flex-col items-center gap-1 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-full group-hover:bg-primary/10 text-slate-500 dark:text-white/40 group-hover:text-primary transition-colors">
              <Share2 size={20} />
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-white/40 group-hover:text-primary">Share</p>
          </button>

          <div className="h-8 w-[1px] bg-primary/20 mx-2"></div>
          
          <button 
            onClick={onNewStory}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-black shadow-lg shadow-primary/20 hover:scale-110 transition-transform">
              <Wand2 size={24} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">New Story</p>
          </button>

          <div className="h-8 w-[1px] bg-primary/20 mx-2"></div>

          <button className="flex flex-col items-center gap-1 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-full group-hover:bg-primary/10 text-slate-500 dark:text-white/40 group-hover:text-primary transition-colors">
              <SettingsIcon size={20} />
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-white/40 group-hover:text-primary">Display</p>
          </button>

          <button 
            onClick={handleReadAloud}
            className={`flex flex-col items-center gap-1 group ${isReadingAloud ? 'text-red-500' : ''}`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-full group-hover:bg-primary/10 transition-colors ${isReadingAloud ? 'text-red-500' : 'text-slate-500 dark:text-white/40 group-hover:text-primary'}`}>
              <Volume2 size={20} />
            </div>
            <p className={`text-[10px] font-semibold uppercase tracking-wider ${isReadingAloud ? 'text-red-500' : 'text-slate-500 dark:text-white/40 group-hover:text-primary'}`}>{isReadingAloud ? 'Stop' : 'Aloud'}</p>
          </button>
        </div>
      </nav>
    </div>
  );
};

const ListeningReader = ({ story, onBack, onSwitchMode, onNewStory }: { story: GeneratedStory | null, onBack: () => void, onSwitchMode: (mode: string) => void, onNewStory: () => void }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const pages = story?.pages || [
    { text: "Once in the heart of the purple nebula...", imagePrompt: "" }
  ];

  const handleTogglePlay = async () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    try {
      setIsPlaying(true);
      const audioUrl = await textToSpeech(pages[currentPage].text, story?.voice);
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
      } else {
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.play();
        audio.onended = () => {
          if (currentPage < pages.length - 1) {
            setCurrentPage(p => p + 1);
          } else {
            setIsPlaying(false);
          }
        };
      }
    } catch (error) {
      console.error("TTS failed:", error);
      setIsPlaying(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 overflow-x-hidden">
      {/* Top Navigation */}
      <div className="flex items-center bg-background-light dark:bg-background-dark/80 backdrop-blur-md sticky top-0 z-50 p-4 justify-between border-b border-primary/10">
        <button 
          onClick={onBack}
          className="text-primary dark:text-slate-100 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-primary/10 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1 flex flex-col items-center">
          <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight text-center truncate max-w-[200px]">{story?.title || "StoryForge Reader"}</h2>
          <div className="flex gap-4">
            <button onClick={() => onSwitchMode('reader-classic')} className="text-[10px] text-primary font-bold uppercase tracking-widest">Classic</button>
            <button onClick={() => onSwitchMode('reader-modern')} className="text-[10px] text-primary font-bold uppercase tracking-widest">Modern</button>
          </div>
        </div>
        <div className="flex w-10 items-center justify-end">
          <button className="flex items-center justify-center rounded-full size-10 text-primary dark:text-slate-100 hover:bg-primary/10 transition-colors">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-32">
        {/* Illustration Container */}
        <div className="p-4">
          <div className="relative group">
            <div 
              className="w-full bg-center bg-no-repeat bg-cover flex flex-col justify-end overflow-hidden bg-primary/20 rounded-2xl aspect-[4/3] shadow-2xl shadow-primary/10 relative"
              style={{ backgroundImage: `url("${pages[currentPage].imageUrl || "https://picsum.photos/seed/story/800/600"}")` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-background-dark/60 via-transparent to-transparent"></div>
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-6 z-10">
                <button 
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  className="bg-white/10 backdrop-blur-lg border border-white/20 text-white rounded-full p-3 flex items-center justify-center hover:bg-white/20 transition-all disabled:opacity-30"
                >
                  <SkipBack size={24} />
                </button>
                <button 
                  onClick={handleTogglePlay}
                  className={`bg-primary backdrop-blur-lg text-background-dark rounded-full p-4 flex items-center justify-center shadow-lg transition-transform hover:scale-105 ${isPlaying ? 'animate-pulse' : ''}`}
                >
                  {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
                </button>
                <button 
                  disabled={currentPage === pages.length - 1}
                  onClick={() => setCurrentPage(p => Math.min(pages.length - 1, p + 1))}
                  className="bg-white/10 backdrop-blur-lg border border-white/20 text-white rounded-full p-3 flex items-center justify-center hover:bg-white/20 transition-all disabled:opacity-30"
                >
                  <SkipForward size={24} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Story Text Section */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-primary text-xs font-bold uppercase tracking-widest">Page {currentPage + 1} of {pages.length}</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} className="text-yellow-400" fill={i <= 4 ? "currentColor" : "none"} />)}
            </div>
          </div>
          <h1 className="text-slate-900 dark:text-slate-100 text-3xl font-bold leading-tight mb-4">{story?.title || "The Star-Catcher's Journey"}</h1>
          <div className="space-y-6">
            <p className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed font-light">
              {pages[currentPage].text}
            </p>
          </div>

          {/* Pagination Dots */}
          <div className="flex w-full flex-row items-center justify-center gap-3 py-10">
            {pages.map((_, i) => (
              <div 
                key={i} 
                className={`h-2 rounded-full transition-all ${i === currentPage ? 'w-6 bg-primary shadow-[0_0_8px_rgba(244,209,37,0.6)]' : 'w-2 bg-primary/20 dark:bg-primary/30'}`} 
              />
            ))}
          </div>
        </div>
      </main>

      {/* Bottom Actions Toolbar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-8 bg-gradient-to-t from-background-light dark:from-background-dark via-background-light/95 dark:via-background-dark/95 to-transparent">
        <div className="max-w-md mx-auto bg-white/80 dark:bg-primary/5 backdrop-blur-xl border border-white/20 dark:border-primary/20 rounded-2xl p-2 flex items-center justify-between shadow-2xl">
          <button className="flex flex-col items-center gap-1 flex-1 py-2 text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors">
            <FileText size={20} />
            <span className="text-[10px] font-bold uppercase">PDF</span>
          </button>
          <button className="flex flex-col items-center gap-1 flex-1 py-2 text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors border-x border-slate-200 dark:border-primary/10">
            <Share2 size={20} />
            <span className="text-[10px] font-bold uppercase">Share</span>
          </button>
          <button onClick={onNewStory} className="flex flex-col items-center gap-1 flex-1 py-2 text-primary">
            <div className="bg-primary/20 p-2 rounded-xl mb-1 hover:bg-primary/30 transition-colors">
              <PlusCircle size={24} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-tighter">New Story</span>
          </button>
          <button 
            onClick={handleTogglePlay}
            className={`flex flex-col items-center gap-1 flex-1 py-2 transition-colors border-l border-slate-200 dark:border-primary/10 ${isPlaying ? 'text-red-500' : 'text-slate-600 dark:text-slate-400 hover:text-primary'}`}
          >
            <Volume2 size={20} />
            <span className="text-[10px] font-bold uppercase">{isPlaying ? 'Stop' : 'Aloud'}</span>
          </button>
        </div>
      </div>

      {/* Decorative Glow */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[100px] rounded-full -z-10 pointer-events-none"></div>
      <div className="fixed bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-yellow-400/10 blur-[80px] rounded-full -z-10 pointer-events-none"></div>
    </div>
  );
};

export default function App() {
  const [currentPage, setCurrentPage] = useState('auth');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  
  // Generation State
  const [generationParams, setGenerationParams] = useState({
    prompt: '',
    style: 'watercolor' as VisualStyle,
    genre: 'Adventure',
    length: 5
  });
  const [generatedStory, setGeneratedStory] = useState<GeneratedStory | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentPage('onboarding');
  };

  const handleOnboardingFinish = () => {
    setHasSeenOnboarding(true);
    setCurrentPage('home');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'auth': return <Auth onLogin={handleLogin} />;
      case 'onboarding': return <Onboarding onFinish={handleOnboardingFinish} />;
      case 'home': return <Home onNavigate={setCurrentPage} onRead={() => setCurrentPage('reader-modern')} />;
      case 'library': return <Library onRead={() => setCurrentPage('reader-modern')} />;
      case 'explore': return <Explore />;
      case 'profile': return <Profile onNavigate={setCurrentPage} onLogout={() => setCurrentPage('auth')} />;
      case 'settings': return <StorySettings onNavigate={setCurrentPage} onGenerate={(params) => {
        setGenerationParams(params);
        setCurrentPage('loading');
      }} />;
      case 'loading': return <Loading params={generationParams} onComplete={() => setCurrentPage('success')} onStoryGenerated={setGeneratedStory} />;
      case 'success': return <Success story={generatedStory} onRead={() => setCurrentPage('reader-modern')} />;
      case 'reader-classic': return <StoryReader story={generatedStory} onBack={() => setCurrentPage('library')} onSwitchMode={() => setCurrentPage('reader-modern')} onListeningMode={() => setCurrentPage('reader-listening')} />;
      case 'reader-modern': return <ModernReader story={generatedStory} onBack={() => setCurrentPage('library')} onSwitchMode={() => setCurrentPage('reader-classic')} onListeningMode={() => setCurrentPage('reader-listening')} onNewStory={() => setCurrentPage('settings')} />;
      case 'reader-listening': return <ListeningReader story={generatedStory} onBack={() => setCurrentPage('library')} onSwitchMode={setCurrentPage} onNewStory={() => setCurrentPage('settings')} />;
      default: return <Home onNavigate={setCurrentPage} onRead={() => setCurrentPage('reader-modern')} />;
    }
  };

  return (
    <div className="min-h-screen bg-background-dark text-white font-lexend w-full max-w-4xl mx-auto shadow-2xl relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderPage()}
        </motion.div>
      </AnimatePresence>
      
      {['home', 'library', 'explore', 'profile'].includes(currentPage) && (
        <BottomNav active={currentPage} onChange={setCurrentPage} />
      )}
    </div>
  );
}
