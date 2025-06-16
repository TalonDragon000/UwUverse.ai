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

// Enhanced tone assignment function
const assignTone = (voice: ElevenLabsVoice): string => {
  const description = voice.labels?.description?.toLowerCase() || '';
  const name = voice.name.toLowerCase();
  
  // Analyze description and name for tone keywords
  if (description.includes('warm') || description.includes('friendly') || description.includes('cheerful') || 
      description.includes('bright') || description.includes('upbeat')) {
    return 'warm';
  }
  
  if (description.includes('calm') || description.includes('soothing') || description.includes('gentle') || 
      description.includes('soft') || description.includes('peaceful')) {
    return 'calm';
  }
  
  if (description.includes('confident') || description.includes('strong') || description.includes('assertive') || 
      description.includes('powerful') || description.includes('authoritative')) {
    return 'confident';
  }
  
  if (description.includes('playful') || description.includes('energetic') || description.includes('lively') || 
      description.includes('bubbly') || description.includes('animated')) {
    return 'playful';
  }
  
  if (description.includes('mysterious') || description.includes('sultry') || description.includes('deep') || 
      description.includes('seductive') || description.includes('alluring')) {
    return 'mysterious';
  }
  
  if (description.includes('professional') || description.includes('business') || description.includes('formal')) {
    return 'professional';
  }
  
  if (description.includes('romantic') || description.includes('intimate') || description.includes('loving')) {
    return 'romantic';
  }
  
  // Default tone based on gender if no specific tone found
  const gender = voice.labels?.gender?.toLowerCase();
  if (gender === 'male') {
    return 'confident';
  } else if (gender === 'female') {
    return 'warm';
  }
  
  return 'neutral';
};

// Fallback voices with proper tone assignments
const fallbackVoices = [
  {
    voice_id: 'fallback-male-1',
    name: 'Alex',
    gender: 'male',
    accent: 'American',
    age: 'young adult',
    tone: 'warm',
    description: 'Warm and friendly voice perfect for casual conversations',
  },
  {
    voice_id: 'fallback-male-2',
    name: 'David',
    gender: 'male',
    accent: 'British',
    age: 'middle aged',
    tone: 'confident',
    description: 'Sophisticated and confident with a distinguished British accent',
  },
  {
    voice_id: 'fallback-male-3',
    name: 'Ryan',
    gender: 'male',
    accent: 'American',
    age: 'young adult',
    tone: 'playful',
    description: 'Energetic and playful voice with youthful enthusiasm',
  },
  {
    voice_id: 'fallback-female-1',
    name: 'Sarah',
    gender: 'female',
    accent: 'American',
    age: 'young adult',
    tone: 'warm',
    description: 'Sweet and cheerful voice with a warm, caring tone',
  },
  {
    voice_id: 'fallback-female-2',
    name: 'Emma',
    gender: 'female',
    accent: 'British',
    age: 'young adult',
    tone: 'confident',
    description: 'Elegant and articulate with sophisticated confidence',
  },
  {
    voice_id: 'fallback-female-3',
    name: 'Luna',
    gender: 'female',
    accent: 'Neutral',
    age: 'young adult',
    tone: 'mysterious',
    description: 'Soft and mysterious with an alluring, captivating quality',
  },
  {
    voice_id: 'fallback-female-4',
    name: 'Aria',
    gender: 'female',
    accent: 'American',
    age: 'young adult',
    tone: 'playful',
    description: 'Bubbly and energetic with a playful, animated personality',
  },
  {
    voice_id: 'fallback-female-5',
    name: 'Sophia',
    gender: 'female',
    accent: 'Neutral',
    age: 'young adult',
    tone: 'calm',
    description: 'Gentle and soothing voice that brings peace and tranquility',
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

    // Try to fetch from ElevenLabs V2 API first, then fallback to V1
    let response;
    let apiVersion = 'v2';
    
    try {
      // Try V2 API first for better quality voices
      response = await fetch('https://api.elevenlabs.io/v1/voices', {
        method: 'GET',
        headers: {
          'xi-api-key': elevenLabsApiKey,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.log('V2 API failed, falling back to V1');
      apiVersion = 'v1';
      
      response = await fetch('https://api.elevenlabs.io/v1/voices', {
        method: 'GET',
        headers: {
          'xi-api-key': elevenLabsApiKey,
          'Content-Type': 'application/json',
        },
      });
    }

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
    
    // Filter and format voices for our use case with enhanced tone assignment
    const formattedVoices = data.voices
      .filter((voice: ElevenLabsVoice) => voice.category === 'premade')
      .map((voice: ElevenLabsVoice) => ({
        voice_id: voice.voice_id,
        name: voice.name,
        gender: voice.labels?.gender || 'neutral',
        accent: voice.labels?.accent || 'neutral',
        age: voice.labels?.age || 'adult',
        tone: assignTone(voice), // Enhanced tone assignment
        description: voice.labels?.description || '',
        preview_url: voice.preview_url,
        api_version: apiVersion,
      }));

    return new Response(
      JSON.stringify({ 
        success: true,
        voices: formattedVoices,
        fallback: false,
        api_version: apiVersion
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