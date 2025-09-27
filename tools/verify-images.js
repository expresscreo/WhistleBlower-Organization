#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Image Verification Tool\n');

const wbMediaPath = path.join(__dirname, '..', 'public', 'WBMedia', 'general');

// List of critical images that must exist
const criticalImages = [
  'an African man or woman.webp',
  'whistleblower-logo-light.png',
  'whistleblower-logo-dark.png',
  'hero-section-background.jpg',
  'banner-WhistleBlower.jpeg',
  'FAVICON-WhistleBlower.png'
];

// Images referenced in code
const referencedImages = [
  'an African man or woman.webp', // RewardsForInformationPage.jsx
  'whistleblower-logo-light.png', // Navbar.jsx, MobileMenuOverlay.jsx
  'whistleblower-logo-dark.png',  // Navbar.jsx, Footer.jsx
  'hero-section-background.jpg',  // HomePage.jsx
  'banner-WhistleBlower.jpeg',    // index.html, seoUtils.js
  'FAVICON-WhistleBlower.png',    // index.html
  'about-us-team.jpg',            // AboutUsPageV2.jsx
  'bounty-accordion-image.jpg',   // BountyAccordion.jsx
  'gdpr-compliant-badge.webp',    // HowWeSecureDataPage.jsx
  'ndpc-logo.webp',               // HowWeSecureDataPage.jsx
  'cyber-threat-defense-badge.webp', // HowWeSecureDataPage.jsx
  'Financial-Institutions.webp',  // TrustedByCarousel.jsx
  'Government-Agencies.webp',     // TrustedByCarousel.jsx
  'Healthcare-Sector.webp',       // TrustedByCarousel.jsx
  'Educational-Institutions.webp', // TrustedByCarousel.jsx
  'Corporate-Private-Sector.webp' // TrustedByCarousel.jsx
];

function checkImages() {
  console.log('📁 Checking images in:', wbMediaPath);
  
  if (!fs.existsSync(wbMediaPath)) {
    console.log('❌ WBMedia directory does not exist!');
    return false;
  }

  const existingFiles = fs.readdirSync(wbMediaPath);
  const imageFiles = existingFiles.filter(file => /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file));
  
  console.log(`\n📊 Found ${imageFiles.length} image files`);
  
  let allGood = true;
  
  // Check critical images
  console.log('\n🎯 Critical Images:');
  criticalImages.forEach(image => {
    const exists = imageFiles.includes(image);
    const status = exists ? '✅' : '❌';
    console.log(`  ${status} ${image}`);
    if (!exists) allGood = false;
  });
  
  // Check all referenced images
  console.log('\n📋 Referenced Images:');
  referencedImages.forEach(image => {
    const exists = imageFiles.includes(image);
    const status = exists ? '✅' : '❌';
    console.log(`  ${status} ${image}`);
    if (!exists) allGood = false;
  });
  
  // Show unused images
  const unusedImages = imageFiles.filter(file => !referencedImages.includes(file));
  if (unusedImages.length > 0) {
    console.log('\n📦 Unused Images (not referenced in code):');
    unusedImages.forEach(image => {
      console.log(`  ℹ️  ${image}`);
    });
  }
  
  return allGood;
}

function createBackup() {
  const backupDir = path.join(__dirname, '..', 'backups', 'images');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `wbmedia-backup-${timestamp}`);
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  try {
    // Copy entire WBMedia directory
    fs.cpSync(wbMediaPath, backupPath, { recursive: true });
    console.log(`\n💾 Backup created: ${backupPath}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to create backup:', error.message);
    return false;
  }
}

function main() {
  const allGood = checkImages();
  
  if (!allGood) {
    console.log('\n⚠️  Some images are missing!');
    console.log('💡 Recommendations:');
    console.log('1. Upload the missing images to /public/WBMedia/general/');
    console.log('2. Run this script again to verify');
    console.log('3. Create a backup before running npm run build');
    
    // Ask if user wants to create backup
    console.log('\n🔄 Creating backup of existing images...');
    createBackup();
  } else {
    console.log('\n✅ All images are present and accounted for!');
    console.log('🎉 Your build should work without image issues.');
  }
  
  console.log('\n📝 Tips to prevent image loss:');
  console.log('1. Always verify images exist before running npm run build');
  console.log('2. Keep backups of your WBMedia directory');
  console.log('3. Use version control to track image changes');
  console.log('4. Run this script regularly: node tools/verify-images.js');
}

main();
