import { Mic, ChevronRight, CheckCircle, Star } from 'lucide-react';
import type { User } from 'firebase/auth';
import type { StoryData } from '../App';

interface HomeScreenProps {
  user: User | null;
  stories: StoryData[];
  onNavigate: (page: string) => void;
  onRead: () => void;
}

export default function HomeScreen({ user, stories, onNavigate, onRead }: HomeScreenProps) {
  const displayName = user?.displayName?.split(' ')[0] || 'Storyteller';
  const photoURL = user?.photoURL;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="p-6 space-y-8 pb-28">
      <header className="flex items-center justify-between pt-4">
        <h1 className="font-serif text-2xl font-bold italic">{greeting}, {displayName} 👋</h1>
        {photoURL && (
          <div className="w-11 h-11 rounded-full border-2 border-primary overflow-hidden">
            <img src={photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
        )}
      </header>

      {/* Hero CTA */}
      <section onClick={() => onNavigate('settings')} className="bg-gradient-to-br from-yellow-500 to-primary rounded-[2.5rem] p-8 shadow-xl shadow-primary/20 relative overflow-hidden cursor-pointer group">
        <Mic size={120} className="absolute -right-4 -top-4 opacity-10 text-white" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md"><Mic size={20} className="text-white" /></div>
              <span className="text-white/90 font-bold text-xs uppercase tracking-wider">Voice Input</span>
            </div>
            <h2 className="text-2xl font-bold text-white leading-tight">Speak a sentence.<br />Get a book.</h2>
          </div>
          <div className="bg-white/20 rounded-full p-4 group-hover:bg-white/30 transition-colors">
            <ChevronRight size={32} className="text-white" />
          </div>
        </div>
      </section>

      {/* Genres */}
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

      {/* Library */}
      <section>
        <h3 className="text-lg font-extrabold mb-4">Library</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {(stories.length > 0 ? stories : PLACEHOLDER_STORIES).map(story => (
            <button
              key={story.id}
              onClick={onRead}
              className="rounded-3xl p-5 aspect-[3/4.2] relative overflow-hidden group shadow-md text-left w-full bg-slate-800"
            >
              <div className="relative h-full flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="bg-black/30 backdrop-blur-md text-[10px] px-2 py-1 rounded-full font-bold">{story.page_count}pp</span>
                  <div className="bg-primary/20 p-2 rounded-full">
                    <Star size={16} className="text-primary" fill="currentColor" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-white/80 text-[10px] font-extrabold uppercase tracking-widest">{story.style}</p>
                  <h4 className="text-white font-bold text-base leading-tight">{story.title}</h4>
                  {story.is_complete ? (
                    <div className="mt-2 flex items-center gap-1">
                      <CheckCircle size={12} className="text-primary" />
                      <span className="text-[10px] text-white/70 font-bold uppercase">FINISHED</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${story.page_count > 0 ? (story.current_page / story.page_count) * 100 : 0}%` }} />
                      </div>
                      <span className="text-[10px] text-white/70 font-bold">Page {story.current_page}</span>
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
}

const PLACEHOLDER_STORIES: StoryData[] = [
  { id: '1', title: 'Pip and the Glowing Star', style: 'Watercolour', page_count: 6, current_page: 3, is_complete: false, updated_at: '' },
  { id: '2', title: 'Luna and the Moongate', style: 'Pastel', page_count: 8, current_page: 8, is_complete: true, updated_at: '' },
  { id: '3', title: 'Dippy the Dragon', style: 'Pixel Art', page_count: 12, current_page: 0, is_complete: false, updated_at: '' },
  { id: '4', title: 'Rusty the Fox', style: 'Ink Sketch', page_count: 10, current_page: 0, is_complete: false, updated_at: '' },
];
