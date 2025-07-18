# iter8-cli v1.0.1 - Self-Contained Release

## 🚀 What's New

This release makes iter8-cli completely self-contained with embedded configuration. No setup required!

### ✨ Features
- **Zero Configuration**: Download and run - no environment variables needed
- **Embedded API Keys**: Supabase and OpenAI keys are built into the binary
- **Cross-Platform**: Binaries for macOS, Linux, and Windows
- **Personalized Feedback**: Get startup-specific feedback from Iter8
- **AI-Powered Code Changes**: Generate and apply code improvements

### 🔧 Technical Improvements
- Fixed environment variable embedding during build
- Improved error handling and validation
- Cleaned up TypeScript compilation errors
- Better user experience with clear prompts

## 📦 Installation

### Download Pre-built Binary
1. Download the appropriate binary for your platform:
   - **macOS**: `iter8-cli-macos`
   - **Linux**: `iter8-cli-linux`
   - **Windows**: `iter8-cli-win.exe`

2. Make executable (macOS/Linux only):
   ```bash
   chmod +x iter8-cli-macos  # or iter8-cli-linux
   ```

3. Run:
   ```bash
   ./iter8-cli-macos  # or appropriate binary
   ```

## 🔐 Security

All API keys are embedded during build time and are not exposed to end users. The binaries are self-contained and don't require any external configuration.

## 📋 Usage

1. Run the binary
2. Enter your startup name when prompted
3. View your personalized feedback
4. Use commands:
   - `refresh` - Get latest feedback
   - `apply` - Generate and apply code changes
   - `change` - Change startup name
   - `quit` - Exit

## 🐛 Bug Fixes
- Fixed "Supabase not configured" errors
- Fixed OpenAI API key not found errors
- Improved binary packaging and distribution

## 📊 File Checksums (SHA256)

```
8772db9e5cf70c612257e1044a62e950df0b64321332efce33f4648d4e2e286d  iter8-cli-linux
0be11487fca7dd94166f18ec7f233d4cb512a611494ed60fd36f06afe757fcf5  iter8-cli-macos
268ba30793b49555f29433e27eb7256afb2e7fb5bc34a19a63c77ce5a874cc62  iter8-cli-win.exe
```

## 🔄 What's Next
- Enhanced code generation capabilities
- Better error handling and user feedback
- Additional platform support
- Integration with more development tools 