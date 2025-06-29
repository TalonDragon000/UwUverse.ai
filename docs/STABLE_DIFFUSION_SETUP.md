# Stable Diffusion API Setup Guide

This guide explains how to set up free/open-source AI image generation using Stable Diffusion APIs as an alternative to OpenAI's DALL-E.

## Available API Providers

### 1. Hugging Face (Recommended - Free Tier Available)

**Pros:**
- Free tier with generous limits
- Multiple Stable Diffusion models available
- Easy to set up
- Good documentation

**Setup:**
1. Go to [Hugging Face](https://huggingface.co/)
2. Create a free account
3. Go to Settings → Access Tokens
4. Create a new token with "Read" permissions
5. Add to your environment: `HUGGING_FACE_API_KEY=your_token_here`

**Free Tier Limits:**
- 1,000 requests per month
- Rate limited but sufficient for development
- No credit card required

### 2. Replicate (Paid but Affordable)

**Pros:**
- High-quality models
- Fast generation
- Reliable service
- Pay-per-use pricing

**Setup:**
1. Go to [Replicate](https://replicate.com/)
2. Create an account
3. Go to Account → API Tokens
4. Create a new token
5. Add to your environment: `REPLICATE_API_KEY=your_token_here`

**Pricing:**
- ~$0.0023 per image generation
- No monthly fees
- Credit card required

## Environment Variables Setup

Add these to your `.env` file (choose one or both):

```bash
# Hugging Face (Free)
HUGGING_FACE_API_KEY=hf_your_token_here

# Replicate (Paid)
REPLICATE_API_KEY=r8_your_token_here
```

## How It Works

The system tries APIs in this order:
1. **Hugging Face** (if API key is provided)
2. **Replicate** (if API key is provided)
3. **Fallback** to curated reference images

## Prompt Engineering

The system automatically optimizes prompts for each art style:

### Anime Style
- Uses anime-specific keywords: "anime style, manga style, cel shaded"
- Emphasizes: large eyes, vibrant colors, kawaii aesthetic
- Quality tags: "high quality anime art, studio quality"

### 3D Style
- Uses 3D-specific keywords: "3d render, digital art, cgi"
- Emphasizes: realistic rendering, soft lighting, detailed textures
- Quality tags: "octane render, unreal engine, photorealistic 3d"

### Comic Book Style
- Uses comic-specific keywords: "comic book style, western comic art"
- Emphasizes: bold lines, dynamic poses, heroic proportions
- Quality tags: "marvel style, dc comics style"

### Realistic Style
- Uses realism keywords: "photorealistic, realistic portrait"
- Emphasizes: natural proportions, realistic textures
- Quality tags: "photorealistic, high resolution, professional portrait"

## Testing Your Setup

1. Set up your API keys in the environment
2. Create a character in the app
3. Check the browser console for generation logs
4. If generation fails, it will fallback to reference images

## Troubleshooting

### Common Issues

**"All Stable Diffusion APIs failed"**
- Check that at least one API key is correctly set
- Verify API key permissions and quotas
- Check network connectivity

**"Hugging Face model loading"**
- Some models need to "warm up" on first use
- Wait 20-30 seconds and try again
- This only happens on the first request

**"Rate limit exceeded"**
- You've hit the API's rate limits
- Wait a few minutes and try again
- Consider upgrading to a paid tier

### Logs and Debugging

Check the Supabase Edge Function logs:
1. Go to Supabase Dashboard
2. Navigate to Edge Functions
3. Click on "ai-image-generation"
4. Check the logs for detailed error messages

## Alternative Self-Hosted Options

For complete control and no API costs, you can self-host Stable Diffusion:

### Option 1: Automatic1111 WebUI
- Install [Automatic1111](https://github.com/AUTOMATIC1111/stable-diffusion-webui)
- Enable API mode with `--api` flag
- Update the function to call your local endpoint

### Option 2: ComfyUI
- Install [ComfyUI](https://github.com/comfyanonymous/ComfyUI)
- Set up API endpoints
- More advanced but very powerful

### Option 3: Ollama with SDXL
- Use [Ollama](https://ollama.ai/) for local AI models
- Install SDXL model locally
- Completely offline solution

## Cost Comparison

| Provider | Free Tier | Paid Pricing | Setup Difficulty |
|----------|-----------|--------------|------------------|
| Hugging Face | 1,000/month | N/A | Easy |
| Replicate | $5 credit | ~$0.002/image | Easy |
| Self-hosted | Unlimited | Hardware costs | Advanced |
| OpenAI DALL-E | N/A | ~$0.04/image | Easy |

## Recommended Setup

For development and testing:
1. Start with **Hugging Face** free tier
2. Add **Replicate** for production use
3. Consider self-hosting for high volume

This gives you a robust fallback system with minimal costs.