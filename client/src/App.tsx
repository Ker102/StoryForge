import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged, signOut, type User } from './lib/firebase';
import { connectToStory, fetchStories, type StorySession, type PageUpdate } from './lib/websocket';

import AuthScreen from './components/AuthScreen';
import Onboarding from './components/Onboarding';
import HomeScreen from './components/HomeScreen';
import LibraryScreen from './components/LibraryScreen';
import StorySettings from './components/StorySettings';
import LoadingScreen from './components/LoadingScreen';
import StoryReader from './components/StoryReader';
import ProfileScreen from './components/ProfileScreen';
import BottomNav from './components/BottomNav';

export interface StoryData {
  id: string;
  title: string;
  style: string;
  current_page: number;
  is_complete: boolean;
  page_count: number;
  updated_at: string;
}

export interface GeneratedPage {
  page_number: number;
  text: string;
  summary: string;
  image_base64?: string;
  narration_audio_base64?: string;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState('auth');
  const [user, setUser] = useState<User | null>(null);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  // Story generation state
  const [storySession, setStorySession] = useState<StorySession | null>(null);
  const [generatedPages, setGeneratedPages] = useState<GeneratedPage[]>([]);
  const [storyTitle, setStoryTitle] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [storyStyle, setStoryStyle] = useState('');

  // Library
  const [libraryStories, setLibraryStories] = useState<StoryData[]>([]);

  // Listen to auth state
  useEffect(() => {
    const unsub = onAuthStateChanged((u) => {
      setUser(u);
      if (u && currentPage === 'auth') {
        setCurrentPage(hasSeenOnboarding ? 'home' : 'onboarding');
      }
    });
    return unsub;
  }, [hasSeenOnboarding]);

  // Load library when hitting home
  useEffect(() => {
    if (currentPage === 'home' && user) {
      fetchStories().then(setLibraryStories).catch(() => setLibraryStories([]));
    }
  }, [currentPage, user]);

  const handleGenerate = useCallback(async (config: { style: string; age_setting: string; seed: string }) => {
    setGeneratedPages([]);
    setStoryTitle('');
    setStatusMessage('Connecting to story engine...');
    setStoryStyle(config.style);
    setCurrentPage('loading');

    try {
      const session = await connectToStory(
        { style: config.style, age_setting: config.age_setting, seed: config.seed },
        {
          onSessionReady: (id) => {
            setStatusMessage('Forging the narrative...');
          },
          onPageUpdate: (page) => {
            setGeneratedPages(prev => [...prev, page]);
            setStatusMessage(`Page ${page.page_number} ready!`);
          },
          onAgentText: (text) => {
            if (!storyTitle && text.length > 10) setStoryTitle(text.slice(0, 60));
          },
          onStatus: (msg) => setStatusMessage(msg),
          onError: (msg) => setStatusMessage(`Error: ${msg}`),
          onClose: () => {
            if (generatedPages.length > 0) {
              setCurrentPage('reader');
            }
          },
        }
      );
      setStorySession(session);
    } catch (err) {
      setStatusMessage('Connection failed. Please try again.');
    }
  }, []);

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    setCurrentPage('auth');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'auth':
        return <AuthScreen />;
      case 'onboarding':
        return <Onboarding onFinish={() => { setHasSeenOnboarding(true); setCurrentPage('home'); }} />;
      case 'home':
        return <HomeScreen user={user} stories={libraryStories} onNavigate={setCurrentPage} onRead={() => setCurrentPage('reader')} />;
      case 'library':
        return <LibraryScreen stories={libraryStories} onRead={() => setCurrentPage('reader')} />;
      case 'settings':
        return <StorySettings onNavigate={setCurrentPage} onGenerate={handleGenerate} />;
      case 'loading':
        return <LoadingScreen status={statusMessage} pages={generatedPages} onComplete={() => setCurrentPage('reader')} />;
      case 'reader':
        return <StoryReader pages={generatedPages} title={storyTitle} style={storyStyle} session={storySession} onBack={() => setCurrentPage('home')} onNewStory={() => setCurrentPage('settings')} />;
      case 'profile':
        return <ProfileScreen user={user} onNavigate={setCurrentPage} onLogout={handleLogout} />;
      default:
        return <HomeScreen user={user} stories={libraryStories} onNavigate={setCurrentPage} onRead={() => setCurrentPage('reader')} />;
    }
  };

  return (
    <div className="min-h-screen bg-background-dark text-white font-lexend w-full max-w-4xl mx-auto shadow-2xl relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {renderPage()}
        </motion.div>
      </AnimatePresence>

      {['home', 'library', 'profile'].includes(currentPage) && (
        <BottomNav active={currentPage} onChange={setCurrentPage} />
      )}
    </div>
  );
}
