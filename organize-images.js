#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🖼️  WhistleBlower.ng Image Organization Guide\n');

const imageRequirements = {
  'Logo Images': [
    {
      filename: 'whistleblower-logo-light.png',
      description: 'Light theme logo for navbar and mobile menu',
      usage: 'Navbar, MobileMenuOverlay (light theme)'
    },
    {
      filename: 'whistleblower-logo-dark.png', 
      description: 'Dark theme logo for navbar and footer',
      usage: 'Navbar, Footer, LoginPage, RegisterPage'
    }
  ],
  'Hero & Background Images': [
    {
      filename: 'hero-background.jpg',
      description: 'Homepage hero section background image',
      usage: 'HomePage hero background'
    },
    {
      filename: 'about-us-team.jpg',
      description: 'Team photo for about us page',
      usage: 'AboutUsPageV2 team section'
    }
  ],
  'Compliance Badges': [
    {
      filename: 'gdpr-compliant-badge.webp',
      description: 'GDPR Compliant certification badge',
      usage: 'HowWeSecureDataPage compliance section'
    },
    {
      filename: 'ndpc-logo.webp',
      description: 'NDPC Nigeria Data Protection Commission logo',
      usage: 'HowWeSecureDataPage compliance section'
    },
    {
      filename: 'cyber-threat-defense-badge.webp',
      description: 'Cyber Threat Defense penetration testing badge',
      usage: 'HowWeSecureDataPage compliance section'
    }
  ],
  'Trusted Partners Images': [
    {
      filename: 'trusted-partner-1.png',
      description: 'Financial Institutions - Modern bank building',
      usage: 'TrustedByCarousel - Financial sector'
    },
    {
      filename: 'trusted-partner-2.jpg',
      description: 'Government Agencies - Nigerian National Assembly',
      usage: 'TrustedByCarousel - Government sector'
    },
    {
      filename: 'trusted-partner-3.jpg',
      description: 'Healthcare Sector - Modern hospital ward',
      usage: 'TrustedByCarousel - Healthcare sector'
    },
    {
      filename: 'trusted-partner-4.jpg',
      description: 'Educational Institutions - University campus aerial view',
      usage: 'TrustedByCarousel - Education sector'
    },
    {
      filename: 'trusted-partner-5.jpg',
      description: 'Corporate & Private Sector - Office collaboration',
      usage: 'TrustedByCarousel - Corporate sector'
    }
  ]
};

const wbMediaPath = path.join(__dirname, 'public', 'WBMedia', 'general');

console.log('📁 Target Directory:', wbMediaPath);
console.log('📋 Required Images:\n');

Object.entries(imageRequirements).forEach(([category, images]) => {
  console.log(`\n🎯 ${category}:`);
  images.forEach(img => {
    const filePath = path.join(wbMediaPath, img.filename);
    const exists = fs.existsSync(filePath);
    const status = exists ? '✅' : '❌';
    
    console.log(`  ${status} ${img.filename}`);
    console.log(`     Description: ${img.description}`);
    console.log(`     Usage: ${img.usage}\n`);
  });
});

console.log('\n📝 Instructions:');
console.log('1. Download or create the missing images listed above');
console.log('2. Save them in the /public/WBMedia/general/ folder with the exact filenames shown');
console.log('3. Run "npm run build" to update the dist folder');
console.log('4. Upload the updated dist folder to your production server');

console.log('\n🔗 Current WBMedia folder contents:');
if (fs.existsSync(wbMediaPath)) {
  const files = fs.readdirSync(wbMediaPath);
  files.forEach(file => {
    const filePath = path.join(wbMediaPath, file);
    const stats = fs.statSync(filePath);
    const size = (stats.size / 1024).toFixed(1);
    console.log(`  📄 ${file} (${size} KB)`);
  });
} else {
  console.log('  ❌ WBMedia folder not found');
}

console.log('\n✨ Note: You already have these files uploaded:');
console.log('  ✅ banner-WhistleBlower.jpeg (SEO banner)');
console.log('  ✅ FAVICON-WhistleBlower.png (Website favicon)');
