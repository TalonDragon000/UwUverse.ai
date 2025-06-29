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
      // 30 second timeout wrapper for AI image generation
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Operation timeout')), 30000);
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

// Generate optimized prompt for Stability AI
const generateStabilityAIPrompt = (request: CharacterRequest): { prompt: string; negativePrompt: string; stylePreset?: string } => {
  const { gender, height, build, eye_color, hair_color, skin_tone, personality_traits, art_style } = request;

  // Enhanced art style descriptions optimized for Stability AI
  let stylePrefix = '';
  let styleDetails = '';
  let qualityTags = '';
  let stylePreset: string | undefined;
  
  switch (art_style) {
    case 'anime':
      stylePrefix = 'anime style, manga style, cel shaded';
      styleDetails = 'large expressive eyes, vibrant colors, soft cel-shading, clean line art, anime proportions, detailed hair, kawaii aesthetic';
      qualityTags = 'high quality anime art, studio quality, detailed anime illustration, masterpiece';
      stylePreset = 'anime';
      break;
    case '3d':
      stylePrefix = '3d render, digital art, cgi';
      styleDetails = 'realistic 3d rendering, soft lighting, detailed textures, modern 3d art style, smooth surfaces, professional 3d modeling';
      qualityTags = 'high quality 3d render, octane render, unreal engine, photorealistic 3d, masterpiece';
      stylePreset = '3d-model';
      break;
    case 'comic':
      stylePrefix = 'comic book style, western comic art';
      styleDetails = 'bold clean line art, dynamic poses, strong contrast, vibrant colors, comic book shading, heroic proportions, detailed costume design';
      qualityTags = 'high quality comic art, professional comic illustration, marvel style, dc comics style, masterpiece';
      stylePreset = 'comic-book';
      break;
    case 'realistic':
      stylePrefix = 'photorealistic, realistic portrait, digital painting';
      styleDetails = 'natural human proportions, realistic skin textures, detailed facial features, natural lighting, lifelike detail';
      qualityTags = 'photorealistic, high resolution, professional portrait, detailed realistic art, masterpiece';
      stylePreset = 'photographic';
      break;
    default:
      stylePrefix = 'digital art, illustration';
      styleDetails = 'professional artistic quality, appealing character design, vibrant colors';
      qualityTags = 'high quality digital art, professional illustration, masterpiece';
  }

  // Build personality-influenced description
  const personalityDescription = personality_traits.length > 0 
    ? `${personality_traits.slice(0, 3).join(', ')} personality, expressive face showing ${personality_traits[0]} traits`
    : 'friendly and approachable expression';

  // Construct the optimized prompt for Stability AI
  const prompt = `${stylePrefix}, portrait of a ${gender} character, ${height} height, ${build} build, ${eye_color} eyes, ${hair_color} hair, ${skin_tone} skin, ${personalityDescription}, ${styleDetails}, upper body shot, centered composition, soft background, ${qualityTags}`;

  // Enhanced negative prompt for better quality
  const negativePrompt = 'low quality, blurry, distorted, deformed, ugly, bad anatomy, extra limbs, missing limbs, extra fingers, missing fingers, text, watermark, signature, logo, multiple people, nsfw, nude, naked, inappropriate, bad hands, malformed hands, duplicate, cropped, out of frame, worst quality, low resolution, pixelated';

  return { prompt, negativePrompt, stylePreset };
};

