import clientPromise from './db.js';

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db('digitalcoupon');
    const { campaignId } = req.query;
    const query = campaignId ? { campaignId } : {};
    const coupons = await db.collection('coupons').find(query).toArray();
    res.status(200).json(coupons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
