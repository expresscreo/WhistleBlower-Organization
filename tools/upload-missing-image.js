#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📤 Missing Image Upload Helper\n');

const wbMediaPath = path.join(__dirname, '..', 'public', 'WBMedia', 'general');
const missingImage = 'an African man or woman.webp';
const imagePath = path.join(wbMediaPath, missingImage);

console.log('🎯 Target Image:', missingImage);
console.log('📁 Destination:', imagePath);

// Check if image already exists
if (fs.existsSync(imagePath)) {
  console.log('✅ Image already exists!');
  const stats = fs.statSync(imagePath);
  const size = (stats.size / 1024).toFixed(1);
  console.log(`📊 File size: ${size} KB`);
  console.log('🎉 No action needed.');
  process.exit(0);
}

console.log('\n❌ Image is missing!');
console.log('\n📋 Instructions to fix:');
console.log('1. Find or create an image showing "An African man or woman using their phone to track a report and receive rewards through the PayCode system"');
console.log('2. Save it as a WebP file with the exact name: "an African man or woman.webp"');
console.log('3. Place it in the directory:', wbMediaPath);
console.log('4. Run this script again to verify');

console.log('\n💡 Alternative solutions:');
console.log('- Use an online image converter to convert JPG/PNG to WebP');
console.log('- Take a screenshot of someone using a phone for tracking/rewards');
console.log('- Use a stock photo that represents mobile payment/reward systems');

console.log('\n🔧 Technical details:');
console.log('- Image format: WebP (recommended for web performance)');
console.log('- Dimensions: Square aspect ratio (1:1) recommended');
console.log('- File size: Keep under 500KB for best performance');
console.log('- Content: Should show someone using a mobile device for rewards/payments');

console.log('\n🚀 After uploading, run:');
console.log('npm run verify-images');

// Create a placeholder file to show the exact filename needed
const placeholderPath = path.join(wbMediaPath, 'PLACEHOLDER-an-African-man-or-woman.webp.txt');
const placeholderContent = `This is a placeholder file showing the exact filename needed.
Replace this file with your actual image: "an African man or woman.webp"

The image should show:
- An African man or woman
- Using their phone
- Related to tracking reports and receiving rewards
- PayCode system demonstration

Format: WebP
Size: Square aspect ratio recommended
File size: Under 500KB
`;

try {
  fs.writeFileSync(placeholderPath, placeholderContent);
  console.log('\n📄 Created placeholder file:', placeholderPath);
  console.log('   (Delete this after uploading the real image)');
} catch (error) {
  console.log('\n⚠️  Could not create placeholder file:', error.message);
}

process.exit(1);
