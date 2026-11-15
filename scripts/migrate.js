import { getDb } from '../src/lib/db.js';

async function migrate() {
  console.log('🔄 Starting Analytics Database Migration...');
  const db = await getDb();
  console.log(`✅ Successfully connected and migrated schema for: ${db.type.toUpperCase()}`);
  console.log('📊 Table `analytics_events` and associated indexes are ready.');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
