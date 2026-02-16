#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const controllersDir = './src/controllers';

// Patterns to fix
const fixes = [
  // KategoriController
  {
    file: 'KategoriController.js',
    replacements: [
      {
        old: 'const kategoriList = Kategori.findAll();',
        new: 'const kategoriList = await Kategori.findAll();'
      },
      {
        old: 'const kategori = Kategori.findById(id);',
        new: 'const kategori = await Kategori.findById(id);'
      },
      {
        old: 'const existing = Kategori.findByName(name);',
        new: 'const existing = await Kategori.findByName(name);'
      },
      {
        old: 'const kategori = Kategori.create({ name, description });',
        new: 'const kategori = await Kategori.create({ name, description });'
      },
      {
        old: 'const existing = Kategori.findById(id);',
        new: 'const existing = await Kategori.findById(id);'
      },
      {
        old: '        const nameExists = Kategori.findByName(name);',
        new: '        const nameExists = await Kategori.findByName(name);'
      },
      {
        old: 'const kategori = Kategori.update(id, { name, description });',
        new: 'const kategori = await Kategori.update(id, { name, description });'
      }
    ]
  },
  // LaporanController
  {
    file: 'LaporanController.js',
    replacements: [
      {
        old: '      const barangList = Barang.findAll({ ...filters, limit: 1000 });',
        new: '      const barangList = await Barang.findAll({ ...filters, limit: 1000 });'
      },
      {
        old: '      const transaksiList = TransaksiMasuk.findAll({',
        new: '      const transaksiList = await TransaksiMasuk.findAll({'
      },
      {
        old: '      const transaksiList = TransaksiKeluar.findAll({',
        new: '      const transaksiList = await TransaksiKeluar.findAll({'
      },
      {
        old: '      const byReason = TransaksiKeluar.getByReason(dateFrom, dateTo);',
        new: '      const byReason = await TransaksiKeluar.getByReason(dateFrom, dateTo);'
      },
      {
        old: '      const damagedItems = Barang.getDamagedItems();',
        new: '      const damagedItems = await Barang.getDamagedItems();'
      },
      {
        old: '      const barangList = Barang.findAll({ limit: 1000 });',
        new: '      const barangList = await Barang.findAll({ limit: 1000 });'
      },
      {
        old: '      const masukList = TransaksiMasuk.findAll({ dateFrom, dateTo, limit: 1000 });',
        new: '      const masukList = await TransaksiMasuk.findAll({ dateFrom, dateTo, limit: 1000 });'
      },
      {
        old: '      const keluarList = TransaksiKeluar.findAll({ dateFrom, dateTo, limit: 1000 });',
        new: '      const keluarList = await TransaksiKeluar.findAll({ dateFrom, dateTo, limit: 1000 });'
      }
    ]
  },
  // TransaksiKeluarController
  {
    file: 'TransaksiKeluarController.js',
    replacements: [
      {
        old: '      const transaksiList = TransaksiKeluar.findAll(filters);',
        new: '      const transaksiList = await TransaksiKeluar.findAll(filters);'
      },
      {
        old: '      const total = TransaksiKeluar.count(filters);',
        new: '      const total = await TransaksiKeluar.count(filters);'
      }
    ]
  }
];

console.log('🔧 Auto-fixing missing await statements...\n');

fixes.forEach(({ file, replacements }) => {
  const filePath = path.join(controllersDir, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${file} not found, skipping...`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changeCount = 0;
  
  replacements.forEach(({ old, new: newText }) => {
    if (content.includes(old)) {
      content = content.replace(old, newText);
      changeCount++;
    }
  });
  
  if (changeCount > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${file}: Fixed ${changeCount} missing await(s)`);
  } else {
    console.log(`ℹ️  ${file}: No changes needed`);
  }
});

console.log('\n✅ All fixes applied!');
