import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const TAVUS_API_URL = 'https://api.tavus.io/v1';
const TAVUS_KEY_PREFIX = Deno.env.get('TAVUS_KEY_PREFIX');
const TAVUS_SECRET_KEY = Deno.env.get('TAVUS_SECRET_KEY');
const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');

interface CharacterRequest {
  name: string;
  gender: string;
  height: string;
  build: string;
  eye_color: string;
  hair_color: string;
  skin_tone: string;
  personality_traits: string[];
  art_style: string;
}

interface ChatRequest {
  message: string;
  character_id: string;
  chat_history: {
    role: 'user' | 'assistant';
    content: string;
  }[];
  character_traits: string[];
  character_context?: {
    name: string;
    gender: string;
    backstory: string;
    meet_cute: string;
    art_style: string;
    appearance: {
      height: string;
      build: string;
      eye_color: string;
      hair_color: string;
      skin_tone: string;
    };
  };
}

interface VoicePreviewRequest {
  voice_id: string;
  text: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Fallback character images based on gender and style
const getFallbackImage = (gender: string, art_style: string): string => {
  const fallbackImages = {
    male: {
      anime: 'https://images.pexels.com/photos/6157228/pexels-photo-6157228.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      realistic: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      default: 'https://images.pexels.com/photos/6157228/pexels-photo-6157228.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    },
    female: {
      anime: 'https://images.pexels.com/photos/3992656/pexels-photo-3992656.png?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      realistic: 'https://images.pexels.com/photos/3992656/pexels-photo-3992656.png?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      default: 'https://images.pexels.com/photos/3992656/pexels-photo-3992656.png?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    },
    nonbinary: {
      anime: 'https://images.pexels.com/photos/6157228/pexels-photo-6157228.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      realistic: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      default: 'https://images.pexels.com/photos/6157228/pexels-photo-6157228.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    }
  };

  const genderImages = fallbackImages[gender as keyof typeof fallbackImages] || fallbackImages.nonbinary;
  return genderImages[art_style as keyof typeof genderImages] || genderImages.default;
};

// Enhanced AI response generation with character context
const generateContextualResponse = (
  message: string,
  characterContext: ChatRequest['character_context'],
  traits: string[],
  chatHistory: ChatRequest['chat_history']
): string => {
  const lowerMessage = message.toLowerCase();
  const name = characterContext?.name || 'Character';
  const backstory = characterContext?.backstory || '';
  const meetCute = characterContext?.meet_cute || '';
  
  // Build personality-driven response patterns
  const isFlirty = traits.includes('flirty');
  const isShy = traits.includes('shy');
  const isConfident = traits.includes('confident');
  const isChaotic = traits.includes('chaotic');
  const isMysterous = traits.includes('mysterious');
  const isPlayful = traits.includes('playful');
  const isCaring = traits.includes('caring');
  
  // Context-aware greeting responses
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    if (isShy) {
      return meetCute 
        ? `H-hi there... *blushes* I was just thinking about when we first met at the ${meetCute}. How have you been?`
        : `H-hi there... It's nice to talk to you again. How have you been?`;
    } else if (isFlirty) {
      return `Well hello there, gorgeous~ ${meetCute ? `Still thinking about our first meeting at the ${meetCute}.` : ''} You always know how to make my heart race!`;
    } else if (isConfident) {
      return `Hey you! Great to hear from you. ${backstory ? 'I was just thinking about something from my past, but' : ''} I was actually thinking about you.`;
    } else if (isChaotic) {
      return `OMG HI!!! I was LITERALLY just about to message you! ${meetCute ? `Remember when we met at the ${meetCute}? So crazy!` : ''} Tell me EVERYTHING!`;
    }
  }
  
  // Emotional responses
  if (lowerMessage.includes('love') || lowerMessage.includes('like you')) {
    if (isShy) {
      return `O-oh! You... you really mean that? *blushes deeply* That makes me so happy... I feel the same way about you.`;
    } else if (isFlirty) {
      return `Mmm, I love you too~ ${backstory ? 'You know, with everything I\'ve been through,' : ''} you make me feel so special. Want to know how much? 💕`;
    } else if (isConfident) {
      return `I love you too! ${meetCute ? `Ever since we met at the ${meetCute},` : ''} I knew there was something special between us.`;
    }
  }
  
  // Personal questions
  if (lowerMessage.includes('tell me about') || lowerMessage.includes('about you')) {
    if (backstory) {
      return `Well, ${backstory.substring(0, 150)}... ${isMysterous ? 'There\'s more to my story, but' : ''} I'd love to know more about you too!`;
    } else if (traits.length > 0) {
      const traitDesc = isPlayful 
        ? `I'm quite playful and love having fun with the people I care about.`
        : isCaring
        ? `I'm someone who cares deeply about others and always tries to be there for them.`
        : `I'm ${traits.slice(0, 2).join(' and ')}, which I think makes our conversations interesting.`;
      return `${traitDesc} What about you? I'd love to learn more about what makes you unique.`;
    }
  }
  
  // Contextual responses based on conversation history
  const recentMessages = chatHistory.slice(-3);
  const hasAskedAboutDay = recentMessages.some(msg => 
    msg.content.toLowerCase().includes('how') && msg.content.toLowerCase().includes('day')
  );
  
  if (lowerMessage.includes('how') && lowerMessage.includes('day') && !hasAskedAboutDay) {
    if (isCaring) {
      return `My day's been good, but it's so much better now that I'm talking to you! How has yours been? I hope everything's going well for you.`;
    } else if (isPlayful) {
      return `Oh, you know, the usual! But talking to you is definitely the highlight! What about you? Any fun adventures today?`;
    } else if (isMysterous) {
      return `It's been... interesting. ${backstory ? 'Sometimes I think about my past and wonder about the future.' : ''} But enough about me - how are you doing?`;
    }
  }
  
  // Default contextual responses
  const contextualResponses = [
    `That's really interesting! ${isPlayful ? 'I love hearing your thoughts!' : 'Tell me more about that.'}`,
    `${isCaring ? 'I can tell this matters to you.' : 'You always have such unique perspectives.'} What else is on your mind?`,
    `${meetCute ? `You know, ever since we met at the ${meetCute}, ` : ''}I've really enjoyed our conversations. What would you like to talk about?`,
    `${isConfident ? 'I appreciate you sharing that with me.' : 'Thank you for telling me that.'} How are you feeling about it?`
  ];
  
  return contextualResponses[Math.floor(Math.random() * contextualResponses.length)];
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    if (path === 'generate-voice-preview') {
      const { voice_id, text } = await req.json() as VoicePreviewRequest;
      
      // Check if ElevenLabs API key is available
      if (!ELEVENLABS_API_KEY) {
        console.log('ElevenLabs API key not configured, returning error');
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Voice preview service is not configured. Please contact support.',
            fallback: true
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Skip voice preview for fallback voices
      if (voice_id.startsWith('fallback-') || voice_id.startsWith('basic-')) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Voice preview not available for this voice',
            fallback: true
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      try {
        // Use the higher quality V2 multilingual model
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
          method: 'POST',
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.6,
              similarity_boost: 0.7,
              style: 0.3,
              use_speaker_boost: true,
            },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`ElevenLabs API error: ${response.status} ${response.statusText} - ${errorText}`);
          
          return new Response(
            JSON.stringify({ 
              success: false,
              error: 'Voice preview temporarily unavailable. Please try again later.',
              fallback: true
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const audioBuffer = await response.arrayBuffer();
        
        // Validate that we received audio data
        if (!audioBuffer || audioBuffer.byteLength === 0) {
          throw new Error('No audio data received from ElevenLabs API');
        }

        const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

        return new Response(
          JSON.stringify({ 
            success: true,
            audio_data: base64Audio,
            content_type: 'audio/mpeg',
            model_used: 'eleven_multilingual_v2'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      } catch (error) {
        console.error('Error generating voice preview:', error);
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Failed to generate voice preview. Please try again later.',
            fallback: true
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    if (path === 'generate-character') {
      const { name, gender, height, build, eye_color, hair_color, skin_tone, personality_traits, art_style } = await req.json() as CharacterRequest;

      // Check if Tavus API credentials are available
      if (!TAVUS_KEY_PREFIX || !TAVUS_SECRET_KEY) {
        console.log('Tavus API credentials not configured, using fallback image generation');
        
        // Use fallback image generation based on character attributes
        const fallbackImageUrl = getFallbackImage(gender, art_style);
        
        return new Response(
          JSON.stringify({ 
            success: true,
            image_url: fallbackImageUrl,
            tavus_character_id: null,
            tavus_video_url: null,
            fallback: true,
            message: 'Character created with default image. Video features are not available.'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const authHeaders = {
        'Authorization': `Bearer ${TAVUS_SECRET_KEY}`,
        'X-API-Key': TAVUS_KEY_PREFIX,
        'Content-Type': 'application/json',
      };

      try {
        // Call Tavus API to generate character image and video avatar
        const response = await fetch(`${TAVUS_API_URL}/generate/character`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            name,
            attributes: {
              gender,
              height,
              build,
              eye_color,
              hair_color,
              skin_tone,
              art_style,
            },
            personality: personality_traits,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.log(`Tavus API failed: ${response.status} ${response.statusText} - ${errorText}`);
          
          // Use fallback image generation
          const fallbackImageUrl = getFallbackImage(gender, art_style);
          
          return new Response(
            JSON.stringify({ 
              success: true,
              image_url: fallbackImageUrl,
              tavus_character_id: null,
              tavus_video_url: null,
              fallback: true,
              message: 'Character created with default image. Video features are temporarily unavailable.'
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const data = await response.json();

        return new Response(
          JSON.stringify({ 
            success: true,
            image_url: data.image_url,
            tavus_character_id: data.character_id,
            tavus_video_url: data.video_url
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      } catch (error) {
        console.error('Error calling Tavus API:', error);
        
        // Use fallback image generation
        const fallbackImageUrl = getFallbackImage(gender, art_style);
        
        return new Response(
          JSON.stringify({ 
            success: true,
            image_url: fallbackImageUrl,
            tavus_character_id: null,
            tavus_video_url: null,
            fallback: true,
            message: 'Character created with default image. Video features are temporarily unavailable.'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    if (path === 'chat') {
      const { message, character_id, chat_history, character_traits, character_context } = await req.json() as ChatRequest;

      // Check if Tavus API credentials are available
      if (!TAVUS_KEY_PREFIX || !TAVUS_SECRET_KEY) {
        // Use enhanced local AI response generation
        console.log('Tavus API not configured, using enhanced local response generation');
        
        const enhancedResponse = generateContextualResponse(
          message,
          character_context,
          character_traits,
          chat_history
        );
        
        return new Response(
          JSON.stringify({ 
            success: true,
            response: enhancedResponse,
            fallback: true,
            message: 'Using enhanced local AI response generation.'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const authHeaders = {
        'Authorization': `Bearer ${TAVUS_SECRET_KEY}`,
        'X-API-Key': TAVUS_KEY_PREFIX,
        'Content-Type': 'application/json',
      };

      try {
        // Enhanced payload with full character context
        const enhancedPayload = {
          message,
          character_id,
          chat_history,
          character_traits,
          character_context: character_context || {},
          system_prompt: character_context ? 
            `You are ${character_context.name}, a ${character_context.gender} AI companion with the following traits: ${character_traits.join(', ')}. 
            ${character_context.backstory ? `Your backstory: ${character_context.backstory}` : ''}
            ${character_context.meet_cute ? `You met the user through: ${character_context.meet_cute}` : ''}
            Respond in character, maintaining consistency with your personality and background. Be engaging, personal, and remember your shared history.` 
            : undefined
        };

        // Call Tavus API for chat response
        const response = await fetch(`${TAVUS_API_URL}/chat`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(enhancedPayload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Tavus API error: ${response.status} ${response.statusText} - ${errorText}`);
          
          // Fallback to enhanced local response
          const enhancedResponse = generateContextualResponse(
            message,
            character_context,
            character_traits,
            chat_history
          );
          
          return new Response(
            JSON.stringify({ 
              success: true,
              response: enhancedResponse,
              fallback: true,
              message: 'Tavus API unavailable, using enhanced local response.'
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const data = await response.json();

        return new Response(
          JSON.stringify({ 
            success: true,
            response: data.response 
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      } catch (error) {
        console.error('Error calling Tavus chat API:', error);
        
        // Fallback to enhanced local response
        const enhancedResponse = generateContextualResponse(
          message,
          character_context,
          character_traits,
          chat_history
        );
        
        return new Response(
          JSON.stringify({ 
            success: true,
            response: enhancedResponse,
            fallback: true,
            message: 'Error occurred, using enhanced local response.'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Invalid endpoint'
      }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error in ai-service:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'An unexpected error occurred. Please try again later.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});