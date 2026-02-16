#!/usr/bin/env node

/**
 * Script untuk menambahkan await ke semua pemanggilan model methods
 * di controllers yang telah di-copy dari SQLite version
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const controllersDir = path.join(__dirname, '../src/controllers');

// Model methods yang perlu ditambahkan await
const modelPatterns = [
  // User model
  /User\.findAll\(/g,
  /User\.findById\(/g,
  /User\.findByEmail\(/g,
  /User\.create\(/g,
  /User\.update\(/g,
  /User\.delete\(/g,
  /User\.updatePassword\(/g,
  /User\.updateLastLogin\(/g,
  /User\.count\(/g,
  
  // Kategori model
  /Kategori\.findAll\(/g,
  /Kategori\.findById\(/g,
  /Kategori\.create\(/g,
  /Kategori\.update\(/g,
  /Kategori\.delete\(/g,
  /Kategori\.getDistribution\(/g,
  
  // Barang model
  /Barang\.findAll\(/g,
  /Barang\.findById\(/g,
  /Barang\.create\(/g,
  /Barang\.update\(/g,
  /Barang\.delete\(/g,
  /Barang\.updateStok\(/g,
  /Barang\.count\(/g,
  /Barang\.getLowStockItems\(/g,
  /Barang\.getDamagedItems\(/g,
  /Barang\.getTotalValue\(/g,
  /Barang\.getTopUsedItems\(/g,
  
  // TransaksiMasuk model
  /TransaksiMasuk\.findAll\(/g,
  /TransaksiMasuk\.findById\(/g,
  /TransaksiMasuk\.create\(/g,
  /TransaksiMasuk\.count\(/g,
  /TransaksiMasuk\.getMonthlyTrend\(/g,
  /TransaksiMasuk\.getTotalCurrentMonth\(/g,
  
  // TransaksiKeluar model
  /TransaksiKeluar\.findAll\(/g,
  /TransaksiKeluar\.findById\(/g,
  /TransaksiKeluar\.create\(/g,
  /TransaksiKeluar\.count\(/g,
  /TransaksiKeluar\.getMonthlyTrend\(/g,
  /TransaksiKeluar\.getTotalCurrentMonth\(/g,
  /TransaksiKeluar\.getByReason\(/g,
  
  // Notification model
  /Notification\.findAll\(/g,
  /Notification\.findById\(/g,
  /Notification\.create\(/g,
  /Notification\.markAsRead\(/g,
  /Notification\.markAllAsRead\(/g,
  /Notification\.delete\(/g,
  /Notification\.deleteAll\(/g,
  /Notification\.getUnreadCount\(/g,
  
  // ActivityLog model
  /ActivityLog\.findAll\(/g,
  /ActivityLog\.findByUserId\(/g,
  /ActivityLog\.create\(/g,
  /ActivityLog\.count\(/g,
];

function addAwaitToFile(filePath) {
  console.log(`Processing: ${path.basename(filePath)}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Add await to model calls
  modelPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      // Check if already has await
      const newContent = content.replace(
        new RegExp(`(?<!await )${pattern.source}`, 'g'),
        (match) => `await ${match}`
      );
      
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`  ✅ Updated: ${path.basename(filePath)}`);
  } else {
    console.log(`  ℹ️  No changes needed: ${path.basename(filePath)}`);
  }
}

// Get all controller files
const files = fs.readdirSync(controllersDir)
  .filter(file => file.endsWith('.js') && file !== 'index.js')
  .map(file => path.join(controllersDir, file));

console.log('🔧 Fixing controllers to add await to async calls...\n');

files.forEach(addAwaitToFile);

console.log('\n✅ All controllers have been processed!');
console.log('\n⚠️  IMPORTANT: Please manually review the changes to ensure correctness.');
console.log('Some edge cases may need manual fixing.');
