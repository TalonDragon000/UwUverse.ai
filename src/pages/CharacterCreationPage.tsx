import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Heart, Sparkles } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { useCharacterStore } from '../stores/characterStore';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

const PERSONALITY_TRAITS = [
  'shy', 'flirty', 'confident', 'chaotic',
  'protective', 'loyal', 'bookish', 'mysterious',
  'playful', 'creative', 'passionate', 'caring'
];

const MEET_CUTE_SCENARIOS = [
  'school', 'online', 'time travel', 'rivals-to-lovers',
  'coffee shop', 'neighbors', 'childhood friends', 'blind date'
];

const CharacterCreationPage: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAuthStore();
  const { characterCreationData, updateCharacterCreationData } = useCharacterStore();
  const [step, setStep] = useState(0);
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const steps = [
    'Basic Details',
    'Appearance',
    'Personality',
    'Voice & Style',
    'Backstory',
    'Generate'
  ];
  
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
      
      // Instead of generating a real image, use a placeholder
      // In a production app, this would call an image generation API
      const imageUrl = `https://images.pexels.com/photos/6157228/pexels-photo-6157228.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1`;
      
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
          image_url: imageUrl
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

      // Add explicit validation for chat.id before navigation
      if (!chat?.id || typeof chat.id !== 'string') {
        throw new Error('Invalid chat ID received after creation');
      }
      
      // Only navigate if we have a valid chat ID
      navigate(`/chat/${chat.id}`);
    } catch (error) {
      console.error('Error creating character:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      // Stay on the current page if there's an error
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
        
      case 3: // Voice & Style
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Voice Accent
              </label>
              <select
                value={characterCreationData.voice_accent || ''}
                onChange={(e) => updateCharacterCreationData({ voice_accent: e.target.value })}
                className="uwu-input w-full"
              >
                {[
                  {value: 'calm', label: 'Calm (Korean)'},
                  {value: 'romantic', label: 'Romantic (French)'},
                  {value: 'playful', label: 'Playful (American)'},
                  {value: 'soft', label: 'Soft (British)'},
                  {value: 'energetic', label: 'Energetic (Latina)'}
                ].map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Voice is currently text-only. Voice synthesis coming soon!
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Art Style
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {['anime', 'manhwa', 'comic', 'realistic', 'cartoon'].map((style) => (
                  <button
                    key={style}
                    type="button"
                    className={`p-3 rounded-lg border-2 text-center ${
                      characterCreationData.art_style === style
                        ? 'border-pink-400 bg-pink-100 dark:border-pink-600 dark:bg-pink-900/30'
                        : 'border-gray-200 dark:border-gray-700'
                    } transition-colors duration-200`}
                    onClick={() => updateCharacterCreationData({ art_style: style as any })}
                  >
                    <span className="capitalize">{style}</span>
                  </button>
                ))}
              </div>
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
                <p><strong>Personality:</strong> {selectedTraits.join(', ')}</p>
                <p><strong>Style:</strong> {characterCreationData.art_style} art style</p>
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
    </div>
  );
};

export default CharacterCreationPage;