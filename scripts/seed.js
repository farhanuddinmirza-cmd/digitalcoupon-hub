import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('Set MONGODB_URI environment variable first.');
  console.error('Example: MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/digitalcoupon" node scripts/seed.js');
  process.exit(1);
}

const campaigns = [
  { id: 'c1', name: 'Summer Sale 2024', brand: 'Brand A', store: 'Store Delhi', startDate: '2024-06-01', endDate: '2024-06-30', status: 'completed' },
  { id: 'c2', name: 'Monsoon Madness', brand: 'Brand B', store: 'Store Mumbai', startDate: '2024-07-15', endDate: '2024-08-15', status: 'active' },
  { id: 'c3', name: 'Festive Bonanza', brand: 'Brand A', store: 'Store Bangalore', startDate: '2024-10-01', endDate: '2024-11-15', status: 'active' },
  { id: 'c4', name: 'Winter Warmth', brand: 'Brand C', store: 'Store Delhi', startDate: '2024-12-01', endDate: '2025-01-31', status: 'draft' },
];

const statuses = ['uploaded', 'claimed', 'voided'];

const coupons = Array.from({ length: 85 }, (_, i) => {
  const campaign = campaigns[i % campaigns.length];
  const status = statuses[i % 3];
  return {
    couponCode: `COUP-${String(i + 1).padStart(5, '0')}`,
    campaignId: campaign.id,
    campaignName: campaign.name,
    status,
    claimedBy: status === 'claimed' ? `user${i}@example.com` : null,
    claimedAt: status === 'claimed' ? `2024-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, '0')}T10:30:00Z` : null,
    transactionId: status === 'claimed' ? `TXN${String(i + 1000).padStart(8, '0')}` : null,
    transactionDate: status === 'claimed' ? `2024-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, '0')}` : null,
    uploadedAt: `2024-0${(i % 6) + 1}-${String((i % 28) + 1).padStart(2, '0')}T09:00:00Z`,
    store: campaign.store,
    brand: campaign.brand,
  };
});

const users = [
  { name: 'Rahul Sharma', email: 'rahul@admin.com', password: 'admin123', role: 'admin', enabled: true, createdAt: '2024-01-10' },
  { name: 'Priya Patel', email: 'priya@ops.com', password: 'ops123', role: 'ops', enabled: true, createdAt: '2024-02-15' },
  { name: 'Amit Kumar', email: 'amit@viewer.com', password: 'viewer123', role: 'viewer', enabled: true, createdAt: '2024-03-01' },
  { name: 'Sneha Gupta', email: 'sneha@ops.com', password: 'ops456', role: 'ops', enabled: false, createdAt: '2024-03-20' },
  { name: 'Vikram Singh', email: 'vikram@viewer.com', password: 'viewer456', role: 'viewer', enabled: true, createdAt: '2024-04-05' },
];

const activityLogs = [
  { action: 'uploaded', description: 'Uploaded 500 coupons for Summer Sale 2024', userId: '1', userName: 'Rahul Sharma', campaignId: 'c1', campaignName: 'Summer Sale 2024', timestamp: '2024-06-01T09:00:00Z' },
  { action: 'claimed', description: 'Coupon COUP-00012 claimed', userId: '3', userName: 'System', campaignId: 'c1', campaignName: 'Summer Sale 2024', timestamp: '2024-06-05T14:30:00Z' },
  { action: 'pdf_downloaded', description: 'PDF report downloaded for Monsoon Madness', userId: '2', userName: 'Priya Patel', campaignId: 'c2', campaignName: 'Monsoon Madness', timestamp: '2024-07-20T11:00:00Z' },
  { action: 'uploaded', description: 'Uploaded 300 coupons for Festive Bonanza', userId: '2', userName: 'Priya Patel', campaignId: 'c3', campaignName: 'Festive Bonanza', timestamp: '2024-10-01T08:00:00Z' },
  { action: 'user_created', description: 'User Sneha Gupta created', userId: '1', userName: 'Rahul Sharma', timestamp: '2024-03-20T10:00:00Z' },
  { action: 'role_changed', description: 'Role changed for Amit Kumar to viewer', userId: '1', userName: 'Rahul Sharma', timestamp: '2024-03-01T12:00:00Z' },
  { action: 'claimed', description: 'Coupon COUP-00045 claimed', userId: '3', userName: 'System', campaignId: 'c2', campaignName: 'Monsoon Madness', timestamp: '2024-08-02T16:45:00Z' },
  { action: 'pdf_downloaded', description: 'PDF report downloaded for Summer Sale 2024', userId: '1', userName: 'Rahul Sharma', campaignId: 'c1', campaignName: 'Summer Sale 2024', timestamp: '2024-06-30T17:00:00Z' },
];

async function seed() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('physical_coupon');

    // Drop existing collections
    const collections = await db.listCollections().toArray();
    for (const col of collections) {
      await db.dropCollection(col.name);
      console.log(`  Dropped collection: ${col.name}`);
    }

    // Seed campaigns
    await db.collection('campaigns').insertMany(campaigns);
    console.log(`Seeded ${campaigns.length} campaigns`);

    // Seed coupons
    await db.collection('coupons').insertMany(coupons);
    console.log(`Seeded ${coupons.length} coupons`);

    // Seed users
    await db.collection('users').insertMany(users);
    console.log(`Seeded ${users.length} users`);

    // Seed activity logs
    await db.collection('activity_logs').insertMany(activityLogs);
    console.log(`Seeded ${activityLogs.length} activity logs`);

    // Create indexes
    await db.collection('coupons').createIndex({ campaignId: 1 });
    await db.collection('coupons').createIndex({ status: 1 });
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('activity_logs').createIndex({ timestamp: -1 });
    console.log('Created indexes');

    console.log('\nSeed complete!');
  } finally {
    await client.close();
  }
}

seed().catch(console.error);
