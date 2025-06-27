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
      const { message, character_id, chat_history, character_traits } = await req.json() as ChatRequest;

      // Check if Tavus API credentials are available
      if (!TAVUS_KEY_PREFIX || !TAVUS_SECRET_KEY) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Chat service is not configured. Please contact support.',
            fallback: true
          }),
          {
            status: 400,
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
        // Call Tavus API for chat response
        const response = await fetch(`${TAVUS_API_URL}/chat`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            message,
            character_id,
            chat_history,
            character_traits,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Tavus API error: ${response.status} ${response.statusText} - ${errorText}`);
          throw new Error(`Tavus API error: ${response.statusText}`);
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
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Chat service is temporarily unavailable. Please try again later.'
          }),
          {
            status: 500,
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