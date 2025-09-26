#!/usr/bin/env node

/**
 * Migration script to add password_salt columns to the database
 * This fixes the "Could not find the 'password_salt' column" error
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase configuration
const supabaseUrl = 'https://dvdhllhdbbybixwhtgnm.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key-here';

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    try {
        console.log('🚀 Starting password salt migration...');
        
        // Read the migration SQL file
        const migrationPath = join(__dirname, 'database_migrations', 'add_password_salt_columns.sql');
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        
        console.log('📄 Migration SQL loaded');
        
        // Execute the migration
        const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
        
        if (error) {
            console.error('❌ Migration failed:', error);
            process.exit(1);
        }
        
        console.log('✅ Migration completed successfully!');
        console.log('📋 Changes made:');
        console.log('  - Added password_salt column to bounties table');
        console.log('  - Added anonymous_password_salt column to reports table');
        console.log('  - Updated create_report_with_evidence function');
        
    } catch (error) {
        console.error('❌ Migration error:', error);
        process.exit(1);
    }
}

// Run the migration
runMigration();
