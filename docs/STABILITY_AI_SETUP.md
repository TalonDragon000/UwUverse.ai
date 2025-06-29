# Stability AI Integration Setup Guide

This guide explains how to set up Stability AI for high-quality AI image generation in UwUverse.ai.

## Why Stability AI?

Stability AI is the company behind Stable Diffusion and offers:
- **High Quality**: State-of-the-art image generation models
- **Style Presets**: Built-in optimizations for different art styles
- **Reliable API**: Professional-grade service with good uptime
- **Reasonable Pricing**: Competitive rates for image generation

## Getting Your API Key

### Step 1: Create Account
1. Go to [Stability AI Platform](https://platform.stability.ai/)
2. Sign up for an account
3. Verify your email address

### Step 2: Add Credits
1. Navigate to the "Billing" section
2. Add credits to your account (minimum $10)
3. Credits are used per image generation

### Step 3: Generate API Key
1. Go to "API Keys" in your dashboard
2. Click "Create New Key"
3. Give it a descriptive name (e.g., "UwUverse Production")
4. Copy the generated key

### Step 4: Add to Environment
Add your API key to the `.env` file:
```bash
STABILITY_AI_API_KEY=sk-your-stability-ai-key-here
```

## Pricing

Stability AI uses a credit-based system:
- **Core Model**: ~3 credits per image (~$0.03)
- **Ultra Model**: ~8 credits per image (~$0.08)
- **Credits**: $10 = 1,000 credits

This is very competitive compared to other AI image services.

## API Features Used

### Core Model
- High-quality image generation
- Fast processing (3-10 seconds)
- Style presets for different art styles
- Negative prompts for better quality

### Style Presets
The integration automatically uses optimal style presets:
- **Anime**: `anime` preset for manga/anime style
- **3D**: `3d-model` preset for realistic 3D renders
- **Comic**: `comic-book` preset for western comic style
- **Realistic**: `photographic` preset for photorealistic images

### Advanced Parameters
- **Aspect Ratio**: 1:1 (square) for character portraits
- **Output Format**: PNG for best quality
- **Negative Prompts**: Automatically filters out unwanted elements
- **Quality Optimization**: Enhanced prompts for better results

## Fallback System

The system tries APIs in this priority order:
1. **Stability AI** (Primary - if API key provided)
2. **Hugging Face** (Secondary - free tier)
3. **Replicate** (Tertiary - pay-per-use)
4. **Reference Images** (Final fallback)

This ensures your app always works, even if one service is down.

## Testing Your Setup

1. Add your `STABILITY_AI_API_KEY` to the environment
2. Deploy the updated Edge Function
3. Create a character in the app
4. Check the browser console for generation logs
5. Verify the generated image quality

## Monitoring Usage

### Check Credits
1. Log into Stability AI Platform
2. Go to "Billing" → "Usage"
3. Monitor credit consumption
4. Set up billing alerts if needed

### Logs and Debugging
Check Supabase Edge Function logs:
1. Supabase Dashboard → Edge Functions
2. Click "ai-image-generation"
3. View logs for detailed generation info

## Optimization Tips

### Prompt Engineering
The system automatically optimizes prompts, but you can enhance by:
- Adding more specific personality traits
- Using detailed appearance descriptions
- Leveraging the art style selection

### Cost Management
- Monitor credit usage regularly
- Set up billing alerts
- Use fallback images for development/testing
- Consider caching generated images

### Quality Improvements
- Use specific personality traits for better expressions
- Detailed appearance options create more accurate results
- Art style selection significantly impacts output quality

## Troubleshooting

### Common Issues

**"Stability AI API error: 401"**
- Check your API key is correct
- Verify the key has proper permissions
- Ensure your account has sufficient credits

**"Stability AI API error: 402"**
- Your account is out of credits
- Add more credits to your Stability AI account
- The system will fallback to other providers

**"Operation timeout"**
- Stability AI is experiencing high load
- The system will retry automatically
- Fallback providers will be used if needed

**"All AI image generation APIs failed"**
- All configured APIs are unavailable
- Check your internet connection
- Verify all API keys are correct
- The system will use reference images as fallback

### Performance Optimization

**Slow Generation Times**
- Stability AI typically takes 3-10 seconds
- High traffic periods may be slower
- The system has a 30-second timeout
- Consider using multiple API providers for redundancy

## Production Recommendations

### For Small Scale (< 100 images/day)
- Use Stability AI as primary
- Add Hugging Face as free backup
- Monitor costs weekly

### For Medium Scale (100-1000 images/day)
- Use Stability AI as primary
- Add Replicate as secondary
- Set up billing alerts
- Monitor usage daily

### For Large Scale (1000+ images/day)
- Use multiple providers for redundancy
- Consider bulk credit purchases for discounts
- Implement image caching
- Monitor costs and usage closely

## Security Best Practices

- Store API keys in environment variables only
- Never commit API keys to version control
- Rotate API keys periodically
- Monitor for unusual usage patterns
- Set up billing alerts to prevent unexpected charges

This setup provides professional-grade AI image generation with excellent fallback options and cost control.