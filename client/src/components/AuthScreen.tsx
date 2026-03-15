import { useState } from 'react';
import { BookOpen, ArrowRight } from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';

export default function AuthScreen() {
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
      {signInError && (
        <p className="text-red-400 text-sm mb-4">{signInError}</p>
      )}
      <div className="w-full max-w-sm space-y-4">
        <button type="button" onClick={handleLogin} disabled={isSigningIn} className="w-full bg-primary text-slate-900 font-bold py-4 rounded-xl text-lg flex items-center justify-center gap-2 disabled:opacity-50">
          {isSigningIn ? 'Signing in...' : 'Sign In with Google'} <ArrowRight size={20} />
        </button>
      </div>
      <div className="mt-12 flex gap-4 text-slate-500 text-sm">
        <span>Privacy Policy</span>
        <span>•</span>
        <span>Terms of Service</span>
      </div>
    </div>
  );
}
