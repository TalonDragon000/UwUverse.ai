import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

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

// Exponential backoff retry wrapper
const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // 20 second timeout wrapper for Stable Diffusion (can be slower than DALL-E)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Operation timeout')), 20000);
      });
      
      return await Promise.race([operation(), timeoutPromise]);
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

// Fallback character images based on gender and style
const getFallbackImage = (gender: string, art_style: string): string => {
  const fallbackImages = {
    male: {
      anime: '/art-styles/male anime.jpg',
      '3d': '/art-styles/male 3d.jpg',
      comic: '/art-styles/male comicbook.jpg',
      realistic: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      default: '/art-styles/male anime.jpg'
    },
    female: {
      anime: 'https://images.pexels.com/photos/3992656/pexels-photo-3992656.png?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      '3d': '/art-styles/female 3d.jpg',
      comic: '/art-styles/female comicbook.jpg',
      realistic: '/art-styles/female realistic.jpg',
      default: '/art-styles/female 3d.jpg'
    },
    nonbinary: {
      anime: '/art-styles/male anime.jpg',
      '3d': '/art-styles/male 3d.jpg',
      comic: '/art-styles/male comicbook.jpg',
      realistic: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      default: '/art-styles/male anime.jpg'
    }
  };

  const genderImages = fallbackImages[gender as keyof typeof fallbackImages] || fallbackImages.nonbinary;
  return genderImages[art_style as keyof typeof genderImages] || genderImages.default;
};

// Generate Stable Diffusion prompt with enhanced style-specific details
const generateStableDiffusionPrompt = (request: CharacterRequest): string => {
  const { gender, height, build, eye_color, hair_color, skin_tone, personality_traits, art_style } = request;

  // Enhanced art style descriptions optimized for Stable Diffusion
  let stylePrefix = '';
  let styleDetails = '';
  let qualityTags = '';
  
  switch (art_style) {
    case 'anime':
      stylePrefix = 'anime style, manga style, cel shaded';
      styleDetails = 'large expressive eyes, vibrant colors, soft cel-shading, clean line art, anime proportions, detailed hair, kawaii aesthetic';
      qualityTags = 'high quality anime art, studio quality, detailed anime illustration';
      break;
    case '3d':
      stylePrefix = '3d render, digital art, cgi';
      styleDetails = 'realistic 3d rendering, soft lighting, detailed textures, modern 3d art style, smooth surfaces, professional 3d modeling';
      qualityTags = 'high quality 3d render, octane render, unreal engine, photorealistic 3d';
      break;
    case 'comic':
      stylePrefix = 'comic book style, western comic art';
      styleDetails = 'bold clean line art, dynamic poses, strong contrast, vibrant colors, comic book shading, heroic proportions, detailed costume design';
      qualityTags = 'high quality comic art, professional comic illustration, marvel style, dc comics style';
      break;
    case 'realistic':
      stylePrefix = 'photorealistic, realistic portrait, digital painting';
      styleDetails = 'natural human proportions, realistic skin textures, detailed facial features, natural lighting, lifelike detail';
      qualityTags = 'photorealistic, high resolution, professional portrait, detailed realistic art';
      break;
    default:
      stylePrefix = 'digital art, illustration';
      styleDetails = 'professional artistic quality, appealing character design, vibrant colors';
      qualityTags = 'high quality digital art, professional illustration';
  }

  // Build personality-influenced description
  const personalityDescription = personality_traits.length > 0 
    ? `${personality_traits.slice(0, 3).join(', ')} personality, expressive face showing ${personality_traits[0]} traits`
    : 'friendly and approachable expression';

  // Construct the optimized prompt for Stable Diffusion
  const prompt = `${stylePrefix}, portrait of a ${gender} character, ${height} height, ${build} build, ${eye_color} eyes, ${hair_color} hair, ${skin_tone} skin, ${personalityDescription}, ${styleDetails}, upper body shot, centered composition, soft background, ${qualityTags}`;

  // Add negative prompt elements to avoid common issues
  const negativePrompt = 'low quality, blurry, distorted, deformed, ugly, bad anatomy, extra limbs, text, watermark, signature, logo, multiple people, nsfw';

  return prompt;
};

