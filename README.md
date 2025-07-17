# iter8-cli
CLI Tool for Iter8 customers

A command-line interface for managing tickets and feedback from Supabase.

## Features

- 🔗 Connect to Supabase database
- 📋 List and view tickets
- 🔄 Update ticket status
- 🎨 Beautiful colored output
- ⚡ Fast and efficient

## Installation

```bash
npm install
npm run build
```

## Setup

### 1. Configure Supabase Connection

First, you need to configure your Supabase connection:

```bash
npm run dev tickets configure --url "https://your-project.supabase.co" --key "your-anon-key"
```

You can find your Supabase URL and anon key in your Supabase project settings:
1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the "Project URL" and "anon public" key

### 2. Database Schema

Make sure your Supabase database has a `tickets` table with the following structure:

```sql
CREATE TABLE tickets (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open',
  priority TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Usage

### List Tickets

```bash
npm run dev tickets list
```

Show limited number of tickets:
```bash
npm run dev tickets list --limit 5
```

### View Ticket Details

```bash
npm run dev tickets show <ticket-id>
```

### Update Ticket Status

```bash
npm run dev tickets update-status <ticket-id> <new-status>
```

Example:
```bash
npm run dev tickets update-status 1 "in_progress"
```

### Get Help

```bash
npm run dev --help
npm run dev tickets --help
```

## Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## Configuration

The CLI stores your Supabase configuration in a `config.json` file in the project root. This file is automatically created when you run the configure command.

## Future Features

- Execute ticket actions automatically
- Batch operations
- Ticket creation and editing
- Advanced filtering and search
- Integration with other services
