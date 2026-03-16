import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, RefreshCw, Check, BookOpen, ChevronRight, ChevronLeft, Sparkles, ImagePlus, Volume2 } from 'lucide-react';
import type { StorySession } from '../lib/websocket';
import type { GeneratedPage } from '../App';

interface SpeakScreenProps {
  session: StorySession | null;
  pages: GeneratedPage[];
  agentText: string;
  audioLevel: number;
  onClose: () => void;
  onSubmit: () => void;
  storyId?: string;
}

export default function SpeakScreen({ session, pages, agentText, audioLevel, onClose, onSubmit, storyId }: SpeakScreenProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [generatingNarration, setGeneratingNarration] = useState(false);
  const pagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Start recording as soon as this screen mounts
    if (session) {
      session.startRecording()
        .then(() => setIsRecording(true))
        .catch(console.error);
    }
    return () => {
      // Ensure we stop if unmounted
      if (session) {
        session.stopRecording();
      }
    };
  }, [session]);

  // Auto-scroll to latest page in sidebar
  useEffect(() => {
    if (sidebarOpen && pagesEndRef.current) {
      pagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [pages, sidebarOpen]);

  // Auto-open sidebar when first page arrives
  useEffect(() => {
    if (pages.length === 1 && !sidebarOpen) {
      setSidebarOpen(true);
    }
  }, [pages.length]);

  const handleClear = () => {
    if (session) {
      session.stopRecording();
      setIsRecording(false);
      session.startRecording()
        .then(() => setIsRecording(true))
        .catch(console.error);
    }
  };

  const handleSubmit = () => {
    if (session) {
      session.stopRecording();
      setIsRecording(false);
      session.sendText(''); // Send empty text to trigger audio processing turn
    }
    onSubmit();
  };

  const handleClose = () => {
    if (session) {
      session.stopRecording();
      setIsRecording(false);
    }
    onClose();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex relative overflow-hidden">

      {/* ─── Main Speaking Area ─── */}
      <div className="flex-1 flex flex-col relative z-10 transition-all duration-300">
        
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-yellow-500/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-1/4 right-0 w-[300px] h-[300px] bg-amber-600/8 blur-[100px] rounded-full pointer-events-none" />

        {/* Header */}
        <header className="flex justify-between items-center p-5 z-10 sticky top-0 backdrop-blur-sm bg-[#0a0a0f]/60 border-b border-white/5">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ scale: isRecording ? [1, 1.3, 1] : 1 }}
              transition={{ duration: 1.5, repeat: isRecording ? Infinity : 0 }}
              className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
            />
            <span className="text-yellow-300/90 font-bold uppercase tracking-[0.2em] text-xs">
              {isRecording ? 'Listening...' : 'Connecting mic...'}
            </span>
          </div>
          <div className="flex gap-2">
            {/* Story sidebar toggle */}
            <motion.button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors"
            >
              <BookOpen size={16} className="text-yellow-300" />
              <span className="text-yellow-200 text-xs font-semibold tracking-wide">Story</span>
              {pages.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-yellow-500 text-[10px] font-bold text-black flex items-center justify-center shadow-[0_0_8px_rgba(234,179,8,0.5)]">
                  {pages.length}
                </span>
              )}
            </motion.button>
            <button
              type="button"
              onClick={handleClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <X size={18} className="text-white/60" />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center p-6 z-10 gap-8">
          
          {/* Animated Mic Visualization */}
          <div className="relative w-36 h-36 flex items-center justify-center">
            {isRecording && (
              <>
                {/* Audio-reactive glow rings */}
                <motion.div
                  className="absolute inset-0 border-2 border-yellow-400/30 rounded-full"
                  animate={{ 
                    scale: 1 + audioLevel * 0.8,
                    opacity: 0.2 + audioLevel * 0.5,
                    borderColor: audioLevel > 0.3 ? 'rgba(250, 204, 21, 0.5)' : 'rgba(250, 204, 21, 0.2)',
                  }}
                  transition={{ duration: 0.1, ease: "easeOut" }}
                />
                <motion.div
                  className="absolute inset-3 border border-yellow-400/20 rounded-full"
                  animate={{ 
                    scale: 1 + audioLevel * 0.5,
                    opacity: 0.15 + audioLevel * 0.4,
                  }}
                  transition={{ duration: 0.12, ease: "easeOut" }}
                />
                <motion.div
                  className="absolute inset-6 border border-yellow-400/15 rounded-full"
                  animate={{ 
                    scale: 1 + audioLevel * 0.3,
                    opacity: 0.1 + audioLevel * 0.3,
                  }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                />
              </>
            )}
            <motion.div
              className="absolute inset-8 bg-yellow-500/15 rounded-full blur-md"
              animate={{ opacity: 0.15 + audioLevel * 0.6 }}
              transition={{ duration: 0.1 }}
            />
            <div className="relative z-10 text-5xl">🎙️</div>
          </div>

          {/* Audio-reactive Waveform */}
          <div className="flex items-center gap-1.5 h-14">
            {Array.from({ length: 12 }).map((_, i) => {
              // Each bar gets a slightly different response for natural look
              const barVariation = 0.6 + (Math.sin(i * 1.3) * 0.2 + 0.2);
              const barHeight = isRecording
                ? Math.max(15, Math.min(100, audioLevel * 100 * barVariation + 10))
                : 15;
              return (
                <motion.div
                  key={i}
                  className="w-1.5 bg-gradient-to-t from-yellow-600/60 to-yellow-300/80 rounded-full"
                  animate={{ height: `${barHeight}%` }}
                  transition={{ duration: 0.08, ease: "easeOut" }}
                  style={{ minHeight: 8, maxHeight: 56 }}
                />
              );
            })}
          </div>

          {/* Agent text / conversation bubble */}
          <AnimatePresence mode="popLayout">
            {agentText && (
              <motion.div
                key={agentText.slice(0, 30)}
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white/5 border border-yellow-500/15 rounded-2xl p-5 w-full max-w-md backdrop-blur-md"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={14} className="text-yellow-400" />
                  <span className="text-[11px] font-bold text-yellow-400/80 uppercase tracking-[0.15em]">Quill says</span>
                </div>
                <p className="text-sm text-yellow-100/80 leading-relaxed font-medium">
                  {agentText}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status hint */}
          <div className="bg-white/5 border border-white/8 rounded-2xl p-5 w-full max-w-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">Audio Input Active</span>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">
              Speak clearly into your microphone to guide the story. Quill will help shape your ideas into pages.
            </p>
          </div>
        </main>

        {/* Action Buttons */}
        <footer className="p-5 pb-8 flex gap-3 z-10">
          <motion.button
            onClick={handleClear}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            className="flex-1 py-3.5 rounded-xl bg-white/5 border border-white/10 font-bold text-sm text-white/70 flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
          >
            <RefreshCw size={16} /> Clear
          </motion.button>
          <motion.button
            onClick={handleSubmit}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            className="flex-[2] py-3.5 rounded-xl bg-gradient-to-r from-yellow-600 to-amber-500 text-black font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            <Check size={16} /> Submit Voice
          </motion.button>
        </footer>
      </div>

      {/* ─── Story Sidebar (slides in from right) ─── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 380, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative h-screen border-l border-yellow-500/15 bg-[#0d0d14]/95 backdrop-blur-xl flex flex-col overflow-hidden"
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-yellow-400" />
                <h2 className="text-sm font-bold text-yellow-200 tracking-wide">Your Story</h2>
                <span className="text-[10px] font-mono text-yellow-500/60 bg-yellow-500/10 px-2 py-0.5 rounded-full">
                  {pages.length} {pages.length === 1 ? 'page' : 'pages'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <ChevronRight size={14} className="text-white/50" />
              </button>
            </div>

            {/* Sidebar Content — scrollable story pages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-yellow-500/20 scrollbar-track-transparent">
              {pages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-12">
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <BookOpen size={40} className="text-yellow-500/30" />
                  </motion.div>
                  <p className="text-white/30 text-sm leading-relaxed max-w-[240px]">
                    Your story pages will appear here as Quill generates them. Start by describing your story idea!
                  </p>
                </div>
              ) : (
                pages.map((page, idx) => (
                  <motion.div
                    key={page.page_number}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1, type: "spring", stiffness: 200 }}
                    className="group"
                  >
                    <div className="bg-white/[0.03] border border-yellow-500/10 rounded-xl overflow-hidden hover:border-yellow-500/25 transition-colors">
                      {/* Page illustration */}
                      {page.image_base64 && (
                        <div className="relative aspect-[16/10] overflow-hidden">
                          <img
                            src={`data:image/png;base64,${page.image_base64}`}
                            alt={`Page ${page.page_number} illustration`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d14] via-transparent to-transparent" />
                          <div className="absolute bottom-2 left-3">
                            <span className="text-[10px] font-bold text-yellow-400/90 bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-sm border border-yellow-500/20">
                              Page {page.page_number}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Page text */}
                      <div className="p-4">
                        {!page.image_base64 && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-bold text-yellow-500/70 bg-yellow-500/10 px-2 py-0.5 rounded-full">
                              Page {page.page_number}
                            </span>
                          </div>
                        )}
                        <p className="text-xs text-white/60 leading-relaxed line-clamp-4">
                          {page.text}
                        </p>
                        {page.summary && (
                          <p className="text-[10px] text-yellow-400/40 mt-2 italic">
                            {page.summary}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
              <div ref={pagesEndRef} />
            </div>

            {/* Generate Images / TTS Buttons */}
            {pages.length > 0 && storyId && (
              <div className="border-t border-white/5 p-4 space-y-2">
                <button
                  type="button"
                  disabled={generatingImages}
                  onClick={async () => {
                    setGeneratingImages(true);
                    try {
                      const { getAuth } = await import('firebase/auth');
                      const token = await getAuth().currentUser?.getIdToken();
                      const res = await fetch(`http://localhost:8001/api/stories/${storyId}/generate-images`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                      });
                      const data = await res.json();
                      console.log('[GenerateImages] result:', data);
                    } catch (err) {
                      console.error('[GenerateImages] error:', err);
                    } finally {
                      setGeneratingImages(false);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-purple-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ImagePlus size={14} />
                  {generatingImages ? 'Generating Images...' : 'Generate Illustrations'}
                </button>
                <button
                  type="button"
                  disabled={generatingNarration}
                  onClick={async () => {
                    setGeneratingNarration(true);
                    try {
                      const { getAuth } = await import('firebase/auth');
                      const token = await getAuth().currentUser?.getIdToken();
                      const res = await fetch(`http://localhost:8001/api/stories/${storyId}/generate-narration`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                      });
                      const data = await res.json();
                      console.log('[GenerateNarration] result:', data);
                    } catch (err) {
                      console.error('[GenerateNarration] error:', err);
                    } finally {
                      setGeneratingNarration(false);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-teal-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Volume2 size={14} />
                  {generatingNarration ? 'Generating Narration...' : 'Generate Narration'}
                </button>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Sidebar toggle tab (when closed) */}
      {!sidebarOpen && (
        <motion.button
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setSidebarOpen(true)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-yellow-500/10 border border-yellow-500/20 border-r-0 rounded-l-xl px-2 py-6 hover:bg-yellow-500/20 transition-colors group"
        >
          <ChevronLeft size={14} className="text-yellow-400/60 group-hover:text-yellow-300 transition-colors" />
          {pages.length > 0 && (
            <span className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-yellow-500 text-[10px] font-bold text-black flex items-center justify-center shadow-[0_0_6px_rgba(234,179,8,0.4)]">
              {pages.length}
            </span>
          )}
        </motion.button>
      )}
    </div>
  );
}
