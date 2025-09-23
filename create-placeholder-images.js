#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🎨 Creating Placeholder Images for Missing Assets\n');

const targetDir = path.join(__dirname, 'public', 'WBMedia', 'general');

// Create simple SVG placeholders for missing images
const createSVGPlaceholder = (filename, title, width = 400, height = 300) => {
  const svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f3f4f6"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="#6b7280" text-anchor="middle" dy=".3em">
    ${title}
  </text>
  <text x="50%" y="60%" font-family="Arial, sans-serif" font-size="12" fill="#9ca3af" text-anchor="middle">
    Placeholder Image
  </text>
</svg>`;

  const filePath = path.join(targetDir, filename);
  fs.writeFileSync(filePath, svgContent);
  console.log(`✅ Created: ${filename}`);
};

// Create missing images
const missingImages = [
  {
    filename: 'ndpc-logo.webp',
    title: 'NDPC Logo',
    width: 200,
    height: 100
  },
  {
    filename: 'cyber-threat-defense-badge.webp', 
    title: 'Cyber Defense Badge',
    width: 300,
    height: 200
  },
  {
    filename: 'trusted-partner-3.jpg',
    title: 'Healthcare Sector',
    width: 400,
    height: 300
  },
  {
    filename: 'trusted-partner-4.jpg',
    title: 'Educational Institutions',
    width: 400,
    height: 300
  },
  {
    filename: 'trusted-partner-5.jpg',
    title: 'Corporate Sector',
    width: 400,
    height: 300
  }
];

console.log('📁 Target Directory:', targetDir);
console.log('🎯 Creating placeholders for missing images:\n');

missingImages.forEach(image => {
  const filePath = path.join(targetDir, image.filename);
  if (!fs.existsSync(filePath)) {
    createSVGPlaceholder(image.filename, image.title, image.width, image.height);
  } else {
    console.log(`⏭️  Skipped: ${image.filename} (already exists)`);
  }
});

console.log('\n📋 Final Image Inventory:');
if (fs.existsSync(targetDir)) {
  const files = fs.readdirSync(targetDir);
  files.forEach(file => {
    const filePath = path.join(targetDir, file);
    const stats = fs.statSync(filePath);
    const size = (stats.size / 1024).toFixed(1);
    console.log(`  📄 ${file} (${size} KB)`);
  });
}

console.log('\n💡 Note: These are placeholder images. Replace them with actual images when available.');
console.log('   You can download proper images from:');
console.log('   - NDPC official website for the logo');
console.log('   - Stock photo sites for compliance badges');
console.log('   - Your own photos or stock images for trusted partners');
