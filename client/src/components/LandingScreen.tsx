import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, AudioLines, Aperture, Waves, Layers } from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';

export default function LandingScreen() {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signInError, setSignInError] = useState('');

  const handleLogin = async () => {
    setIsSigningIn(true);
    setSignInError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Sign-in failed:', err);
      setSignInError('Sign-in failed. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, y: 0, 
      transition: { type: "spring", stiffness: 100, damping: 15 }
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background-dark text-white font-inter w-screen -mx-4 sm:mx-0">
      
      {/* Liquid Glass Navigation Bar */}
      <nav className="fixed top-0 inset-x-0 z-50 flex justify-center p-4">
        <div className="w-full max-w-5xl bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full px-6 py-3 flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
          <div className="flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor" />
            </svg>
            <span className="font-serif italic font-bold text-xl tracking-tight">StoryForge</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#examples" className="hover:text-white transition-colors">Examples</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>
          <button 
            type="button" 
            onClick={handleLogin}
            disabled={isSigningIn}
            className="text-sm font-bold bg-white/10 hover:bg-white/20 border border-white/5 rounded-full px-5 py-2 transition-all disabled:opacity-50 shadow-inner"
          >
            Log In
          </button>
        </div>
      </nav>

      {/* Magic UI Retro Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f1a_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f1a_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_80%,transparent_110%)] pointer-events-none" />
      
      {/* Animated Glowing Orbs (Warm/Jewel Tones to complement Gold) */}
      <div className="absolute top-[-20%] left-[-10%] w-[40rem] h-[40rem] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-rose-500/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />

      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6 text-center w-full max-w-7xl mx-auto pt-48 pb-24">
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full flex flex-col items-center"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold tracking-widest text-primary bg-primary/10 border border-primary/20 rounded-full backdrop-blur-xl hover:bg-primary/20 transition-colors shadow-[0_0_20px_rgba(244,209,37,0.15)] uppercase">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor" />
              </svg>
              The Next Generation of Storytelling
            </span>
          </motion.div>

          {/* Typography Hero */}
          <motion.div variants={itemVariants} className="space-y-6 mb-12 max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.1]">
              Forge <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary via-yellow-200 to-amber-500 font-serif italic pr-2">Infinite</span> Adventures
            </h1>
            <p className="text-slate-400 text-lg md:text-2xl max-w-2xl mx-auto font-medium leading-relaxed">
              Step into the forge where imagination meets AI. Create, illustrate, and narrate your children's stories in seconds.
            </p>
          </motion.div>

          {/* Shiny CTA Button */}
          <motion.div variants={itemVariants} className="w-full max-w-md flex flex-col items-center space-y-4 mb-32 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary via-yellow-400 to-amber-500 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogin} 
              disabled={isSigningIn} 
              className="relative w-full bg-slate-900 border border-primary/50 text-white font-bold py-5 px-8 rounded-[2rem] text-lg flex items-center justify-center gap-3 transition-all disabled:opacity-50 overflow-hidden shadow-2xl"
            >
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
              {isSigningIn ? 'Forging Gateway...' : 'Get Started with Google'} 
              <ArrowRight size={20} className={isSigningIn ? "opacity-0" : "text-primary group-hover:translate-x-1 transition-transform"} />
            </motion.button>
            <p className="text-slate-500 text-sm font-medium">Free to try. No credit card required.</p>
            {signInError && <p className="text-red-400 text-sm mt-2">{signInError}</p>}
          </motion.div>

          {/* Bento Grid Features - with Liquid Glass styling */}
          <div id="features" className="w-full grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-2 gap-6 max-w-6xl mx-auto text-left">
            
            {/* Main Feature - Spans 2 columns */}
            <motion.div variants={itemVariants} className="lg:col-span-2 bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden group hover:border-white/20 transition-colors backdrop-blur-2xl shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] group-hover:bg-primary/15 transition-colors duration-700 pointer-events-none" />
              <div className="w-16 h-16 rounded-[1.25rem] bg-white/5 flex items-center justify-center mb-8 border border-white/10 text-primary shadow-inner">
                <AudioLines size={32} strokeWidth={1.5} />
              </div>
              <h3 className="text-3xl font-bold mb-4 font-serif italic text-white">Voice-to-Story Engine</h3>
              <p className="text-slate-400 text-lg leading-relaxed max-w-md">
                Simply speak a sentence into your microphone. Our agentic pipeline drafts, refines, and perfectly paces an entire storybook tailored to your child's age.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div variants={itemVariants} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden group hover:border-white/20 transition-colors backdrop-blur-2xl shadow-2xl">
               <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/5 rounded-full blur-[60px] group-hover:bg-teal-500/15 transition-colors duration-700 pointer-events-none" />
               <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/10 text-teal-400 shadow-inner">
                <Aperture size={28} strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-bold mb-3 font-serif italic text-white">Immersive Art</h3>
              <p className="text-slate-400 leading-relaxed text-lg">
                Stunning illustrations generated dynamically in watercolor, pixel art, or pastel styles.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div variants={itemVariants} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden group hover:border-white/20 transition-colors backdrop-blur-2xl shadow-2xl">
               <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/5 rounded-full blur-[60px] group-hover:bg-rose-500/15 transition-colors duration-700 pointer-events-none" />
               <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/10 text-rose-400 shadow-inner">
                <Waves size={28} strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-bold mb-3 font-serif italic text-white">Warm Voices</h3>
              <p className="text-slate-400 leading-relaxed text-lg">
                Every page is brought to life with high-fidelity, expressive AI voices for bedtime listening.
              </p>
            </motion.div>

             {/* Feature 4 - Spans 2 columns */}
            <motion.div variants={itemVariants} className="lg:col-span-2 bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden group hover:border-white/20 transition-colors backdrop-blur-2xl shadow-2xl">
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px] group-hover:bg-amber-500/15 transition-colors duration-700 pointer-events-none" />
               <div className="w-16 h-16 rounded-[1.25rem] bg-white/5 flex items-center justify-center mb-8 border border-white/10 text-amber-500 shadow-inner">
                <Layers size={32} strokeWidth={1.5} />
              </div>
              <h3 className="text-3xl font-bold mb-4 font-serif italic text-white">Infinite Library</h3>
              <p className="text-slate-400 text-lg leading-relaxed max-w-md">
                All your forged tales are saved forever. Rewatch, re-listen, and share your magical adventures with family and friends at any time.
              </p>
            </motion.div>

          </div>
        </motion.div>
      </main>
    </div>
  );
}
