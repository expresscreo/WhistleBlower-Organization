#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🎨 WhistleBlower Logo Setup Helper\n');

const wbMediaPath = path.join(__dirname, 'public', 'WBMedia', 'general');

console.log('📁 Current Logo Files in WBMedia/general/:');
if (fs.existsSync(wbMediaPath)) {
  const files = fs.readdirSync(wbMediaPath);
  const logoFiles = files.filter(file => 
    file.toLowerCase().includes('logo') || 
    file.toLowerCase().includes('whistleblower') ||
    file.toLowerCase().includes('banner')
  );
  
  logoFiles.forEach(file => {
    const filePath = path.join(wbMediaPath, file);
    const stats = fs.statSync(filePath);
    const size = (stats.size / 1024).toFixed(1);
    console.log(`  📄 ${file} (${size} KB)`);
  });
}

console.log('\n🎯 Current Logo Usage:');
console.log('  📄 whistleblower-logo-light.png - Used for light mode navbar');
console.log('  📄 whistleblower-logo-dark.png - Used for dark mode navbar/footer');
console.log('  📄 banner-WhistleBlower.jpeg - Used for SEO meta tags');

console.log('\n💡 To update the light mode logo:');
console.log('1. Upload your new logo image to /public/WBMedia/general/');
console.log('2. Tell me the filename of your uploaded logo');
console.log('3. I\'ll update the navbar to use your new logo');

console.log('\n📋 Suggested filename for your new logo:');
console.log('  - whistleblower-logo-light-new.png (or .jpg)');
console.log('  - new-logo-light.png (or .jpg)');
console.log('  - logo-light.png (or .jpg)');

console.log('\n🚀 Once you upload the logo, I can:');
console.log('  ✅ Update Navbar.jsx to use your new light mode logo');
console.log('  ✅ Update MobileMenuOverlay.jsx to use your new logo');
console.log('  ✅ Rebuild the project with the new logo');
console.log('  ✅ Make it ready for production deployment');

console.log('\n❓ What\'s the filename of your uploaded logo image?');
