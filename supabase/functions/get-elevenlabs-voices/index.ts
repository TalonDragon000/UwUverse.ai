import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  labels: {
    accent?: string;
    description?: string;
    age?: string;
    gender?: string;
    use_case?: string;
  };
  preview_url?: string;
}

// Fallback voices when ElevenLabs API is not available
const fallbackVoices = [
  {
    voice_id: 'fallback-male-1',
    name: 'Alex',
    gender: 'male',
    accent: 'American',
    age: 'young adult',
    description: 'Warm and friendly voice',
  },
  {
    voice_id: 'fallback-male-2',
    name: 'David',
    gender: 'male',
    accent: 'British',
    age: 'middle aged',
    description: 'Sophisticated and calm',
  },
  {
    voice_id: 'fallback-female-1',
    name: 'Sarah',
    gender: 'female',
    accent: 'American',
    age: 'young adult',
    description: 'Sweet and cheerful voice',
  },
  {
    voice_id: 'fallback-female-2',
    name: 'Emma',
    gender: 'female',
    accent: 'British',
    age: 'young adult',
    description: 'Elegant and articulate',
  },
  {
    voice_id: 'fallback-female-3',
    name: 'Luna',
    gender: 'female',
    accent: 'Neutral',
    age: 'young adult',
    description: 'Soft and mysterious',
  },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');

    // If no API key is available, return fallback voices
    if (!elevenLabsApiKey) {
      console.log('ElevenLabs API key not found, using fallback voices');
      return new Response(
        JSON.stringify({ 
          success: true,
          voices: fallbackVoices,
          fallback: true,
          message: 'Using fallback voices. Configure ELEVENLABS_API_KEY for full voice selection.'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'xi-api-key': elevenLabsApiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`ElevenLabs API error: ${response.statusText}`);
      // Fall back to default voices if API fails
      return new Response(
        JSON.stringify({ 
          success: true,
          voices: fallbackVoices,
          fallback: true,
          message: 'ElevenLabs API unavailable. Using fallback voices.'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await response.json();
    
    // Filter and format voices for our use case
    const formattedVoices = data.voices
      .filter((voice: ElevenLabsVoice) => voice.category === 'premade')
      .map((voice: ElevenLabsVoice) => ({
        voice_id: voice.voice_id,
        name: voice.name,
        gender: voice.labels?.gender || 'neutral',
        accent: voice.labels?.accent || 'neutral',
        age: voice.labels?.age || 'adult',
        description: voice.labels?.description || '',
        preview_url: voice.preview_url,
      }));

    return new Response(
      JSON.stringify({ 
        success: true,
        voices: formattedVoices,
        fallback: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching ElevenLabs voices:', error);
    
    // Return fallback voices even on error
    return new Response(
      JSON.stringify({ 
        success: true,
        voices: fallbackVoices,
        fallback: true,
        message: 'Error occurred. Using fallback voices.'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});