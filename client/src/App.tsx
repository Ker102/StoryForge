import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged, signOut, type User } from './lib/firebase';
import { connectToStory, fetchStories, type StorySession, type PageUpdate } from './lib/websocket';

import LandingScreen from './components/LandingScreen';
import Onboarding from './components/Onboarding';
import HomeScreen from './components/HomeScreen';
import LibraryScreen from './components/LibraryScreen';
import StorySettings from './components/StorySettings';
import LoadingScreen from './components/LoadingScreen';
import StoryReader from './components/StoryReader';
import ProfileScreen from './components/ProfileScreen';
import BottomNav from './components/BottomNav';
import SpeakScreen from './components/SpeakScreen';

export interface StoryData {
  id: string;
  title: string;
  style: string;
  current_page: number;
  is_complete: boolean;
  page_count: number;
  updated_at: string;
  thumbnail?: string;
  is_example?: boolean;
}

export interface GeneratedPage {
  page_number: number;
  text: string;
  summary: string;
  image_base64?: string;
  narration_audio_base64?: string;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [user, setUser] = useState<User | null>(null);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  // Story generation state
  const [storySession, setStorySession] = useState<StorySession | null>(null);
  const [generatedPages, setGeneratedPages] = useState<GeneratedPage[]>([]);
  const [storyTitle, setStoryTitle] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [storyStyle, setStoryStyle] = useState('');
  const [agentText, setAgentText] = useState('');

  // Audio Playback
  const playQueueRef = useRef<{buffer: ArrayBuffer}[]>([]);
  const isPlayingRef = useRef(false);
  const playContextRef = useRef<AudioContext | null>(null);

  const processAudioQueue = async () => {
    if (isPlayingRef.current || playQueueRef.current.length === 0) return;
    isPlayingRef.current = true;

    if (!playContextRef.current) {
      playContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });
    }

    try {
      const { buffer } = playQueueRef.current.shift()!;
      const pcm16 = new Int16Array(buffer);
      const audioBuffer = playContextRef.current.createBuffer(1, pcm16.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < pcm16.length; i++) {
        channelData[i] = pcm16[i] / 32768.0;
      }

      const source = playContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(playContextRef.current.destination);
      
      source.onended = () => {
        isPlayingRef.current = false;
        processAudioQueue();
      };
      source.start();
    } catch (err) {
      console.error("Playback error", err);
      isPlayingRef.current = false;
      processAudioQueue();
    }
  };

  // Library
  const [libraryStories, setLibraryStories] = useState<StoryData[]>([]);

  // Listen to auth state
  useEffect(() => {
    const unsub = onAuthStateChanged((u) => {
      setUser(u);
      if (u && (currentPage === 'auth' || currentPage === 'landing')) {
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
          onSessionReady: (id, sess) => {
            setStatusMessage('Quill is ready! Opening the story studio...');
            setStorySession(sess);
            // Transition to speak screen after a brief moment so user sees "ready" status
            setTimeout(() => setCurrentPage('speak'), 1500);
          },
          onPageUpdate: (page) => {
            setGeneratedPages(prev => [...prev, page]);
            setStatusMessage(`Page ${page.page_number} ready!`);
          },
          onAgentText: (text) => {
            setAgentText(text);
            if (!storyTitle && text.length > 10) setStoryTitle(text.slice(0, 60));
          },
          onAudioData: (buffer) => {
            playQueueRef.current.push({ buffer: buffer as ArrayBuffer });
            processAudioQueue();
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

  const handleTextSteer = useCallback((text: string) => {
    if (storySession) {
      storySession.sendText(text);
      setCurrentPage('loading');
    }
  }, [storySession]);

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    setGeneratedPages([]);
    setStorySession(null);
    setStoryTitle('');
    setStatusMessage('');
    setStoryStyle('');
    setLibraryStories([]);
    setCurrentPage('landing');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
      case 'auth':
        return <LandingScreen />;
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
        return <StoryReader pages={generatedPages} title={storyTitle} style={storyStyle} session={storySession} onBack={() => setCurrentPage('home')} onNewStory={() => setCurrentPage('settings')} onTextSteer={handleTextSteer} onSpeakSteer={() => setCurrentPage('speak')} />;
      case 'speak':
        return <SpeakScreen session={storySession} pages={generatedPages} agentText={agentText} onClose={() => setCurrentPage(generatedPages.length > 0 ? 'reader' : 'home')} onSubmit={() => setCurrentPage('loading')} />;
      case 'profile':
        return <ProfileScreen user={user} onNavigate={setCurrentPage} onLogout={handleLogout} />;
      default:
        return <HomeScreen user={user} stories={libraryStories} onNavigate={setCurrentPage} onRead={() => setCurrentPage('reader')} />;
    }
  };

  return (
    <div className="min-h-screen bg-background-dark text-white font-inter w-full relative overflow-x-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 1.02, filter: "blur(4px)" }}
          transition={{ type: "spring", stiffness: 250, damping: 25 }}
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
