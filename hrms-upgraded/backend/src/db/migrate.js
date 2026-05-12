const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function migrate() {
  console.log('🚀 Running HRMS database migration...');
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(sql);

    // Safe additive migrations — run after full schema in case schema already exists
    await pool.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS theme VARCHAR(1000)`);
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('📋 Demo Login Credentials:');
    console.log('   Super Admin : superadmin@hrms.com  / admin123');
    console.log('   Admin       : admin@techcorp.com   / admin123');
    console.log('   Employee    : david@techcorp.com   / emp123');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();
