# iter8-cli
CLI Tool for Iter8 customers

A command-line interface for getting personalized feedback and applying code changes to your startup.

## Features

- 🚀 **Zero Configuration** - Just provide your startup name
- 📋 **Personalized Feedback** - Get feedback specific to your startup
- 🔄 **Apply Code Changes** - Automatically generate and apply improvements
- 🎨 **Beautiful Interface** - Modern CLI with colored output
- ⚡ **Fast and Efficient** - Powered by Iter8's infrastructure

## Installation

### Global Installation (Recommended)
```bash
npm install -g iter8-cli
```

### From Source
```bash
git clone <repository-url>
cd iter8-cli
npm install
npm run build
```

## Usage

### Quick Start
```bash
# Install globally
npm install -g iter8-cli

# Run the CLI
iter8

# Enter your startup name when prompted
# The CLI will fetch your personalized feedback
```

### Interactive Commands

Once you're in the CLI, you can use these commands:

- **refresh** - Fetch latest feedback for your startup
- **change** - Change your startup name
- **apply** - Apply feedback as code changes
- **revert** - Revert applied changes
- **quit** - Exit the application

### Example Session
```bash
$ iter8

  ___  _____  _____  _____  _____  ___  ___ 
 |_ _||_   _||_   _||_   _||_   _||_ _||_ _|
  | |  | |    | |    | |    | |   | |  | |  
  | |  | |    | |    | |    | |   | |  | |  
 |___| |_|    |_|    |_|    |_|   |_|  |_|  

TODOS
1. Improve user authentication flow
2. Add better error handling for API calls
3. Optimize database queries for better performance

Commands:
  refresh - Fetch latest feedback
  change  - Change startup name
  apply   - Apply feedback as code changes
  revert  - Revert applied changes
  quit    - Exit the application

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ > apply                                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘

📋 Select todos to apply:
(Enter numbers separated by commas, or "all" or "cancel")

Available options:
  1. Improve user authentication flow
  2. Add better error handling for API calls
  3. Optimize database queries for better performance
  all - Apply all todos
  cancel - Cancel selection

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ > 1,2                                                                                               │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘

🚀 Generating code changes for selected todos...
✅ Generated 2 code change(s)

Do you want to apply these changes?
  accept - Apply all changes
  review - Review changes first
  cancel - Cancel application
```

## How It Works

1. **No Configuration Required** - Iter8 provides the backend infrastructure
2. **Startup-Specific Feedback** - Get feedback tailored to your startup
3. **AI-Powered Improvements** - Automatically generate code changes
4. **Safe Application** - Review and apply changes safely

## Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## Architecture

- **Supabase Backend** - Provided by Iter8 (no user configuration needed)
- **OpenAI Integration** - Powered by Iter8's API keys
- **Personalized Experience** - Based on startup name
- **Safe Code Changes** - Review before applying

## Future Features

- Execute ticket actions automatically
- Batch operations
- Advanced filtering and search
- Integration with other services
- Team collaboration features
