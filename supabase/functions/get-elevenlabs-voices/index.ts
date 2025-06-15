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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');

    if (!elevenLabsApiKey) {
      throw new Error('Missing ElevenLabs API key');
    }

    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'xi-api-key': elevenLabsApiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
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
        voices: formattedVoices 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching ElevenLabs voices:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});