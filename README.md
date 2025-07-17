# iter8-cli
CLI Tool for Iter8 customers to view and manage feedback

## Setup

### Environment Variables
Create a `.env` file in the root directory with your Supabase credentials:

```env
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

You can find these values in your Supabase project dashboard under Settings > API.
For OpenAI, get your API key from https://platform.openai.com/api-keys

### Database Schema
Make sure your Supabase database has a `feedback` table with the following structure:

```sql
CREATE TABLE feedback (
  id SERIAL PRIMARY KEY,
  startup_name VARCHAR(255) NOT NULL,
  feedback TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_feedback_startup_name ON feedback(startup_name);
```

## Usage

### Development Mode
```bash
npm run feedback
```

### Production Mode
```bash
npm run build
npm run feedback:prod
```

### Global Installation (Optional)
```bash
npm install -g .
iter8-cli
```

### How it Works
1. On first run, you'll be prompted to enter your startup name
2. The CLI will fetch all feedback entries for your startup from the database
3. Feedback is displayed as a numbered list with dates
4. You can use commands to refresh, change startup name, apply feedback as code changes, or quit

### AI-Powered Code Modification
The CLI includes an AI feature that can automatically implement feedback as code changes:

1. **Select Feedback**: Choose which feedback item to apply
2. **AI Analysis**: The system analyzes your codebase and generates specific changes
3. **Preview Changes**: Review exactly what will be modified before applying
4. **Safe Application**: Changes are applied with automatic backups and rollback capability
5. **User Confirmation**: You must explicitly confirm before any changes are made

**Safety Features:**
- Automatic backups before any changes
- Exact content matching to prevent unintended modifications
- Rollback capability if something goes wrong
- Risk level assessment for each change
- User confirmation required for all modifications
