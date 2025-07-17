# iter8-cli
CLI Tool for Iter8 customers

A command-line interface for getting personalized feedback and applying code changes to your startup.

## Features

- 🚀 **Zero Configuration** - Just download and run
- 📋 **Personalized Feedback** - Get feedback specific to your startup
- 🔄 **Apply Code Changes** - Automatically generate and apply improvements
- 🎨 **Beautiful Interface** - Modern CLI with colored output
- ⚡ **Fast and Efficient** - Powered by Iter8's infrastructure

## Installation

### Download Pre-built Binary (Recommended)
Download the appropriate binary for your platform:
- macOS: `iter8-cli-macos`
- Linux: `iter8-cli-linux`
- Windows: `iter8-cli-win.exe`

Make the binary executable (macOS/Linux only):
```bash
chmod +x iter8-cli-macos  # or iter8-cli-linux
```

Run the CLI:
```bash
./iter8-cli-macos  # or ./iter8-cli-linux or iter8-cli-win.exe
```

### Building from Source
If you want to build from source, you'll need:
- Node.js 18+
- npm
- `.env` file with required keys:
  ```
  SUPABASE_ANON_KEY=your-key
  OPENAI_API_KEY=your-key
  ```

Then:
```bash
# Clone the repository
git clone <repository-url>
cd iter8-cli

# Install dependencies
npm install

# Build the binaries
./build.sh
```

## Usage

Just run the CLI and follow the prompts:

```bash
./iter8-cli-macos  # or appropriate binary for your platform
```

### Available Commands

- **refresh** - Fetch latest feedback for your startup
- **change** - Change your startup name
- **apply** - Apply feedback as code changes
- **revert** - Revert applied changes
- **quit** - Exit the application

## Architecture

- **Supabase Backend** - Stores feedback and startup data
- **OpenAI Integration** - Powers intelligent code changes
- **Embedded Configuration** - No setup needed
- **Safe Code Changes** - Review before applying

## Development

The project uses:
- TypeScript for type safety
- esbuild for bundling
- pkg for creating standalone binaries
- Supabase for backend storage
- OpenAI for AI-powered changes

### Build Process

The build process:
1. Embeds all necessary configuration
2. Bundles the TypeScript code
3. Creates standalone binaries for all platforms
4. No runtime configuration needed

### Adding New Features

1. Add new commands in `src/commands/`
2. Update services in `src/services/`
3. Run `./build.sh` to create new binaries

## License

MIT
