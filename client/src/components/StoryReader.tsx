import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, PlayCircle, Volume2, FileText, Share2, Wand2, Settings as SettingsIcon } from 'lucide-react';
import type { GeneratedPage } from '../App';
import type { StorySession } from '../lib/websocket';

interface StoryReaderProps {
  pages: GeneratedPage[];
  title: string;
  style: string;
  session: StorySession | null;
  onBack: () => void;
  onNewStory: () => void;
}

export default function StoryReader({ pages, title, style, session, onBack, onNewStory }: StoryReaderProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const hasPages = pages.length > 0;
  const page = hasPages ? pages[currentPage] : null;

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handlePlayAudio = () => {
    if (!page?.narration_audio_base64) return;

    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    try {
      setIsPlaying(true);
      const audioUrl = `data:audio/mp3;base64,${page.narration_audio_base64}`;
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.play().catch(() => setIsPlaying(false));
        audio.onended = () => setIsPlaying(false);
      }
    } catch (err) {
      console.error('Audio playback failed:', err);
      setIsPlaying(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-dark text-slate-100 overflow-x-hidden">
      {/* Header */}
      <header className="flex items-center bg-background-dark/80 backdrop-blur-md p-4 border-b border-white/5 sticky top-0 z-10">
        <button type="button" onClick={onBack} aria-label="Back" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 px-4">
          <h2 className="text-lg font-bold leading-tight tracking-tight truncate max-w-[200px]">{title || 'StoryForge'}</h2>
          <p className="text-[10px] text-primary font-bold uppercase tracking-widest">{style}</p>
        </div>
        <button
          type="button"
          onClick={handlePlayAudio}
          aria-label={isPlaying ? 'Stop narration' : 'Play narration'}
          className={`flex size-10 items-center justify-center rounded-full shadow-lg transition-all ${isPlaying ? 'bg-red-500 text-white animate-pulse' : 'bg-primary text-black shadow-primary/20 hover:scale-105'}`}
        >
          {isPlaying ? <Volume2 size={20} /> : <PlayCircle size={20} />}
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col overflow-y-auto pb-32">
        {/* Hero Image */}
        {page?.image_base64 && (
          <div className="w-full">
            <div className="px-0 sm:px-4 sm:py-4">
              <div className="relative w-full aspect-[4/3] sm:rounded-xl overflow-hidden bg-primary/5 group">
                <div className="absolute inset-0 bg-gradient-to-t from-background-dark/80 via-transparent to-transparent z-10" />
                <img
                  className="w-full h-full object-cover"
                  alt="Story illustration"
                  src={`data:image/png;base64,${page.image_base64}`}
                />
                {/* Nav overlays — using buttons for keyboard accessibility */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  aria-label="Previous page"
                  className="absolute inset-y-0 left-0 w-16 flex items-center justify-center z-20 cursor-pointer hover:bg-white/5 transition-colors bg-transparent border-none"
                >
                  <ChevronLeft className={currentPage === 0 ? "text-white/10" : "text-white/50"} size={32} />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.min(pages.length - 1, p + 1))}
                  disabled={currentPage === pages.length - 1}
                  aria-label="Next page"
                  className="absolute inset-y-0 right-0 w-16 flex items-center justify-center z-20 cursor-pointer hover:bg-white/5 transition-colors bg-transparent border-none"
                >
                  <ChevronRight className={currentPage === pages.length - 1 ? "text-white/10" : "text-white/50"} size={32} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Story Text */}
        <article className="px-6 py-8 flex-1">
          <div className="max-w-2xl mx-auto">
            {/* Progress bar */}
            <div className="flex items-center gap-2 mb-4">
              <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">Page {currentPage + 1}</span>
              <div className="h-1 flex-1 bg-primary/10 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${pages.length > 0 ? ((currentPage + 1) / pages.length) * 100 : 0}%` }} />
              </div>
              <span className="text-xs text-white/40 font-medium">{currentPage + 1} of {pages.length}</span>
            </div>

            <h1 className="text-3xl font-bold leading-tight mb-6">{title}</h1>

            {page ? (
              <div className="space-y-6 text-lg leading-relaxed text-slate-300">
                <p>{page.text}</p>
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-slate-500 text-lg">No pages generated yet.</p>
                <button type="button" onClick={onNewStory} className="mt-4 px-6 py-3 bg-primary text-slate-900 rounded-xl font-bold">
                  Create a Story
                </button>
              </div>
            )}
          </div>
        </article>

        {/* Read Aloud Button */}
        {page?.narration_audio_base64 && (
          <div className="px-6 py-4 flex justify-center">
            <button
              type="button"
              onClick={handlePlayAudio}
              className={`flex items-center gap-3 px-6 py-3 rounded-full font-bold shadow-xl transition-all active:scale-95 ${isPlaying ? 'bg-red-500 text-white animate-pulse' : 'bg-primary text-black shadow-primary/30 hover:scale-105'}`}
            >
              {isPlaying ? <Volume2 size={24} /> : <PlayCircle size={24} fill="currentColor" />}
              <span>{isPlaying ? 'Stop Reading' : 'Read Aloud'}</span>
            </button>
          </div>
        )}
      </main>

      {/* Bottom Toolbar */}
      <nav className="border-t border-white/5 bg-background-dark px-4 pb-8 pt-3 sticky bottom-0 z-20">
        <div className="flex justify-around items-center max-w-lg mx-auto">
          <button type="button" aria-label="Export PDF" className="flex flex-col items-center gap-1 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-full group-hover:bg-primary/10 text-white/40 group-hover:text-primary transition-colors">
              <FileText size={20} />
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40 group-hover:text-primary">PDF</p>
          </button>

          <button type="button" aria-label="Share story" className="flex flex-col items-center gap-1 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-full group-hover:bg-primary/10 text-white/40 group-hover:text-primary transition-colors">
              <Share2 size={20} />
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40 group-hover:text-primary">Share</p>
          </button>

          <div className="h-8 w-[1px] bg-primary/20 mx-2" />

          <button type="button" onClick={onNewStory} className="flex flex-col items-center gap-1 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-black shadow-lg shadow-primary/20 hover:scale-110 transition-transform">
              <Wand2 size={24} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">New Story</p>
          </button>

          <div className="h-8 w-[1px] bg-primary/20 mx-2" />

          <button type="button" aria-label="Display settings" className="flex flex-col items-center gap-1 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-full group-hover:bg-primary/10 text-white/40 group-hover:text-primary transition-colors">
              <SettingsIcon size={20} />
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40 group-hover:text-primary">Display</p>
          </button>

          <button
            type="button"
            onClick={handlePlayAudio}
            aria-label={isPlaying ? 'Stop narration' : 'Read aloud'}
            className={`flex flex-col items-center gap-1 group ${isPlaying ? 'text-red-500' : ''}`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-full group-hover:bg-primary/10 transition-colors ${isPlaying ? 'text-red-500' : 'text-white/40 group-hover:text-primary'}`}>
              <Volume2 size={20} />
            </div>
            <p className={`text-[10px] font-semibold uppercase tracking-wider ${isPlaying ? 'text-red-500' : 'text-white/40 group-hover:text-primary'}`}>{isPlaying ? 'Stop' : 'Aloud'}</p>
          </button>
        </div>
      </nav>
    </div>
  );
}
