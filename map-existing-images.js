#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🗺️  Mapping Existing Images to Required Files\n');

const wbMediaPath = path.join(__dirname, 'public', 'WBMedia', 'general');

if (!fs.existsSync(wbMediaPath)) {
  console.log('❌ WBMedia folder not found');
  process.exit(1);
}

const existingFiles = fs.readdirSync(wbMediaPath);
const fileInfo = existingFiles.map(file => {
  const filePath = path.join(wbMediaPath, file);
  const stats = fs.statSync(filePath);
  return {
    filename: file,
    size: stats.size,
    sizeKB: (stats.size / 1024).toFixed(1),
    extension: path.extname(file).toLowerCase()
  };
});

console.log('📁 Existing Files in WBMedia/general/:');
fileInfo.forEach(file => {
  console.log(`  📄 ${file.filename} (${file.sizeKB} KB, ${file.extension})`);
});

console.log('\n🎯 Suggested Mapping (based on file sizes and types):');
console.log('You may want to rename these files to match the required names:\n');

// Suggest mappings based on file sizes and types
const suggestions = [
  {
    existing: 'file-1758416010229-439526390.png',
    suggested: 'whistleblower-logo-light.png',
    reason: 'PNG file, good size for logo'
  },
  {
    existing: 'file-1758416342894-442138891.png', 
    suggested: 'whistleblower-logo-dark.png',
    reason: 'PNG file, same size as light logo'
  },
  {
    existing: 'file-1758414440811-839658948.jpeg',
    suggested: 'hero-background.jpg',
    reason: 'Large JPEG, likely hero background'
  },
  {
    existing: 'file-1758418222825-936526012.JPG',
    suggested: 'about-us-team.jpg',
    reason: 'JPG file, good size for team photo'
  },
  {
    existing: 'file-1758416927826-175437734.webp',
    suggested: 'gdpr-compliant-badge.webp',
    reason: 'WebP file, good size for badge'
  },
  {
    existing: 'file-1758425282703-82154594.jpg',
    suggested: 'trusted-partner-1.png',
    reason: 'JPG file for trusted partner'
  },
  {
    existing: 'file-1758425598831-84236184.jpg',
    suggested: 'trusted-partner-2.jpg',
    reason: 'JPG file for trusted partner'
  }
];

suggestions.forEach((suggestion, index) => {
  const exists = existingFiles.includes(suggestion.existing);
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${suggestion.existing}`);
  console.log(`   → Rename to: ${suggestion.suggested}`);
  console.log(`   Reason: ${suggestion.reason}\n`);
});

console.log('📝 Commands to rename files (run these if the suggestions look correct):');
suggestions.forEach((suggestion, index) => {
  const exists = existingFiles.includes(suggestion.existing);
  if (exists) {
    console.log(`mv "${suggestion.existing}" "${suggestion.suggested}"`);
  }
});

console.log('\n⚠️  Note: You may need to:');
console.log('1. Create additional images for missing requirements');
console.log('2. Adjust the suggestions based on the actual content of your images');
console.log('3. Convert some files to different formats if needed (e.g., JPG to PNG)');

console.log('\n🔍 Still Missing:');
const missingImages = [
  'ndpc-logo.webp',
  'cyber-threat-defense-badge.webp', 
  'trusted-partner-3.jpg',
  'trusted-partner-4.jpg',
  'trusted-partner-5.jpg'
];

missingImages.forEach(img => {
  console.log(`  ❌ ${img}`);
});

console.log('\n💡 Tip: You can download these from:');
console.log('- NDPC official website for the logo');
console.log('- Stock photo sites for compliance badges');
console.log('- Your own photos or stock images for trusted partners');
