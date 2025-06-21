# UwUverse.ai

A modern AI companion platform built with React, TypeScript, and Supabase. Create personalized AI characters with unique personalities, backstories, and engage in meaningful conversations.

## Features

- **Character Creation**: Design custom AI companions with detailed personalities, appearances, and backstories
- **Intelligent Chat**: Context-aware conversations that remember character traits and shared history
- **Voice Integration**: ElevenLabs voice synthesis for character responses
- **Love Meter System**: Relationship progression tracking
- **Subscription Management**: RevenueCat integration for premium features
- **Responsive Design**: Beautiful UI with dark/light theme support

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **AI Services**: Tavus AI, ElevenLabs
- **State Management**: Zustand
- **Testing**: Vitest, jsdom
- **Deployment**: Netlify

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account
- ElevenLabs API key (optional)
- Tavus API credentials (optional)
- RevenueCat account (optional)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/uwuverse-ai.git
cd uwuverse-ai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Fill in your API keys and Supabase credentials in `.env`.

4. Set up Supabase:
   - Create a new Supabase project
   - Run the migrations in `supabase/migrations/`
   - Deploy the edge functions in `supabase/functions/`

5. Start the development server:
```bash
npm run dev
```

## Environment Variables

Create a `.env` file with the following variables:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_ELEVENLABS_API_KEY=your-elevenlabs-api-key
VITE_REVCAT_API_KEY=your-revenuecat-api-key
```

### Supabase Edge Function Environment Variables

Set these in your Supabase project dashboard under Edge Functions:

- `TAVUS_KEY_PREFIX`: Your Tavus API key prefix
- `TAVUS_SECRET_KEY`: Your Tavus secret key
- `ELEVENLABS_API_KEY`: Your ElevenLabs API key

## Testing

Run the test suite:

```bash
# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── character/      # Character-related components
│   ├── layout/         # Layout components (Navbar, etc.)
│   ├── marketing/      # Marketing components
│   ├── subscription/   # Subscription management
│   ├── theme/          # Theme provider
│   └── ui/             # Basic UI components
├── lib/                # Utility libraries
│   ├── services/       # External service integrations
│   ├── supabase/       # Supabase client and types
│   └── utils.ts        # Utility functions
├── pages/              # Page components
├── stores/             # Zustand state stores
└── main.tsx           # Application entry point

supabase/
├── functions/          # Edge functions
│   ├── ai-service/     # AI chat and character generation
│   └── get-elevenlabs-voices/  # Voice management
└── migrations/         # Database migrations

tests/
├── unit/               # Unit tests
├── integration/        # Integration tests
└── setup.ts           # Test setup and mocks
```

## Key Features Implementation

### AI Context Enhancement

The chat system now includes:
- **Full Character Context**: Backstory, meet-cute scenarios, and appearance details are passed to AI
- **Personality-Driven Responses**: AI responses reflect character traits consistently
- **Memory System**: Chat history and character relationships are maintained
- **Enhanced Fallback**: Local AI response generation when external services are unavailable

### Performance Optimizations

- **Reduced Latency**: Optimized typing delays and API calls
- **Smart Caching**: Character data and voice previews are cached
- **Progressive Loading**: Messages load incrementally for better UX
- **Error Handling**: Graceful fallbacks for all external services

### Testing Strategy

- **Unit Tests**: Individual function and component testing
- **Integration Tests**: Service interaction testing
- **Mocked Dependencies**: External APIs are mocked for reliable testing
- **Coverage Reports**: Comprehensive test coverage tracking

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@uwuverse.ai or join our Discord community.