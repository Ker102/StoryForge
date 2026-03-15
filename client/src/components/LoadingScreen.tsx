import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Sparkles, Star, Circle, Pencil } from 'lucide-react';
import type { GeneratedPage } from '../App';

interface LoadingScreenProps {
  status: string;
  pages: GeneratedPage[];
  onComplete: () => void;
}

export default function LoadingScreen({ status, pages, onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(5);

  useEffect(() => {
    // Progress is driven by actual pages received from WebSocket
    if (pages.length > 0) {
      setProgress(Math.min(95, 20 + pages.length * 15));
    }
  }, [pages]);

  useEffect(() => {
    // Auto-navigate to reader when pages arrive and status indicates completion
    if (pages.length > 0 && (status.toLowerCase().includes('complete') || status.toLowerCase().includes('finished'))) {
      setProgress(100);
      const t = setTimeout(onComplete, 1200);
      return () => clearTimeout(t);
    }
  }, [status, pages, onComplete]);

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-gradient-to-b from-background-dark via-[#2e2700] to-background-dark overflow-hidden">
      {/* Cosmic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <Circle className="absolute top-[10%] left-[15%] text-white" size={8} fill="currentColor" />
        <Star className="absolute top-[25%] left-[80%] text-white" size={10} fill="currentColor" />
        <Star className="absolute top-[60%] left-[10%] text-white" size={12} fill="currentColor" />
        <Circle className="absolute top-[80%] left-[70%] text-white" size={8} fill="currentColor" />
        <Sparkles className="absolute top-[40%] left-[50%] text-white" size={14} />
      </div>

      <div className="flex items-center p-4 pb-2 justify-between">
        <div className="w-12" />
      </div>

      {/* Central Animation */}
      <div className="flex w-full grow items-center justify-center p-6">
        <div className="w-full max-w-sm aspect-[4/5] relative flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full animate-pulse" />
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl">
            <div className="flex flex-col items-center gap-6">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="relative"
              >
                <Sparkles size={64} className="text-primary" />
              </motion.div>
              {pages.length > 0 && (
                <p className="text-white/60 text-sm">{pages.length} page{pages.length !== 1 ? 's' : ''} forged</p>
              )}
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

      {/* Progress */}
      <div className="flex flex-col gap-6 p-8 pb-16">
        <div className="flex justify-between items-end">
          <h2 className="text-white text-xl font-bold leading-tight">{status || 'Weaving your tale...'}</h2>
          <p className="text-lg font-bold leading-none text-primary">{progress}%</p>
        </div>
        <div className="w-full">
          <div className="h-3 w-full rounded-full bg-white/5 overflow-hidden border border-white/5">
            <motion.div className="h-full bg-primary rounded-full" initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Pencil className="text-primary" size={16} />
          <p className="text-sm font-medium tracking-wide text-white/60">{status}</p>
        </div>
      </div>
      <div className="h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
    </div>
  );
}
