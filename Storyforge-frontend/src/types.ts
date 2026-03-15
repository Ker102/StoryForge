export type VisualStyle = 'watercolor' | 'pastel' | 'pixel' | 'ink';
export type NarratorVoice = 'warm' | 'playful' | 'calm' | 'dynamic';
export type Language = 'english' | 'french' | 'spanish' | 'yoruba';

export interface StoryPage {
  text: string;
  imagePrompt: string;
  imageUrl?: string;
}

export interface GeneratedStory {
  title: string;
  pages: StoryPage[];
  style: VisualStyle;
  genre: string;
  voice?: NarratorVoice;
  language?: Language;
}

export interface Story {
  id: string;
  title: string;
  coverImage: string;
  style: string;
  totalPages: number;
  currentPage: number;
  isFinished: boolean;
  genre: string;
  pages?: StoryPage[];
}

export interface Template {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  author: string;
  uses: string;
}
