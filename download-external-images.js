#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🖼️  Downloading External Images for WhistleBlower.ng\n');

const externalImages = [
  {
    url: 'https://imagedelivery.net/LqiWLm-3MGbYHtFuUbcBtA/119580eb-abd9-4191-b93a-f01938786700/public',
    filename: 'hero-image.jpg',
    description: 'Hero image from imagedelivery.net'
  },
  {
    url: 'https://images.unsplash.com/photo-1599493343939-403946147b12?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    filename: 'about-background.jpg',
    description: 'About page background from Unsplash'
  },
  {
    url: 'https://images.unsplash.com/photo-1701783646331-10977357db92',
    filename: 'bounty-accordion-image.jpg',
    description: 'Bounty accordion image from Unsplash'
  }
];

const targetDir = path.join(__dirname, 'public', 'WBMedia', 'general');

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log('📁 Created directory:', targetDir);
}

function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(targetDir, filename);
    const file = fs.createWriteStream(filePath);
    
    console.log(`⬇️  Downloading: ${filename}`);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        const stats = fs.statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(1);
        console.log(`✅ Downloaded: ${filename} (${sizeKB} KB)`);
        resolve(filePath);
      });
      
      file.on('error', (err) => {
        fs.unlink(filePath, () => {}); // Delete partial file
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function downloadAllImages() {
  console.log(`📁 Target Directory: ${targetDir}\n`);
  
  for (const image of externalImages) {
    try {
      await downloadImage(image.url, image.filename);
      console.log(`   Description: ${image.description}\n`);
    } catch (error) {
      console.error(`❌ Failed to download ${image.filename}:`, error.message);
    }
  }
  
  console.log('🎉 Download process completed!\n');
  
  // List all files in the directory
  console.log('📋 Files in WBMedia/general/:');
  const files = fs.readdirSync(targetDir);
  files.forEach(file => {
    const filePath = path.join(targetDir, file);
    const stats = fs.statSync(filePath);
    const size = (stats.size / 1024).toFixed(1);
    console.log(`  📄 ${file} (${size} KB)`);
  });
}

downloadAllImages().catch(console.error);
