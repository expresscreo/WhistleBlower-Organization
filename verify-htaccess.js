#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Checking .htaccess file status...\n');

const distPath = path.join(__dirname, 'dist');
const publicPath = path.join(__dirname, 'public');

// Check if dist/.htaccess exists
const distHtaccess = path.join(distPath, '.htaccess');
const publicHtaccess = path.join(publicPath, '.htaccess');

console.log('📁 File locations:');
console.log(`   Public: ${publicHtaccess}`);
console.log(`   Dist:   ${distHtaccess}\n`);

// Check public/.htaccess
if (fs.existsSync(publicHtaccess)) {
    console.log('✅ public/.htaccess exists');
    const publicContent = fs.readFileSync(publicHtaccess, 'utf8');
    console.log(`   Size: ${publicContent.length} bytes`);
} else {
    console.log('❌ public/.htaccess missing');
}

// Check dist/.htaccess
if (fs.existsSync(distHtaccess)) {
    console.log('✅ dist/.htaccess exists');
    const distContent = fs.readFileSync(distHtaccess, 'utf8');
    console.log(`   Size: ${distContent.length} bytes`);
    
    // Verify content
    if (distContent.includes('RewriteEngine On') && distContent.includes('RewriteRule ^ index.html')) {
        console.log('✅ .htaccess content looks correct');
    } else {
        console.log('⚠️  .htaccess content might be incorrect');
    }
} else {
    console.log('❌ dist/.htaccess missing');
    
    // Try to copy from public
    if (fs.existsSync(publicHtaccess)) {
        console.log('📋 Copying .htaccess from public to dist...');
        fs.copyFileSync(publicHtaccess, distHtaccess);
        console.log('✅ Copied successfully');
    }
}

// Check htaccess.txt backup
const backupHtaccess = path.join(distPath, 'htaccess.txt');
if (fs.existsSync(backupHtaccess)) {
    console.log('✅ htaccess.txt backup exists');
} else {
    console.log('📋 Creating htaccess.txt backup...');
    if (fs.existsSync(distHtaccess)) {
        fs.copyFileSync(distHtaccess, backupHtaccess);
        console.log('✅ Backup created');
    }
}

console.log('\n📋 Next steps:');
console.log('1. Upload the entire dist/ folder contents to your production server');
console.log('2. Make sure .htaccess is in the root directory of your website');
console.log('3. Verify mod_rewrite is enabled on your hosting');
console.log('4. Test by refreshing any page on your website');

console.log('\n🔗 Alternative: If .htaccess doesn\'t work, use index.php fallback');
console.log('   (index.php is already created in dist/ folder)');
