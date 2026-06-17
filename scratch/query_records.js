const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/db');

async function checkRecords() {
  try {
    const [leads] = await pool.execute('SELECT id, person_name, company_name, status, is_deleted FROM leads WHERE is_deleted = 0 ORDER BY id DESC LIMIT 20');
    console.log('--- RECENT LEADS ---');
    console.table(leads);

    const [deals] = await pool.execute('SELECT id, title, total, status, lead_id FROM deals ORDER BY id DESC LIMIT 20');
    console.log('--- RECENT DEALS (OPPORTUNITIES) ---');
    console.table(deals);

    process.exit(0);
  } catch (error) {
    console.error('Database error:', error);
    process.exit(1);
  }
}

checkRecords();
