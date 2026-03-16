import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Stars, Wand2, BookOpen } from 'lucide-react';
import type { GeneratedPage } from '../App';

interface LoadingScreenProps {
  status: string;
  pages: GeneratedPage[];
  onComplete: () => void;
}

export default function LoadingScreen({ status, pages, onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(5);

  useEffect(() => {
    if (pages.length > 0) {
      setProgress(Math.min(95, 20 + pages.length * 15));
    }
  }, [pages]);

  useEffect(() => {
    if (pages.length > 0 && (status.toLowerCase().includes('complete') || status.toLowerCase().includes('finished'))) {
      setProgress(100);
      const t = setTimeout(onComplete, 1200);
      return () => clearTimeout(t);
    }
  }, [status, pages, onComplete]);

  const hasError = status.toLowerCase().includes('error') || status.toLowerCase().includes('failed');

  return (
    <div className="min-h-screen bg-[#060608] relative overflow-hidden flex flex-col items-center justify-center font-sans tracking-wide">
      
      {/* Magical Atmospheric Glows and ambient particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none mix-blend-screen">
        <div className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] bg-yellow-400/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[150px]" />
        
        {/* Subtle animated stardust */}
        {[...Array(25)].map((_, i) => (
          <motion.div
            key={`dust-${i}`}
            className="absolute w-1 h-1 bg-yellow-200 rounded-full shadow-[0_0_8px_1px_rgba(253,224,71,0.5)]"
            initial={{ 
              opacity: 0, 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight,
              scale: Math.random() * 0.5 + 0.5
            }}
            animate={{ 
              opacity: [0, Math.random() * 0.8 + 0.2, 0],
              y: [null, Math.random() * -60 - 30],
              x: [null, (Math.random() - 0.5) * 40]
            }}
            transition={{ 
              duration: Math.random() * 4 + 4,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 5
            }}
          />
        ))}
        
        {/* Glowing constellation lines approximation */}
        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
          <path d="M 100 200 Q 300 100 500 300 T 900 200" fill="transparent" stroke="url(#gold-grad)" strokeWidth="0.5" />
          <path d="M 0 500 Q 200 400 400 600 T 800 500" fill="transparent" stroke="url(#gold-grad)" strokeWidth="0.5" />
          <defs>
            <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor="#fef08a" stopOpacity="0.5" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-4xl px-8 flex flex-col items-center">
        
        {/* Title: StoryForge */}
        <motion.div
          initial={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="mb-8"
        >
          <h1 
            className="text-6xl sm:text-7xl lg:text-[5.5rem] font-black text-transparent bg-clip-text text-center tracking-tight"
            style={{ 
              backgroundImage: 'linear-gradient(180deg, #fefce8 0%, #fef08a 40%, #eab308 100%)',
              filter: 'drop-shadow(0px 0px 25px rgba(234, 179, 8, 0.4))',
              WebkitTextStroke: '1px rgba(253, 224, 71, 0.2)'
            }}
          >
            STORYFORGE
          </h1>
        </motion.div>

        {/* Central Magical Element / Placeholder for their illustration */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.3 }}
          className="relative w-full aspect-[2.5/1] max-w-3xl mb-12 flex items-center justify-center isolate"
        >
          {/* Subtle glowing ground line mimicking the illustration */}
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "90%" }}
            transition={{ duration: 1.5, delay: 0.8 }}
            className="absolute bottom-4 h-[2px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent shadow-[0_0_15px_rgba(250,204,21,0.6)]" 
          />
          
          <div className="relative z-10 flex items-center justify-center w-full h-full text-yellow-300 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)] opacity-80">
             {/* Simple symbolic representation matching the mockup vibe */}
             <div className="flex gap-12 items-end pb-8">
               <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
                 <BookOpen size={64} strokeWidth={1.5} className="opacity-90" />
               </motion.div>
               <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}>
                 <Stars size={80} strokeWidth={1} className="text-yellow-200" />
               </motion.div>
               <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}>
                 <Wand2 size={56} strokeWidth={1.5} className="opacity-90 -scale-x-100" />
               </motion.div>
             </div>
          </div>
        </motion.div>

        {/* Status Text (e.g. "GENERATING THE ADVENTURE...") */}
        <motion.h2 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="text-yellow-400 font-bold tracking-[0.25em] text-sm sm:text-base lg:text-lg mb-6 drop-shadow-[0_0_10px_rgba(234,179,8,0.4)] uppercase text-center"
        >
          {hasError ? 'A DARK MAGIC INTERFERENCE OCCURRED' : 'GENERATING THE ADVENTURE...'}
        </motion.h2>

        {/* Sleek Golden Progress Bar */}
        <motion.div 
          initial={{ opacity: 0, width: "0%" }}
          animate={{ opacity: 1, width: "100%" }}
          transition={{ duration: 1, delay: 1.2 }}
          className="w-full max-w-xl mb-6 relative"
        >
          {/* Decorative ends of the progress bar */}
          <div className="absolute -left-6 top-1/2 -translate-y-1/2 text-yellow-400/80">
            <Sparkles size={16} />
          </div>
          <div className="absolute -right-6 top-1/2 -translate-y-1/2 text-yellow-400/80">
            <Sparkles size={16} />
          </div>

          <div className="h-[6px] w-full bg-yellow-900/40 rounded-full border border-yellow-500/30 overflow-hidden relative shadow-[0_0_15px_rgba(234,179,8,0.15)] backdrop-blur-sm">
            <motion.div 
              className="h-full bg-gradient-to-r from-[#ca8a04] via-[#fef08a] to-[#ca8a04] relative rounded-full"
              style={{ width: `${hasError ? 100 : progress}%` }}
              animate={!hasError ? { 
                backgroundPosition: ['200% center', '-200% center'] 
              } : {}}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            >
              {/* Overbright glowing head at the end of progress */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full blur-[3px] shadow-[0_0_10px_2px_rgba(255,255,255,0.8)]" />
            </motion.div>
          </div>
          
          <div className="absolute top-1/2 right-[10%] -translate-y-[150%]">
             <span className="text-yellow-400/90 text-xs font-bold font-mono tracking-wider drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]">
               {hasError ? 'ERROR' : `${Math.floor(progress)}%`}
             </span>
          </div>
        </motion.div>

        {/* Dynamic Status Subtitle */}
        <AnimatePresence mode="popLayout">
          {hasError ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-amber-500/90 font-medium text-center bg-red-900/20 px-6 py-4 rounded-2xl border border-red-500/30 backdrop-blur-md"
            >
              <p className="tracking-wide">{status}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 px-6 py-2 bg-gradient-to-r from-amber-600 to-amber-500 text-yellow-50 rounded-full font-bold transition-all hover:scale-105 shadow-[0_0_15px_rgba(217,119,6,0.5)]"
              >
                Attempt Spell Again
              </button>
            </motion.div>
          ) : (
            <motion.div
              key={status}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center text-yellow-200/60 font-medium leading-relaxed max-w-lg mt-2 tracking-wide text-sm"
            >
              {pages.length === 0 ? (
                <>
                  <p>Preparing the world for your story with StoryForge Agent...</p>
                  <p className="mt-1 opacity-80">{status || "Translating voice into magical landscapes and characters."}</p>
                </>
              ) : (
                <p>Forging page {pages.length + 1}... Weaving illustrations and magic together.</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
