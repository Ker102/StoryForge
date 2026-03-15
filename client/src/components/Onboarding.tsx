import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight } from 'lucide-react';

const STEPS = [
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

interface OnboardingProps {
  onFinish: () => void;
}

export default function Onboarding({ onFinish }: OnboardingProps) {
  const [step, setStep] = useState(0);

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
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
              <img src={STEPS[step].image} alt="Onboarding" className="w-full h-full object-cover" />
            </div>
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-extrabold leading-tight">
                {STEPS[step].title.split(STEPS[step].accent)[0]}
                <span className="text-primary">{STEPS[step].accent}</span>
              </h1>
              <p className="text-slate-400 text-lg">{STEPS[step].description}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
      <footer className="p-8 flex flex-col items-center gap-8">
        <div className="flex gap-3">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-8 bg-primary shadow-[0_0_10px_rgba(244,209,37,0.5)]' : 'w-2 bg-slate-800'}`} />
          ))}
        </div>
        <button onClick={next} className="w-full max-w-md bg-primary text-slate-900 font-bold py-5 rounded-xl text-lg flex items-center justify-center gap-2">
          {step === STEPS.length - 1 ? 'Get Started' : 'Next'}
          <ArrowRight size={20} />
        </button>
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Step {step + 1} of 3</p>
      </footer>
    </div>
  );
}
