#!/usr/bin/env node

/**
 * Chat Feature Setup Verification Script
 * 
 * This script verifies that the chat feature is properly set up
 * by checking database schema and connectivity
 */

import { createClient } from '@supabase/supabase-js';

// Use the same configuration as your app
const supabaseUrl = 'https://dvdhllhdbbybixwhtgnm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2ZGhsbGhkYmJ5Yml4d2h0Z25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3OTYzNDUsImV4cCI6MjA2ODM3MjM0NX0.ERqUze9EpJz30V1M7vtnyd750KzWBJod7fSguvFA40c';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifySetup() {
  console.log('🔍 Verifying chat feature setup...\n');

  try {
    // Test basic connectivity
    console.log('1. Testing Supabase connectivity...');
    const { data: testData, error: testError } = await supabase
      .from('reports')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.log('❌ Connection failed:', testError.message);
      return false;
    }
    console.log('✅ Supabase connection successful');

    // Check if report_updates table exists and has required columns
    console.log('\n2. Checking report_updates table structure...');
    const { data: updates, error: updatesError } = await supabase
      .from('report_updates')
      .select('id, reply_to_message_id, is_read_by_reporter, is_read_by_admin')
      .limit(1);
    
    if (updatesError) {
      console.log('❌ report_updates table check failed:', updatesError.message);
      console.log('💡 You may need to run the database migration first');
      return false;
    }
    console.log('✅ report_updates table has required columns');

    // Test real-time subscriptions
    console.log('\n3. Testing real-time subscriptions...');
    const channel = supabase
      .channel('test-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'report_updates' }, 
        () => {}
      )
      .subscribe();

    // Wait a moment for subscription to establish
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (channel.state === 'SUBSCRIBED') {
      console.log('✅ Real-time subscriptions working');
      await supabase.removeChannel(channel);
    } else {
      console.log('⚠️  Real-time subscriptions may not be working properly');
      console.log('   Current state:', channel.state);
    }

    // Check if mark_messages_as_read function exists
    console.log('\n4. Testing database functions...');
    try {
      const { error: funcError } = await supabase.rpc('mark_messages_as_read', {
        p_report_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        p_reader_id: null
      });
      
      // We expect this to not find any messages, but the function should exist
      if (funcError && !funcError.message.includes('function mark_messages_as_read')) {
        console.log('✅ mark_messages_as_read function exists');
      } else if (funcError && funcError.message.includes('does not exist')) {
        console.log('❌ mark_messages_as_read function not found');
        console.log('💡 Database migration may not have run completely');
      } else {
        console.log('✅ mark_messages_as_read function exists and working');
      }
    } catch (e) {
      console.log('⚠️  Could not test database functions:', e.message);
    }

    console.log('\n🎉 Setup verification completed!');
    console.log('\n📋 Next steps:');
    console.log('   1. Start your development server: npm run dev');
    console.log('   2. Test the chat feature in both reporter and admin interfaces');
    console.log('   3. Open multiple browser tabs to test real-time messaging');
    
    return true;

  } catch (error) {
    console.log('❌ Verification failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check your Supabase project is running');
    console.log('   2. Verify your database credentials');
    console.log('   3. Run the database migration: node run-migration.js');
    console.log('   4. Check Supabase dashboard for any issues');
    
    return false;
  }
}

// Run verification if called directly
verifySetup().then(success => {
  process.exit(success ? 0 : 1);
});

export { verifySetup };
