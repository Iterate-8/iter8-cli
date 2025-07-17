import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface Feedback {
  id: number;
  startup_name: string;
  feedback: string;
  created_at: string;
}

export class SupabaseService {
  /**
   * Fetch feedback for a specific startup name
   * @param startupName The name of the startup
   * @returns Array of feedback entries
   */
  static async getFeedbackByStartup(startupName: string): Promise<Feedback[]> {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('id, startup_name, feedback, created_at')
        .eq('startup_name', startupName)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      return data || [];
    } catch (err) {
      throw new Error(`Failed to fetch feedback: ${(err as Error).message}`);
    }
  }

  /**
   * Get all unique startup names from the feedback table
   * @returns Array of startup names
   */
  static async getStartupNames(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('startup_name')
        .order('startup_name');

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      // Extract unique startup names
      const uniqueNames = [...new Set(data?.map(item => item.startup_name) || [])];
      return uniqueNames;
    } catch (err) {
      throw new Error(`Failed to fetch startup names: ${(err as Error).message}`);
    }
  }
} 