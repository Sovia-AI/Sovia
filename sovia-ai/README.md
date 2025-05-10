# Sovia-GitHub Backend

## Overview

**Sovia-GitHub** is a backend-only extraction of the Sovia AI agent and analysis framework. It provides advanced agent chat, market/crypto analysis, and a wide range of integrations (Solana, Birdeye, Coingecko, Twitter, Weather, Petfinder, and more) via a simple CLI—no frontend required.

## Features
- **Agent Chat**: Interact with the Sovia agent in your terminal.
- **Market & Token Analysis**: Run technical, fundamental, and overview analyses on any supported token or market.
- **All Integrations Included**: Weather, Twitter, Birdeye, Coingecko, Solana, Petfinder, and more.
- **Extensible**: Easily add new integrations, plugins, or analysis modules.

## Installation

1. **Clone this repository or copy the `sovia-github` folder.**
2. Install dependencies:
   ```sh
   npm install
   # or
   yarn install
   ```
3. Build the project:
   ```sh
   npm run build
   ```

## API Key Setup

Set your API keys as environment variables. Example (in `.env` or your shell):

```
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
PERPLEXITY_API_KEY=your-perplexity-key
GEMINI_API_KEY=your-gemini-key
BIRDEYE_API_KEY=your-birdeye-key
WEATHERAPI_KEY=your-weatherapi-key
PETFINDER_API_KEY=your-petfinder-key
PETFINDER_SECRET=your-petfinder-secret
RAYDIUM_API_KEY=your-raydium-key
PUMPFUN_API_KEY=your-pumpfun-key
```

You can use a `.env` file with [dotenv](https://www.npmjs.com/package/dotenv) if desired.

## CLI Usage

### Start Agent Chat
```
npm run cli chat
# or
node cli.js chat
```
You will enter an interactive session with the Sovia agent.

### Run Market/Token Analysis
```
npm run cli analyze -- --query "analyze SOL"
# or
node cli.js analyze --query "analyze SOL"
```

### CLI Help
```
node cli.js --help
```

## Extending/Adding Integrations
- Add new modules to `lib/integrations/` and expose them in `lib/index.ts`.
- Register new commands or capabilities in `cli.ts`.
- All core logic is modular and can be extended for new APIs, plugins, or services.

## License
MIT 