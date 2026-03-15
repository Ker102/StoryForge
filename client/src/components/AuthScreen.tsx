import { BookOpen, ArrowRight } from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';

export default function AuthScreen() {
  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Sign-in failed:', err);
    }
  };

  return (
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
        <button onClick={handleLogin} className="w-full bg-primary text-slate-900 font-bold py-4 rounded-xl text-lg flex items-center justify-center gap-2">
          Sign In with Google <ArrowRight size={20} />
        </button>
      </div>
      <div className="mt-12 flex gap-4 text-slate-500 text-sm">
        <a href="#">Privacy Policy</a>
        <span>•</span>
        <a href="#">Terms of Service</a>
      </div>
    </div>
  );
}
