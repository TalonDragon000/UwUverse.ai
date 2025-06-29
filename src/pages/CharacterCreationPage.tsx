import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Heart, Sparkles, Play, Square, Volume2, AlertCircle, Filter } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { useCharacterStore } from '../stores/characterStore';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import CharacterSuccessModal from '../components/character/CharacterSuccessModal';

const PERSONALITY_TRAITS = [
  'shy', 'flirty', 'confident', 'chaotic',
  'protective', 'loyal', 'bookish', 'mysterious',
  'playful', 'creative', 'passionate', 'caring'
];

const MEET_CUTE_SCENARIOS = [
  'school', 'online', 'time travel', 'rivals-to-lovers',
  'coffee shop', 'neighbors', 'childhood friends', 'blind date'
];

// Art styles with sample thumbnails
const ART_STYLES_DATA = [
  {
    id: 'anime',
    label: 'Anime',
    thumbnail_url: 'https://images.pexels.com/photos/6157228/pexels-photo-6157228.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
    description: 'Japanese animation style with large expressive eyes and vibrant colors'
  },
  {
    id: 'manhwa',
    label: 'Manhwa',
    thumbnail_url: 'https://images.pexels.com/photos/3992656/pexels-photo-3992656.png?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
    description: 'Korean webtoon style with detailed features and soft shading'
  },
  {
    id: 'comic',
    label: 'Comic',
    thumbnail_url: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
    description: 'Western comic book style with bold lines and dynamic poses'
  },
  {
    id: 'realistic',
    label: 'Realistic',
    thumbnail_url: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
    description: 'Photorealistic digital art with natural proportions and lighting'
  },
  {
    id: 'cartoon',
    label: 'Cartoon',
    thumbnail_url: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
    description: 'Stylized cartoon with exaggerated features and bright colors'
  }
];

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  gender: string;
  accent: string;
  age: string;
  tone: string;
  description: string;
  preview_url?: string;
  api_version?: string;
}

interface VoiceFilters {
  accent: string;
  tone: string;
  age: string;
}

