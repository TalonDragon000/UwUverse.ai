# Hugging Face API Setup Guide

This guide explains how to set up Hugging Face for AI chat functionality in UwUverse.ai.

## What is Hugging Face?

Hugging Face is a leading platform for machine learning models, offering:
- **Free Tier**: Generous limits for development and testing
- **High-Quality Models**: Access to state-of-the-art conversational AI models
- **Easy Integration**: Simple REST API for text generation
- **No Credit Card Required**: Get started immediately with free tier

## Getting Your API Key

### Step 1: Create Account
1. Go to [Hugging Face](https://huggingface.co/)
2. Click "Sign Up" and create a free account
3. Verify your email address

### Step 2: Generate Access Token
1. Go to your [Settings page](https://huggingface.co/settings/tokens)
2. Click "New token"
3. Give it a descriptive name (e.g., "UwUverse AI Chat")
4. Select "Read" permissions (sufficient for inference)
5. Click "Generate a token"
6. Copy the token (starts with `hf_`)

### Step 3: Add to Environment
Add your token to the `.env` file:
```bash
HUGGING_FACE_API_KEY=hf_your_token_here
```

## Free Tier Limits

Hugging Face offers generous free limits:
- **1,000 requests per month** for most models
- **Rate limiting**: ~1 request per second
- **No credit card required**
- **Model loading time**: First request may take 20-30 seconds

## Models Used

### Primary: microsoft/DialoGPT-medium
- **Purpose**: Conversational AI optimized for dialogue
- **Quality**: Good balance of quality and speed
- **Context**: Handles multi-turn conversations well
- **Size**: Medium model for reasonable response times

### Fallback Options
If the primary model fails, the system can use:
- `microsoft/DialoGPT-large` (higher quality, slower)
- `facebook/blenderbot-400M-distill` (faster, lighter)
- `microsoft/DialoGPT-small` (fastest, basic quality)

## How the 3-Layer System Works

The AI chat uses a robust fallback system:

### Layer 1: OpenAI GPT-3.5 Turbo (Preferred)
- **When**: If `OPENAI_API_KEY` is configured
- **Quality**: Highest quality responses
- **Cost**: ~$0.002 per 1K tokens
- **Speed**: 2-5 seconds

### Layer 2: Hugging Face (Primary Free Option)
- **When**: If OpenAI fails or isn't configured
- **Quality**: Good conversational responses
- **Cost**: Free (with limits)
- **Speed**: 3-10 seconds (first request may be slower)

### Layer 3: Local Fallback (Always Available)
- **When**: All APIs fail or aren't configured
- **Quality**: Basic rule-based responses
- **Cost**: Free
- **Speed**: Instant

## Testing Your Setup

1. Add your `HUGGING_FACE_API_KEY` to the environment
2. Create a character in the app
3. Start a chat conversation
4. Check the browser console for logs:
   ```
   Attempting Hugging Face API...
   Hugging Face API successful in 3500ms
   ```

## Optimizing Performance

### Model Warm-up
- First request to a model takes 20-30 seconds (model loading)
- Subsequent requests are much faster (2-5 seconds)
- Consider making a "warm-up" request during app initialization

### Prompt Engineering
The system automatically optimizes prompts for Hugging Face:
```
You are Alice, a female AI companion with the following traits: shy, caring.
Your backstory: A kind person who loves helping others.
You met the user through: coffee shop.

Conversation:
Human: Hi there!
Alice: H-hi... I'm a bit nervous but happy to meet you.
Human: How are you?
Alice:
```

### Response Cleaning
The system automatically cleans responses:
- Removes repeated prompt text
- Filters out artifacts like "Human:" or "Assistant:"
- Ensures minimum response length
- Handles malformed responses gracefully

## Troubleshooting

### Common Issues

**"Model is loading, please wait"**
- First request to a model needs to load it into memory
- Wait 20-30 seconds and try again
- This only happens once per model per day

**"Rate limit exceeded"**
- You've hit the 1,000 requests/month limit
- Wait until next month or upgrade to Pro
- System will fallback to local responses

**"Invalid API key"**
- Check your token is correct and starts with `hf_`
- Verify token has "Read" permissions
- Make sure it's properly set in environment variables

**"Model not found"**
- The specified model doesn't exist or is private
- Check model name spelling
- Ensure model supports text generation

### Performance Issues

**Slow Response Times**
- First request is always slower (model loading)
- High traffic periods may be slower
- Consider using smaller models for faster responses

**Empty or Short Responses**
- Model may need better prompting
- Try adjusting the prompt format
- Check if model is appropriate for conversation

## Advanced Configuration

### Custom Models
You can modify the Edge Function to use different models:

```typescript
const hfModel = 'microsoft/DialoGPT-large'; // Higher quality
// or
const hfModel = 'facebook/blenderbot-400M-distill'; // Faster
```

### Response Parameters
Adjust generation parameters for different styles:

```typescript
parameters: {
  max_new_tokens: 100,        // Response length
  temperature: 0.8,           // Creativity (0.1-1.0)
  do_sample: true,           // Enable sampling
  top_p: 0.9,               // Nucleus sampling
  repetition_penalty: 1.1,   // Avoid repetition
}
```

### Monitoring Usage
Track your usage:
1. Go to [Hugging Face Settings](https://huggingface.co/settings/billing)
2. Check "Usage" section
3. Monitor requests per month
4. Set up alerts if approaching limits

## Production Recommendations

### For Development
- Use Hugging Face free tier
- Test with different personality types
- Monitor response quality and speed

### For Production
- Consider Hugging Face Pro for higher limits
- Implement response caching for common queries
- Use multiple models for redundancy
- Monitor API health and fallback usage

### Scaling Considerations
- Free tier: Good for up to 1,000 conversations/month
- Pro tier: $9/month for higher limits
- Enterprise: Custom solutions for high volume

## Cost Comparison

| Provider | Free Tier | Paid Pricing | Quality | Speed |
|----------|-----------|--------------|---------|-------|
| Hugging Face | 1,000/month | $9/month Pro | Good | 3-10s |
| OpenAI | $5 credit | ~$0.002/1K tokens | Excellent | 2-5s |
| Local Fallback | Unlimited | Free | Basic | Instant |

## Security Best Practices

- Store API tokens in environment variables only
- Never commit tokens to version control
- Use "Read" permissions only (sufficient for inference)
- Rotate tokens periodically
- Monitor for unusual usage patterns

This setup provides reliable, cost-effective AI chat functionality with excellent fallback options.