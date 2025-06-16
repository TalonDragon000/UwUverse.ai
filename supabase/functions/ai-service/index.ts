import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const TAVUS_API_URL = 'https://api.tavus.io/v1';
const TAVUS_KEY_PREFIX = Deno.env.get('TAVUS_KEY_PREFIX');
const TAVUS_SECRET_KEY = Deno.env.get('TAVUS_SECRET_KEY');

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    if (path === 'generate-voice-preview') {
      const { voice_id, text } = await req.json() as VoicePreviewRequest;
      
      const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
      if (!elevenLabsApiKey) {
        throw new Error('Missing ElevenLabs API key');
      }

      // Use the higher quality V2 multilingual model
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
        method: 'POST',
        headers: {
          'xi-api-key': elevenLabsApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_multilingual_v2', // Upgraded to V2 model
          voice_settings: {
            stability: 0.6, // Slightly increased for better consistency
            similarity_boost: 0.7, // Increased for better voice matching
            style: 0.3, // Added style parameter for V2 model
            use_speaker_boost: true, // Enhanced speaker clarity
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.statusText}`);
      }

      const audioBuffer = await response.arrayBuffer();
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
    }

    if (!TAVUS_KEY_PREFIX || !TAVUS_SECRET_KEY) {
      throw new Error('Missing Tavus API credentials');
    }

    const authHeaders = {
      'Authorization': `Bearer ${TAVUS_SECRET_KEY}`,
      'X-API-Key': TAVUS_KEY_PREFIX,
      'Content-Type': 'application/json',
    };

    if (path === 'generate-character') {
      const { name, gender, height, build, eye_color, hair_color, skin_tone, personality_traits, art_style } = await req.json() as CharacterRequest;

      // Call Tavus API to generate character image
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
        throw new Error(`Tavus API error: ${response.statusText}`);
      }

      const data = await response.json();

      return new Response(
        JSON.stringify({ image_url: data.image_url }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (path === 'chat') {
      const { message, character_id, chat_history, character_traits } = await req.json() as ChatRequest;

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
        throw new Error(`Tavus API error: ${response.statusText}`);
      }

      const data = await response.json();

      return new Response(
        JSON.stringify({ response: data.response }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    throw new Error('Invalid endpoint');
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});