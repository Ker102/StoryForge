import { useState, useEffect } from 'react';
import { X, RefreshCw, Check } from 'lucide-react';
import type { StorySession } from '../lib/websocket';

interface SpeakScreenProps {
  session: StorySession | null;
  onClose: () => void;
  onSubmit: () => void;
}

export default function SpeakScreen({ session, onClose, onSubmit }: SpeakScreenProps) {
  useEffect(() => {
    // Start recording as soon as this screen mounts
    if (session) {
      session.startRecording().catch(console.error);
    }
    return () => {
      // Ensure we stop if unmounted
      if (session) {
        session.stopRecording();
      }
    };
  }, [session]);

  const handleClear = () => {
    // Basic implementation of clearing
    if (session) {
      session.stopRecording();
      session.startRecording().catch(console.error);
    }
  };

  const handleSubmit = () => {
    if (session) {
      session.stopRecording();
      session.sendText(''); // Send empty text to trigger audio processing turn
    }
    onSubmit();
  };

  const handleClose = () => {
    if (session) {
      session.stopRecording();
    }
    onClose();
  };

  return (
    <div className="min-h-screen bg-background-dark flex flex-col relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-primary/20 blur-[100px] rounded-full mix-blend-screen pointer-events-none" />

      {/* Header */}
      <header className="flex justify-between items-center p-6 z-10 sticky top-0">
        <span className="text-primary font-bold uppercase tracking-widest text-xs flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Listening...
        </span>
        <button 
          onClick={handleClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
        >
          <X size={20} className="text-white/70" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 z-10 gap-12">
        {/* Animated Mic Icon */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          <div className="absolute inset-0 border border-primary/30 rounded-full animate-[ping_2s_ease-out_infinite]" />
          <div className="absolute inset-4 border border-primary/50 rounded-full animate-[ping_2.5s_ease-out_infinite]" />
          <div className="absolute inset-8 border border-primary/80 rounded-full animate-[ping_3s_ease-out_infinite]" />
          <div className="absolute inset-10 bg-primary/20 rounded-full blur-md" />
          <div className="relative z-10 text-5xl">🎙️</div>
        </div>

        {/* Waveform Fake */}
        <div className="flex items-center gap-1 h-12">
          {Array.from({ length: 9 }).map((_, i) => (
            <div 
              key={i} 
              className="w-1.5 bg-primary/50 rounded-full"
              style={{
                height: `${Math.random() * 80 + 20}%`,
                animation: `bounce 1.${i % 3 + 1}s infinite ease-in-out alternate`,
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>

        {/* Status Box */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 w-full max-w-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Audio Input Active</span>
          </div>
          <p className="text-lg font-medium leading-relaxed">
            Speak clearly into your microphone to guide the story...
          </p>
        </div>
      </main>

      {/* Action Buttons */}
      <footer className="p-6 mb-8 flex gap-4 z-10">
        <button 
          onClick={handleClear}
          className="flex-1 py-4 rounded-xl bg-white/5 border border-white/10 font-bold active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <RefreshCw size={18} /> Clear
        </button>
        <button 
          onClick={handleSubmit}
          className="flex-[2] py-4 rounded-xl bg-primary text-black font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Check size={18} /> Submit Voice
        </button>
      </footer>
    </div>
  );
}
