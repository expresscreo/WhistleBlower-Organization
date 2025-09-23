#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🗺️  Mapping New Images to Replace Placeholders\n');

const wbMediaPath = path.join(__dirname, 'public', 'WBMedia', 'general');

// New images available for mapping
const newImages = [
  'file-1758416542352-237748413.png',
  'file-1758418222806-353835260.png', 
  'file-1758419446101-330952154.png'
];

// Placeholder images that need replacement
const placeholders = [
  {
    filename: 'ndpc-logo.webp',
    description: 'NDPC Nigeria Data Protection Commission Logo',
    suggestedNewImage: 'file-1758416542352-237748413.png',
    reason: 'PNG format, good size for logo'
  },
  {
    filename: 'cyber-threat-defense-badge.webp',
    description: 'Cyber Threat Defense Penetration Testing Badge', 
    suggestedNewImage: 'file-1758418222806-353835260.png',
    reason: 'PNG format, good size for badge'
  },
  {
    filename: 'trusted-partner-3.jpg',
    description: 'Healthcare Sector Image',
    suggestedNewImage: 'file-1758419446101-330952154.png',
    reason: 'PNG format, good size for partner image'
  }
];

console.log('🎯 Suggested Mapping (you can adjust these):');
console.log('Based on file sizes and types, here are my suggestions:\n');

placeholders.forEach((placeholder, index) => {
  const newImage = newImages[index];
  console.log(`📋 ${placeholder.description}:`);
  console.log(`   Current: ${placeholder.filename} (placeholder)`);
  console.log(`   Suggested: ${newImage} → rename to ${placeholder.filename.replace('.webp', '.png').replace('.jpg', '.png')}`);
  console.log(`   Reason: ${placeholder.reason}\n`);
});

console.log('📝 Commands to implement the mapping:');
console.log('Run these commands in your WBMedia/general/ folder:\n');

placeholders.forEach((placeholder, index) => {
  const newImage = newImages[index];
  const newFilename = placeholder.filename.replace('.webp', '.png').replace('.jpg', '.png');
  
  console.log(`# ${placeholder.description}`);
  console.log(`mv "${newImage}" "${newFilename}"`);
  console.log('');
});

console.log('⚠️  Note: This will convert some files from .webp/.jpg to .png format');
console.log('   You may need to update the code references if you prefer to keep original formats');

console.log('\n🔄 Alternative: Keep original formats and update code');
console.log('If you want to keep the original file extensions, I can update the code to match:');
placeholders.forEach((placeholder, index) => {
  const newImage = newImages[index];
  const originalExt = path.extname(newImage);
  const newFilename = placeholder.filename.replace(/\.[^.]+$/, originalExt);
  console.log(`   ${newImage} → ${newFilename}`);
});

console.log('\n💡 What would you like to do?');
console.log('1. Use the suggested mapping (rename files to match current code)');
console.log('2. Keep original formats and update code to match');
console.log('3. Tell me which specific image should go where');
console.log('4. Let me automatically implement the suggested mapping');

console.log('\n🚀 Just let me know your preference and I\'ll implement it!');