const CharacterCreationPage: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAuthStore();
  const { characterCreationData, updateCharacterCreationData } = useCharacterStore();
  const [step, setStep] = useState(0);
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdCharacter, setCreatedCharacter] = useState<any>(null);
  
  // Voice-related state
  const [voices, setVoices] = useState<ElevenLabsVoice[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [generatingPreview, setGeneratingPreview] = useState<string | null>(null);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [voicesError, setVoicesError] = useState<string | null>(null);
  const [usingFallbackVoices, setUsingFallbackVoices] = useState(false);
  
  // Voice filtering state
  const [voiceFilters, setVoiceFilters] = useState<VoiceFilters>({
    accent: 'all',
    tone: 'all',
    age: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  
  const steps = [
    'Basic Details',
    'Appearance',
    'Personality',
    'Voice',
    'Backstory',
    'Generate'
  ];

  // Fetch ElevenLabs voices when component mounts
  useEffect(() => {
    const fetchVoices = async () => {
      setLoadingVoices(true);
      setVoicesError(null);
      
      try {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-elevenlabs-voices`;
        const headers = {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        };

        const response = await fetch(apiUrl, { headers });
        const data = await response.json();

        if (data.success) {
          setVoices(data.voices);
          setUsingFallbackVoices(data.fallback || false);
          
          if (data.fallback && data.message) {
            setVoicesError(data.message);
          }
        } else {
          throw new Error(data.error || 'Failed to fetch voices');
        }
      } catch (error) {
        console.error('Error fetching voices:', error);
        setVoicesError('Unable to load voices. Please try again later.');
        
        // Set basic fallback voices if everything fails
        setVoices([
          {
            voice_id: 'basic-male',
            name: 'Default Male Voice',
            gender: 'male',
            accent: 'Neutral',
            age: 'adult',
            tone: 'confident',
            description: 'Standard voice option',
          },
          {
            voice_id: 'basic-female',
            name: 'Default Female Voice',
            gender: 'female',
            accent: 'Neutral',
            age: 'adult',
            tone: 'warm',
            description: 'Standard voice option',
          },
        ]);
        setUsingFallbackVoices(true);
      } finally {
        setLoadingVoices(false);
      }
    };

    fetchVoices();
  }, []);

  // Clean up audio when component unmounts
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
      }
    };
  }, [currentAudio]);

  const handlePlayPreview = async (voiceId: string, voiceName: string) => {
    // For fallback voices, just select them without playing audio
    if (usingFallbackVoices || voiceId.startsWith('fallback-') || voiceId.startsWith('basic-')) {
      updateCharacterCreationData({ voice_accent: voiceName });
      setSelectedVoiceId(voiceId);
      return;
    }

    // Stop any currently playing audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = '';
      setCurrentAudio(null);
      setCurrentlyPlaying(null);
    }

    setGeneratingPreview(voiceId);

    try {
      const sampleText = characterCreationData.gender === 'male' 
        ? "Hey there! I'm really excited to meet you. What would you like to talk about?"
        : characterCreationData.gender === 'female'
        ? "Hi! I'm so happy we finally get to chat. How has your day been?"
        : "Hello! It's wonderful to connect with you. What's on your mind today?";

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-service/generate-voice-preview`;
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          voice_id: voiceId,
          text: sampleText,
        }),
      });

      const data = await response.json();

      if (data.success) {
        try {
          const audioBlob = new Blob([
            new Uint8Array(atob(data.audio_data).split('').map(c => c.charCodeAt(0)))
          ], { type: data.content_type });
          
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          
          audio.onended = () => {
            setCurrentlyPlaying(null);
            setCurrentAudio(null);
            URL.revokeObjectURL(audioUrl);
          };

          audio.onerror = (e) => {
            console.error('Audio playback error:', e);
            setCurrentlyPlaying(null);
            setCurrentAudio(null);
            URL.revokeObjectURL(audioUrl);
            // Just select the voice without showing an error
            updateCharacterCreationData({ voice_accent: voiceName });
            setSelectedVoiceId(voiceId);
          };

          await audio.play();
          setCurrentAudio(audio);
          setCurrentlyPlaying(voiceId);
          
          // Update character creation data with selected voice
          updateCharacterCreationData({ voice_accent: voiceName });
          setSelectedVoiceId(voiceId);
        } catch (audioError) {
          console.error('Error creating or playing audio:', audioError);
          // Just select the voice without preview
          updateCharacterCreationData({ voice_accent: voiceName });
          setSelectedVoiceId(voiceId);
        }
      } else {
        console.log('Voice preview not available:', data.error);
        // Just select the voice without preview
        updateCharacterCreationData({ voice_accent: voiceName });
        setSelectedVoiceId(voiceId);
      }
    } catch (error) {
      console.error('Error generating voice preview:', error);
      // Just select the voice without preview
      updateCharacterCreationData({ voice_accent: voiceName });
      setSelectedVoiceId(voiceId);
    } finally {
      setGeneratingPreview(null);
    }
  };

  const handleStopPreview = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = '';
      setCurrentAudio(null);
      setCurrentlyPlaying(null);
    }
  };

  const getFilteredVoices = () => {
    if (!characterCreationData.gender) return voices;
    
    return voices.filter(voice => {
      const voiceGender = voice.gender.toLowerCase();
      const characterGender = characterCreationData.gender?.toLowerCase();
      
      // Filter by gender first
      let genderMatch = true;
      if (characterGender === 'male') {
        genderMatch = voiceGender === 'male';
      } else if (characterGender === 'female') {
        genderMatch = voiceGender === 'female';
      }
      
      // Apply additional filters
      const accentMatch = voiceFilters.accent === 'all' || voice.accent.toLowerCase().includes(voiceFilters.accent.toLowerCase());
      const ageMatch = voiceFilters.age === 'all' || voice.age.toLowerCase().includes(voiceFilters.age.toLowerCase());
      const toneMatch = voiceFilters.tone === 'all' || voice.tone.toLowerCase() === voiceFilters.tone.toLowerCase();
      
      return genderMatch && accentMatch && ageMatch && toneMatch;
    });
  };

  const getUniqueAccents = () => {
    const accents = voices.map(voice => voice.accent).filter(Boolean);
    return [...new Set(accents)].sort();
  };

  const getUniqueAges = () => {
    const ages = voices.map(voice => voice.age).filter(Boolean);
    return [...new Set(ages)].sort();
  };

  const getUniqueTones = () => {
    const tones = voices.map(voice => voice.tone).filter(Boolean);
    return [...new Set(tones)].sort();
  };

  const clearFilters = () => {
    setVoiceFilters({
      accent: 'all',
      tone: 'all',
      age: 'all'
    });
  };
  
  const handleNextStep = () => {
    if (step === 0) {
      if (!characterCreationData.name || !characterCreationData.gender) {
        alert('Please fill out all fields');
        return;
      }
    }
    
    if (step < steps.length - 1) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    }
  };
  
  const handlePrevStep = () => {
    if (step > 0) {
      setStep(step - 1);
      window.scrollTo(0, 0);
    }
  };
  
  const toggleTrait = (trait: string) => {
    if (selectedTraits.includes(trait)) {
      setSelectedTraits(selectedTraits.filter(t => t !== trait));
    } else if (selectedTraits.length < 5) {
      setSelectedTraits([...selectedTraits, trait]);
    }
  };
  
  const handleFinish = async () => {
    if (!session?.user?.id) {
      navigate('/auth');
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      // Save the personality traits to the character creation data
      updateCharacterCreationData({
        personality_traits: selectedTraits
      });
      
      // Call the AI service to generate character image and get Tavus data
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-image-generation`;
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: characterCreationData.name,
          gender: characterCreationData.gender,
          height: characterCreationData.height,
          build: characterCreationData.build,
          eye_color: characterCreationData.eye_color,
          hair_color: characterCreationData.hair_color,
          skin_tone: characterCreationData.skin_tone,
          personality_traits: selectedTraits,
          art_style: characterCreationData.art_style,
        }),
      });

      const aiData = await response.json();
      
      if (!aiData.success) {
        throw new Error(aiData.error || 'Failed to generate character');
      }

      // Show a message if using fallback features
      if (aiData.fallback && aiData.message) {
        console.log('Using fallback features:', aiData.message);
      }

      // Get the selected voice data
      const selectedVoice = voices.find(v => v.voice_id === selectedVoiceId);
      
      // Create the character in the database
      const { data: character, error: insertError } = await supabase
        .from('characters')
        .insert({
          user_id: session.user.id,
          name: characterCreationData.name || '',
          gender: characterCreationData.gender || 'nonbinary',
          height: characterCreationData.height || 'average',
          build: characterCreationData.build || 'average',
          eye_color: characterCreationData.eye_color || 'brown',
          hair_color: characterCreationData.hair_color || 'brown',
          skin_tone: characterCreationData.skin_tone || 'medium',
          personality_traits: selectedTraits,
          voice_accent: characterCreationData.voice_accent || 'calm',
          art_style: characterCreationData.art_style || 'anime',
          backstory: characterCreationData.backstory || '',
          meet_cute: characterCreationData.meet_cute || 'coffee shop',
          image_url: aiData.image_url,
          tavus_character_id: aiData.tavus_character_id,
          tavus_video_url: aiData.tavus_video_url,
          voice_id: selectedVoiceId,
          voice_name: selectedVoice?.name,
        })
        .select()
        .single();
      
      if (insertError) {
        throw new Error(`Failed to create character: ${insertError.message}`);
      }
      
      if (!character) {
        throw new Error('No character data returned after creation');
      }

      // Create an initial chat for the character
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .insert({
          user_id: session.user.id,
          character_id: character.id,
          love_meter: 0
        })
        .select()
        .single();

      if (chatError) {
        throw new Error(`Failed to create chat: ${chatError.message}`);
      }

      if (!chat?.id || typeof chat.id !== 'string') {
        throw new Error('Invalid chat ID received after creation');
      }
      
      // Show success modal
      setCreatedCharacter({
        ...character,
        chat_id: chat.id
      });
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error('Error creating character:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Rendering different steps
  const renderStepContent = () => {
    switch (step) {
      case 0: // Basic Details
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Character Name
              </label>
              <input
                type="text"
                value={characterCreationData.name || ''}
                onChange={(e) => updateCharacterCreationData({ name: e.target.value })}
                className="uwu-input w-full"
                placeholder="Enter a name"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Gender
              </label>
              <div className="grid grid-cols-3 gap-4">
                {['male', 'female', 'nonbinary'].map((gender) => (
                  <button
                    key={gender}
                    type="button"
                    className={`py-3 px-4 rounded-lg border-2 ${
                      characterCreationData.gender === gender
                        ? 'border-pink-400 bg-pink-100 dark:border-pink-600 dark:bg-pink-900/30'
                        : 'border-gray-200 dark:border-gray-700'
                    } transition-colors duration-200`}
                    onClick={() => updateCharacterCreationData({ gender: gender as any })}
                  >
                    <span className="capitalize">{gender === 'male' ? 'Boyfriend' : gender === 'female' ? 'Girlfriend' : 'Non-Binary'}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
        
      case 1: // Appearance
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Height
                </label>
                <select
                  value={characterCreationData.height || ''}
                  onChange={(e) => updateCharacterCreationData({ height: e.target.value })}
                  className="uwu-input w-full"
                >
                  {['short', 'average', 'tall', 'very tall'].map((option) => (
                    <option key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Build
                </label>
                <select
                  value={characterCreationData.build || ''}
                  onChange={(e) => updateCharacterCreationData({ build: e.target.value })}
                  className="uwu-input w-full"
                >
                  {['slim', 'average', 'athletic', 'curvy', 'muscular'].map((option) => (
                    <option key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Eye Color
                </label>
                <select
                  value={characterCreationData.eye_color || ''}
                  onChange={(e) => updateCharacterCreationData({ eye_color: e.target.value })}
                  className="uwu-input w-full"
                >
                  {['blue', 'green', 'brown', 'gray', 'hazel', 'amber'].map((option) => (
                    <option key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hair Color
                </label>
                <select
                  value={characterCreationData.hair_color || ''}
                  onChange={(e) => updateCharacterCreationData({ hair_color: e.target.value })}
                  className="uwu-input w-full"
                >
                  {['black', 'brown', 'blonde', 'red', 'pink', 'blue', 'purple', 'white'].map((option) => (
                    <option key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Skin Tone
              </label>
              <select
                value={characterCreationData.skin_tone || ''}
                onChange={(e) => updateCharacterCreationData({ skin_tone: e.target.value })}
                className="uwu-input w-full"
              >
                {['fair', 'light', 'medium', 'tan', 'dark', 'deep'].map((option) => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Art Style
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {ART_STYLES_DATA.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-200 ${
                      characterCreationData.art_style === style.id
                        ? 'border-pink-400 bg-pink-100 dark:border-pink-600 dark:bg-pink-900/30 ring-2 ring-pink-300 dark:ring-pink-700'
                        : 'border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-600'
                    }`}
                    onClick={() => updateCharacterCreationData({ art_style: style.id as any })}
                  >
                    <div className="aspect-square">
                      <img
                        src={style.thumbnail_url}
                        alt={`${style.label} art style example`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h3 className="text-white font-semibold text-sm">{style.label}</h3>
                      </div>
                    </div>
                    {characterCreationData.art_style === style.id && (
                      <div className="absolute top-2 right-2">
                        <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                          <Heart className="w-3 h-3 text-white fill-current" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Choose the visual style for your AI companion's appearance
              </p>
            </div>
          </div>
        );
        
      case 2: // Personality
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Select up to 5 personality traits
              </label>
              <div className="flex flex-wrap gap-2">
                {PERSONALITY_TRAITS.map((trait) => (
                  <button
                    key={trait}
                    type="button"
                    className={`px-4 py-2 rounded-full text-sm font-medium ${
                      selectedTraits.includes(trait)
                        ? 'bg-pink-400 dark:bg-pink-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    } transition-colors duration-200`}
                    onClick={() => toggleTrait(trait)}
                  >
                    {trait}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {selectedTraits.length}/5 traits selected
              </p>
            </div>
          </div>
        );
        
      case 3: // Voice
        return (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Choose Voice
                </label>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    showFilters
                      ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  Filters
                </button>
              </div>
              
              {/* Voice Filters */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Accent
                        </label>
                        <select
                          value={voiceFilters.accent}
                          onChange={(e) => setVoiceFilters(prev => ({ ...prev, accent: e.target.value }))}
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                        >
                          <option value="all">All Accents</option>
                          {getUniqueAccents().map(accent => (
                            <option key={accent} value={accent}>{accent}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Tone
                        </label>
                        <select
                          value={voiceFilters.tone}
                          onChange={(e) => setVoiceFilters(prev => ({ ...prev, tone: e.target.value }))}
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                        >
                          <option value="all">All Tones</option>
                          {getUniqueTones().map(tone => (
                            <option key={tone} value={tone}>
                              {tone.charAt(0).toUpperCase() + tone.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Age
                        </label>
                        <select
                          value={voiceFilters.age}
                          onChange={(e) => setVoiceFilters(prev => ({ ...prev, age: e.target.value }))}
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                        >
                          <option value="all">All Ages</option>
                          {getUniqueAges().map(age => (
                            <option key={age} value={age}>{age}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {getFilteredVoices().length} voices match your filters
                      </span>
                      <button
                        onClick={clearFilters}
                        className="text-xs text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 font-medium"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {voicesError && (
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mr-2" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      {voicesError}
                    </p>
                  </div>
                </div>
              )}
              
              {loadingVoices ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-400"></div>
                  <span className="ml-3 text-gray-600 dark:text-gray-300">Loading voices...</span>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {getFilteredVoices().length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">
                        No voices match your current filters. Try adjusting your selection.
                      </p>
                    </div>
                  ) : (
                    getFilteredVoices().map((voice) => (
                      <motion.div
                        key={voice.voice_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-lg border-2 transition-colors duration-200 ${
                          selectedVoiceId === voice.voice_id
                            ? 'border-pink-400 bg-pink-100 dark:border-pink-600 dark:bg-pink-900/30'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                              {voice.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full">
                                {voice.accent}
                              </span>
                              <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded-full">
                                {voice.tone}
                              </span>
                              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-0.5 rounded-full">
                                {voice.age}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {voice.description}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            {!usingFallbackVoices && !voice.voice_id.startsWith('fallback-') && !voice.voice_id.startsWith('basic-') ? (
                              currentlyPlaying === voice.voice_id ? (
                                <button
                                  onClick={handleStopPreview}
                                  className="p-2 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors duration-200"
                                  title="Stop preview"
                                >
                                  <Square className="h-4 w-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handlePlayPreview(voice.voice_id, voice.name)}
                                  disabled={generatingPreview === voice.voice_id}
                                  className="p-2 rounded-full bg-pink-500 hover:bg-pink-600 disabled:bg-gray-400 text-white transition-colors duration-200"
                                  title="Play preview"
                                >
                                  {generatingPreview === voice.voice_id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  ) : (
                                    <Play className="h-4 w-4" />
                                  )}
                                </button>
                              )
                            ) : (
                              <button
                                onClick={() => handlePlayPreview(voice.voice_id, voice.name)}
                                className="p-2 rounded-full bg-pink-500 hover:bg-pink-600 text-white transition-colors duration-200"
                                title="Select voice"
                              >
                                <Volume2 className="h-4 w-4" />
                              </button>
                            )}
                            
                            {selectedVoiceId === voice.voice_id && (
                              <Volume2 className="h-4 w-4 text-pink-500" />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              )}
              
              {selectedVoiceId && (
                <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                  ✓ Voice selected: {voices.find(v => v.voice_id === selectedVoiceId)?.name}
                </p>
              )}
            </div>
          </div>
        );
        
      case 4: // Backstory
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Meet-Cute Scenario
              </label>
              <div className="grid grid-cols-2 gap-3">
                {MEET_CUTE_SCENARIOS.map((scenario) => (
                  <button
                    key={scenario}
                    type="button"
                    className={`p-3 rounded-lg border-2 text-center ${
                      characterCreationData.meet_cute === scenario
                        ? 'border-pink-400 bg-pink-100 dark:border-pink-600 dark:bg-pink-900/30'
                        : 'border-gray-200 dark:border-gray-700'
                    } transition-colors duration-200`}
                    onClick={() => updateCharacterCreationData({ meet_cute: scenario })}
                  >
                    <span className="capitalize">
                      {scenario.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Additional Backstory (optional)
              </label>
              <textarea
                value={characterCreationData.backstory || ''}
                onChange={(e) => updateCharacterCreationData({ backstory: e.target.value })}
                className="uwu-input w-full h-32"
                placeholder="Add any additional details about your character's background, interests, or hobbies..."
              />
            </div>
          </div>
        );
        
      case 5: // Generate
        return (
          <div className="space-y-6 text-center">
            <div className="py-4">
              <Sparkles className="h-16 w-16 text-pink-400 mx-auto mb-4 animate-sparkle" />
              <h3 className="text-xl font-semibold mb-2">
                Ready to Generate Your AI Companion
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                We'll create your perfect AI partner based on all the details you've provided.
              </p>
            </div>
            
            {/* Character Preview */}
            <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-6">
              <h4 className="font-medium mb-3 text-pink-600 dark:text-pink-300">Character Summary</h4>
              <div className="text-left space-y-2 text-sm">
                <p><strong>Name:</strong> {characterCreationData.name}</p>
                <p><strong>Gender:</strong> {characterCreationData.gender === 'male' ? 'Boyfriend' : characterCreationData.gender === 'female' ? 'Girlfriend' : 'Non-Binary Partner'}</p>
                <p><strong>Appearance:</strong> {characterCreationData.height} height, {characterCreationData.build} build, {characterCreationData.eye_color} eyes, {characterCreationData.hair_color} hair</p>
                <p><strong>Art Style:</strong> {characterCreationData.art_style}</p>
                <p><strong>Personality:</strong> {selectedTraits.join(', ')}</p>
                <p><strong>Voice:</strong> {characterCreationData.voice_accent || 'Not selected'}</p>
                <p><strong>How You Met:</strong> {characterCreationData.meet_cute}</p>
              </div>
            </div>
            
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 p-4 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {session 
                  ? "Click 'Create Character' to generate your AI companion!"
                  : "You need to login or create an account to save your character."
                }
              </p>
              
              {!session ? (
                <button
                  type="button"
                  onClick={() => navigate('/auth')}
                  className="inline-flex items-center px-6 py-3 font-medium text-white bg-gradient-to-r from-pink-400 to-lavender-400 rounded-full shadow-md hover:from-pink-500 hover:to-lavender-500 transition-all duration-200"
                >
                  Login to Continue
                </button>
              ) : null}
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow flex flex-col py-20 px-4">
        <div className="max-w-2xl mx-auto w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-pink-400 to-lavender-400 bg-clip-text text-transparent">
                Let's build your dream companion
              </h1>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Step {step + 1} of {steps.length}</span>
                <span>{steps[step]}</span>
              </div>
              <div className="mt-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-pink-400 to-lavender-400 transition-all duration-300"
                  style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
            
            <div className="mt-8 flex justify-between">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </button>
              ) : (
                <div></div>
              )}
              
              {step < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-pink-400 to-lavender-400 hover:from-pink-500 hover:to-lavender-500 text-white rounded-full text-sm font-medium transition-all duration-200"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={isGenerating || !session}
                  className={`inline-flex items-center px-6 py-2 text-white rounded-full text-sm font-medium transition-all duration-200 ${
                    !session
                      ? 'bg-gray-400 cursor-not-allowed'
                      : isGenerating
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-pink-400 to-lavender-400 hover:from-pink-500 hover:to-lavender-500'
                  }`}
                >
                  {isGenerating ? (
                    'Creating...'
                  ) : (
                    <>
                      Create Character
                      <Heart className="h-4 w-4 ml-2" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
      
      {/* Success Modal */}
      {showSuccessModal && createdCharacter && (
        <CharacterSuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          character={createdCharacter}
        />
      )}
    </div>
  );
};

export default CharacterCreationPage;