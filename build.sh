#!/bin/bash

# Ensure environment variables are set
if [ -z "$SUPABASE_ANON_KEY" ] || [ -z "$OPENAI_API_KEY" ]; then
  echo "Error: SUPABASE_ANON_KEY and OPENAI_API_KEY must be set"
  exit 1
fi

# Build the binaries
npm run clean
npx tsc

# Bundle with environment variables embedded
npx esbuild dist/cli.js --bundle --platform=node \
  --define:process.env.SUPABASE_ANON_KEY="\"$SUPABASE_ANON_KEY\"" \
  --define:process.env.OPENAI_API_KEY="\"$OPENAI_API_KEY\"" \
  --outfile=dist/bundle.js

# Create platform-specific binaries
npx pkg dist/bundle.js --targets node18-macos-x64 --output iter8-cli-macos
npx pkg dist/bundle.js --targets node18-linux-x64 --output iter8-cli-linux
npx pkg dist/bundle.js --targets node18-win-x64 --output iter8-cli-win.exe

echo "Build completed successfully!" 