// Try multiple Stable Diffusion API providers
const tryStableDiffusionAPIs = async (prompt: string): Promise<string> => {
  const apis = [
    {
      name: 'Hugging Face',
      endpoint: 'https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5',
      headers: (apiKey: string) => ({
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      }),
      body: (prompt: string) => JSON.stringify({
        inputs: prompt,
        parameters: {
          num_inference_steps: 30,
          guidance_scale: 7.5,
          width: 512,
          height: 512,
        }
      }),
      parseResponse: async (response: Response) => {
        if (response.headers.get('content-type')?.includes('image')) {
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
          return `data:image/png;base64,${base64}`;
        } else {
          const data = await response.json();
          throw new Error(data.error || 'Unknown error from Hugging Face API');
        }
      }
    },
    {
      name: 'Replicate',
      endpoint: 'https://api.replicate.com/v1/predictions',
      headers: (apiKey: string) => ({
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
      }),
      body: (prompt: string) => JSON.stringify({
        version: "ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4", // Stable Diffusion v1.5
        input: {
          prompt: prompt,
          width: 512,
          height: 512,
          num_inference_steps: 30,
          guidance_scale: 7.5,
          scheduler: "K_EULER_ANCESTRAL"
        }
      }),
      parseResponse: async (response: Response) => {
        const data = await response.json();
        if (data.output && data.output[0]) {
          return data.output[0];
        }
        throw new Error(data.detail || 'Unknown error from Replicate API');
      }
    }
  ];

  // Try each API in order
  for (const api of apis) {
    try {
      const apiKey = Deno.env.get(`${api.name.toUpperCase().replace(' ', '_')}_API_KEY`);
      if (!apiKey) {
        console.log(`${api.name} API key not found, skipping...`);
        continue;
      }

      console.log(`Trying ${api.name} API...`);
      
      const response = await fetch(api.endpoint, {
        method: 'POST',
        headers: api.headers(apiKey),
        body: api.body(prompt),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`${api.name} API error: ${response.status} - ${errorText}`);
        continue;
      }

      const imageUrl = await api.parseResponse(response);
      console.log(`Successfully generated image using ${api.name}`);
      return imageUrl;
      
    } catch (error) {
      console.error(`Error with ${api.name} API:`, error);
      continue;
    }
  }

  throw new Error('All Stable Diffusion APIs failed or are not configured');
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { name, gender, height, build, eye_color, hair_color, skin_tone, personality_traits, art_style } = await req.json() as CharacterRequest;

    // Try Stable Diffusion APIs first
    try {
      console.log('Attempting Stable Diffusion image generation...');
      
      const prompt = generateStableDiffusionPrompt({
        name, gender, height, build, eye_color, hair_color, skin_tone, personality_traits, art_style
      });
      
      console.log('Generated prompt:', prompt);
      
      const imageUrl = await withRetry(async () => {
        return await tryStableDiffusionAPIs(prompt);
      });

      return new Response(
        JSON.stringify({ 
          success: true,
          image_url: imageUrl,
          model_used: 'stable-diffusion',
          prompt_used: prompt
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
      
    } catch (stableDiffusionError) {
      console.error('Stable Diffusion generation error:', stableDiffusionError);
      
      // Use fallback image generation based on character attributes
      const fallbackImageUrl = getFallbackImage(gender, art_style);
      
      return new Response(
        JSON.stringify({ 
          success: true,
          image_url: fallbackImageUrl,
          fallback: true,
          message: 'Character created with curated reference image. AI image generation temporarily unavailable.',
          error_details: stableDiffusionError.message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('Unexpected error in ai-image-generation:', error);
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