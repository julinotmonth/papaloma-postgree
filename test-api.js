import http from 'http';
import https from 'https';

// Simple HTTP request helper
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ 
            status: res.statusCode, 
            data: JSON.parse(data),
            headers: res.headers 
          });
        } catch (e) {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Test API endpoint untuk melihat response actual
async function testTransaksiMasuk() {
  try {
    console.log('🧪 Testing Transaksi Masuk API...\n');
    
    // First, login to get token
    console.log('1️⃣ Logging in...');
    const loginRes = await request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        email: 'superadmin@papaloma.id',
        password: 'password123'
      })
    });
    
    if (!loginRes.data.success) {
      console.error('❌ Login failed:', loginRes.data);
      return;
    }
    
    const token = loginRes.data.data.token;
    console.log('✅ Login successful\n');
    
    // Test transaksi-masuk endpoint
    console.log('2️⃣ Fetching transaksi masuk...');
    const res = await request('http://localhost:3000/api/transaksi-masuk?page=1&limit=10', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('\n📊 API Response:');
    console.log('Status:', res.status);
    console.log('Success:', res.data.success);
    console.log('Total items:', res.data.data?.length || 0);
    console.log('\n📝 Sample data (first item):');
    
    if (res.data.data && res.data.data.length > 0) {
      const firstItem = res.data.data[0];
      console.log(JSON.stringify(firstItem, null, 2));
      
      // Check structure
      console.log('\n🔍 Structure validation:');
      console.log('✓ Has id:', !!firstItem.id);
      console.log('✓ Has barang:', !!firstItem.barang);
      console.log('✓ Has barang.name:', !!firstItem.barang?.name);
      console.log('✓ Has barang.satuan:', !!firstItem.barang?.satuan);
      console.log('✓ Has jumlah:', firstItem.jumlah !== undefined);
      console.log('✓ Has tanggal:', !!firstItem.tanggal);
      console.log('✓ Has supplier:', !!firstItem.supplier);
      console.log('✓ Has createdBy:', !!firstItem.createdBy);
      console.log('✓ Has createdBy.name:', !!firstItem.createdBy?.name);
      
      // Check for undefined values
      if (!firstItem.barang || !firstItem.barang.name) {
        console.log('\n⚠️  WARNING: barang or barang.name is undefined!');
        console.log('barang object:', firstItem.barang);
      } else {
        console.log('\n✅ All checks passed! Data structure is correct.');
      }
      
      // Show all items summary
      console.log('\n📋 All items summary:');
      res.data.data.forEach((item, idx) => {
        console.log(`${idx + 1}. ID: ${item.id} - Barang: ${item.barang?.name || 'UNDEFINED'} - Jumlah: ${item.jumlah}`);
      });
      
    } else {
      console.log('⚠️  No data returned');
      console.log('Response:', res.data);
    }
    
    console.log('\n✅ Test completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Backend server is not running!');
      console.error('   Start it with: npm run dev');
    }
  }
}

testTransaksiMasuk();