// Try image generation APIs in priority order
const tryImageGenerationAPIs = async (request: CharacterRequest): Promise<{ imageUrl: string; provider: string; prompt?: string }> => {
  const { prompt, negativePrompt, stylePreset } = generateStabilityAIPrompt(request);
  
  // 1. Try Stability AI API (Primary - Best Quality)
  const stabilityApiKey = Deno.env.get('STABILITY_AI_API_KEY');
  if (stabilityApiKey) {
    try {
      console.log('Trying Stability AI API...');
      
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('negative_prompt', negativePrompt);
      formData.append('aspect_ratio', '1:1');
      formData.append('output_format', 'png');
      
      if (stylePreset) {
        formData.append('style_preset', stylePreset);
      }

      const response = await fetch('https://api.stability.ai/v2beta/stable-image/generate/core', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stabilityApiKey}`,
          'Accept': 'image/*',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Stability AI API error: ${response.status} - ${errorText}`);
        throw new Error(`Stability AI API error: ${response.statusText}`);
      }

      // Convert response to base64
      const imageBuffer = await response.arrayBuffer();
      const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
      const imageUrl = `data:image/png;base64,${base64Image}`;
      
      console.log('Successfully generated image using Stability AI');
      return { imageUrl, provider: 'stability-ai', prompt };
      
    } catch (error) {
      console.error('Error with Stability AI API:', error);
    }
  }

  // 2. Try Hugging Face API (Secondary - Free)
  const huggingFaceApiKey = Deno.env.get('HUGGING_FACE_API_KEY');
  if (huggingFaceApiKey) {
    try {
      console.log('Trying Hugging Face API...');
      
      const response = await fetch('https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${huggingFaceApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            num_inference_steps: 30,
            guidance_scale: 7.5,
            width: 512,
            height: 512,
            negative_prompt: negativePrompt,
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Hugging Face API error: ${response.status} - ${errorText}`);
        throw new Error(`Hugging Face API error: ${response.statusText}`);
      }

      if (response.headers.get('content-type')?.includes('image')) {
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        console.log('Successfully generated image using Hugging Face');
        return { imageUrl: `data:image/png;base64,${base64}`, provider: 'hugging-face', prompt };
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Unknown error from Hugging Face API');
      }
      
    } catch (error) {
      console.error('Error with Hugging Face API:', error);
    }
  }

  // 3. Try Replicate API (Tertiary - Paid)
  const replicateApiKey = Deno.env.get('REPLICATE_API_KEY');
  if (replicateApiKey) {
    try {
      console.log('Trying Replicate API...');
      
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${replicateApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: "ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4", // Stable Diffusion v1.5
          input: {
            prompt: prompt,
            negative_prompt: negativePrompt,
            width: 512,
            height: 512,
            num_inference_steps: 30,
            guidance_scale: 7.5,
            scheduler: "K_EULER_ANCESTRAL"
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Replicate API error: ${response.status} - ${errorText}`);
        throw new Error(`Replicate API error: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.output && data.output[0]) {
        console.log('Successfully generated image using Replicate');
        return { imageUrl: data.output[0], provider: 'replicate', prompt };
      }
      throw new Error(data.detail || 'Unknown error from Replicate API');
      
    } catch (error) {
      console.error('Error with Replicate API:', error);
    }
  }

  throw new Error('All AI image generation APIs failed or are not configured');
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { name, gender, height, build, eye_color, hair_color, skin_tone, personality_traits, art_style } = await req.json() as CharacterRequest;

    // Try AI image generation APIs
    try {
      console.log('Attempting AI image generation...');
      
      const result = await withRetry(async () => {
        return await tryImageGenerationAPIs({
          name, gender, height, build, eye_color, hair_color, skin_tone, personality_traits, art_style
        });
      });

      return new Response(
        JSON.stringify({ 
          success: true,
          image_url: result.imageUrl,
          model_used: result.provider,
          prompt_used: result.prompt,
          generation_time: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
      
    } catch (aiError) {
      console.error('AI image generation error:', aiError);
      
      // Use fallback image generation based on character attributes
      const fallbackImageUrl = getFallbackImage(gender, art_style);
      
      return new Response(
        JSON.stringify({ 
          success: true,
          image_url: fallbackImageUrl,
          fallback: true,
          message: 'Character created with curated reference image. AI image generation temporarily unavailable.',
          error_details: aiError.message,
          fallback_reason: 'All AI APIs failed or not configured'
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