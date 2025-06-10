import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const picaSecretKey = Deno.env.get('PICA_SECRET_KEY');
    const picaConnectionKey = Deno.env.get('PICA_OPENAI_CONNECTION_KEY');

    if (!picaSecretKey || !picaConnectionKey) {
      throw new Error('Missing Pica API credentials');
    }

    const {
      name,
      gender,
      height,
      build,
      eye_color,
      hair_color,
      skin_tone,
      personality_traits,
      art_style,
    } = await req.json() as CharacterRequest;

    // Construct the prompt based on character traits and art style
    let stylePrefix = '';
    switch (art_style) {
      case 'anime':
        stylePrefix = 'Create a high-quality anime illustration in the style of Studio Ghibli';
        break;
      case 'manhwa':
        stylePrefix = 'Create a detailed manhwa/webtoon style illustration similar to Solo Leveling';
        break;
      case 'comic':
        stylePrefix = 'Create a modern comic book style illustration with clean lines';
        break;
      case 'realistic':
        stylePrefix = 'Create a photorealistic digital painting';
        break;
      case 'cartoon':
        stylePrefix = 'Create a stylized cartoon illustration with vibrant colors';
        break;
      default:
        stylePrefix = 'Create a high-quality digital illustration';
    }

    const prompt = `${stylePrefix} of a ${gender} character with the following features:
      - ${height} height with a ${build} build
      - Striking ${eye_color} eyes and ${hair_color} hair
      - ${skin_tone} skin tone
      - Their expression and pose should reflect their ${personality_traits.join(', ')} personality
      - The character should be centered in a dynamic pose with a soft, atmospheric background
      - The image should be high quality, well-lit, and suitable for a dating app profile
      - No text or watermarks
      - Full body shot with attention to detail`;

    const response = await fetch('https://api.picaos.com/v1/passthrough/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-pica-secret': picaSecretKey,
        'x-pica-connection-key': picaConnectionKey,
        'x-pica-action-id': 'conn_mod_def::GDzgKm29yzA::qOaVIyE3RWmrUDhvW7VmDw',
      },
      body: JSON.stringify({
        prompt,
        model: 'dall-e-3',
        size: '1024x1024',
        quality: 'standard',
        style: 'natural',
        response_format: 'url',
        n: 1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Pica API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const imageUrl = data.data[0].url;

    return new Response(
      JSON.stringify({ 
        success: true,
        image_url: imageUrl,
        usage: data.usage 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating image:', error);
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