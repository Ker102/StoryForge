import { useState } from 'react';
import type { StoryData } from '../App';

interface LibraryScreenProps {
  stories: StoryData[];
  onRead: () => void;
}

export default function LibraryScreen({ stories, onRead }: LibraryScreenProps) {
  const [activeTab, setActiveTab] = useState('All Stories');

  const filteredStories = stories.filter(s => {
    if (activeTab === 'All Stories') return true;
    if (activeTab === 'Finished') return s.is_complete;
    if (activeTab === 'In Progress') return !s.is_complete;
    return true;
  });

  return (
    <div className="min-h-screen bg-background-dark pb-28">
      <header className="sticky top-0 z-10 bg-background-dark/95 backdrop-blur-lg px-6 py-5 border-b border-white/5 flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold italic">StoryForge</h1>
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
        {filteredStories.length === 0 ? (
          <div className="col-span-full text-center py-20">
            <p className="text-slate-500 text-lg">No stories yet. Create your first one!</p>
          </div>
        ) : (
          filteredStories.map(story => (
            <button
              key={story.id}
              onClick={onRead}
              className="flex flex-col gap-3 group text-left w-full"
            >
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-xl w-full bg-slate-800">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                {story.is_complete && (
                  <div className="absolute top-2 right-2 bg-yellow-50/10 backdrop-blur-md border border-primary/20 rounded-full px-2 py-0.5">
                    <p className="text-[10px] font-bold text-primary">FINISHED</p>
                  </div>
                )}
                {!story.is_complete && (
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden">
                      <div className="bg-primary h-full" style={{ width: `${story.page_count > 0 ? (story.current_page / story.page_count) * 100 : 0}%` }} />
                    </div>
                  </div>
                )}
                <div className="absolute bottom-4 left-3 right-3">
                  <p className="text-white text-sm font-bold leading-tight">{story.title}</p>
                </div>
              </div>
              <div className="px-1">
                <p className="text-sm font-bold leading-tight">{story.title}</p>
                <p className={`text-xs font-medium mt-1 ${story.is_complete ? 'text-slate-500' : 'text-primary'}`}>
                  {story.is_complete ? 'Finished • 100%' : `Page ${story.current_page} of ${story.page_count}`}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
