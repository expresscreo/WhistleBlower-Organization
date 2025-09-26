/**
 * Migration script to fix bounty report evidence paths
 * This script downloads files from Supabase storage and uploads them to local WBMedia storage
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://dvdhllhdbbybixwhtgnm.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateBountyEvidence() {
    console.log('🔄 Starting bounty evidence migration...');
    
    try {
        // Get all reports with category 'Bounty' that have Supabase evidence paths
        const { data: reports, error } = await supabase
            .from('reports')
            .select('id, report_id, evidence_path, category')
            .eq('category', 'Bounty')
            .not('evidence_path', 'is', null);
            
        if (error) {
            console.error('❌ Error fetching reports:', error);
            return;
        }
        
        console.log(`📋 Found ${reports.length} bounty reports to migrate`);
        
        for (const report of reports) {
            console.log(`\n🔍 Processing report ${report.report_id}...`);
            
            if (!Array.isArray(report.evidence_path)) {
                console.log('⏭️  Skipping - no evidence paths');
                continue;
            }
            
            const newPaths = [];
            
            for (const evidencePath of report.evidence_path) {
                console.log(`📁 Processing evidence: ${evidencePath}`);
                
                // Check if it's a Supabase path
                if (evidencePath.includes('reports/') && evidencePath.includes('wb_evio')) {
                    try {
                        // Download file from Supabase
                        const { data: fileData, error: downloadError } = await supabase.storage
                            .from('wb_evio')
                            .download(evidencePath);
                            
                        if (downloadError) {
                            console.error(`❌ Failed to download ${evidencePath}:`, downloadError);
                            continue;
                        }
                        
                        // Convert blob to buffer
                        const arrayBuffer = await fileData.arrayBuffer();
                        const buffer = Buffer.from(arrayBuffer);
                        
                        // Extract filename
                        const fileName = evidencePath.split('/').pop();
                        
                        // Create local path
                        const localPath = `WBMedia/bounties/delito/${fileName}`;
                        
                        // Ensure directory exists
                        const dir = path.dirname(localPath);
                        if (!fs.existsSync(dir)) {
                            fs.mkdirSync(dir, { recursive: true });
                        }
                        
                        // Write file locally
                        fs.writeFileSync(localPath, buffer);
                        
                        console.log(`✅ Migrated: ${evidencePath} → ${localPath}`);
                        newPaths.push(localPath);
                        
                    } catch (error) {
                        console.error(`❌ Error migrating ${evidencePath}:`, error);
                    }
                } else {
                    // Already a local path, keep as is
                    newPaths.push(evidencePath);
                }
            }
            
            // Update report with new paths
            if (newPaths.length > 0) {
                const { error: updateError } = await supabase
                    .from('reports')
                    .update({ evidence_path: newPaths })
                    .eq('id', report.id);
                    
                if (updateError) {
                    console.error(`❌ Failed to update report ${report.report_id}:`, updateError);
                } else {
                    console.log(`✅ Updated report ${report.report_id} with ${newPaths.length} local paths`);
                }
            }
        }
        
        console.log('\n🎉 Migration completed!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
}

// Run migration
migrateBountyEvidence();
