import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logError } from '../utils/logger.js';

export interface Ticket {
  id: number;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  created_at?: string;
  updated_at?: string;
  // Flexible interface to work with any schema
  [key: string]: any;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

class SupabaseService {
  private client: SupabaseClient | null = null;
  private config: SupabaseConfig | null = null;

  async initialize(config: SupabaseConfig): Promise<void> {
    try {
      this.config = config;
      this.client = createClient(config.url, config.anonKey);
      
      // Test the connection with a simple query
      const { error } = await this.client.from('_dummy_test_').select('*').limit(1);
      // We expect this to fail, but it will tell us if the connection works
      if (error && !error.message.includes('does not exist')) {
        throw new Error(`Failed to connect to Supabase: ${error.message}`);
      }
    } catch (error) {
      logError('Failed to initialize Supabase client:', error);
      throw error;
    }
  }

  async getTickets(): Promise<Ticket[]> {
    if (!this.client) {
      throw new Error('Supabase client not initialized. Call initialize() first.');
    }

    try {
      // Try different possible table names
      const possibleTables = ['tickets', 'feedback', 'issues', 'requests', 'tasks'];
      
      for (const tableName of possibleTables) {
        try {
          const { data, error } = await this.client
            .from(tableName)
            .select('*')
            .limit(5);

          if (!error && data) {
            console.log(`Found table: ${tableName}`);
            return data || [];
          }
        } catch (err) {
          // Continue to next table
        }
      }
      
      // If no tables found, let's discover what tables exist
      const { data: tables, error: tablesError } = await this.client
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

      if (!tablesError && tables) {
        const availableTables = tables.map((t: any) => t.table_name).join(', ');
        throw new Error(`No ticket table found. Available tables: ${availableTables}`);
      }

      throw new Error('Failed to fetch tickets: No suitable table found');
    } catch (error) {
      logError('Failed to fetch tickets:', error);
      throw error;
    }
  }

  async getTicketById(id: number): Promise<Ticket | null> {
    if (!this.client) {
      throw new Error('Supabase client not initialized. Call initialize() first.');
    }

    try {
      const { data, error } = await this.client
        .from('tickets')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No rows returned
        }
        throw new Error(`Failed to fetch ticket: ${error.message}`);
      }

      return data;
    } catch (error) {
      logError('Failed to fetch ticket:', error);
      throw error;
    }
  }

  async updateTicketStatus(id: number, status: string): Promise<void> {
    if (!this.client) {
      throw new Error('Supabase client not initialized. Call initialize() first.');
    }

    try {
      // Try different possible table names
      const possibleTables = ['tickets', 'feedback', 'issues', 'requests', 'tasks'];
      
      for (const tableName of possibleTables) {
        try {
          const { error } = await this.client
            .from(tableName)
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id);

          if (!error) {
            return;
          }
        } catch (err) {
          // Continue to next table
        }
      }
      
      throw new Error('Failed to update ticket: No suitable table found');
    } catch (error) {
      logError('Failed to update ticket:', error);
      throw error;
    }
  }

  async discoverTables(): Promise<string[]> {
    if (!this.client) {
      throw new Error('Supabase client not initialized. Call initialize() first.');
    }

    try {
      // Try common table names that might exist
      const commonTables = [
        'tickets', 'feedback', 'issues', 'requests', 'tasks', 
        'support', 'help', 'bugs', 'features', 'ideas',
        'posts', 'comments', 'messages', 'notifications'
      ];
      
      const foundTables: string[] = [];
      
      for (const tableName of commonTables) {
        try {
          const { data, error } = await this.client
            .from(tableName)
            .select('*')
            .limit(1);

          if (!error && data !== null) {
            foundTables.push(tableName);
          }
        } catch (err) {
          // Table doesn't exist, continue
        }
      }
      
      return foundTables;
    } catch (error) {
      logError('Failed to discover tables:', error);
      throw error;
    }
  }

  async getTableStructure(tableName: string): Promise<any[]> {
    if (!this.client) {
      throw new Error('Supabase client not initialized. Call initialize() first.');
    }

    try {
      // Get a sample record to infer structure
      const { data, error } = await this.client
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        throw new Error(`Failed to get table structure: ${error.message}`);
      }

      if (data && data.length > 0) {
        const sample = data[0];
        return Object.keys(sample).map(key => ({
          column_name: key,
          data_type: typeof sample[key],
          is_nullable: sample[key] === null ? 'YES' : 'NO'
        }));
      }

      return [];
    } catch (error) {
      logError('Failed to get table structure:', error);
      throw error;
    }
  }

  async getFeedbackByStartupName(startupName: string): Promise<string[]> {
    if (!this.client) {
      throw new Error('Supabase client not initialized. Call initialize() first.');
    }
    try {
      const { data, error } = await this.client
        .from('feedback')
        .select('feedback')
        .eq('startup_name', startupName);

      if (error) {
        throw new Error(`Failed to fetch feedback: ${error.message}`);
      }

      // Return array of feedback strings, filtering out null/empty values
      return data?.map(row => row.feedback).filter(feedback => feedback && feedback.trim() !== '') || [];
    } catch (error) {
      logError('Failed to fetch feedback:', error);
      throw error;
    }
  }
}

export const supabaseService = new SupabaseService(); 