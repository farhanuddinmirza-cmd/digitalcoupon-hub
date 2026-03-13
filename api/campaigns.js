import clientPromise from './db.js';

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db('digitalcoupon');
    const campaigns = await db.collection('campaigns').find({}).toArray();
    res.status(200).json(campaigns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
