import clientPromise from './db.js';

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db('physical_coupon');
    const collection = db.collection('activity_logs');

    if (req.method === 'GET') {
      const { campaignId } = req.query;
      const query = campaignId ? { campaignId } : {};
      const logs = await collection.find(query).sort({ timestamp: -1 }).toArray();
      return res.status(200).json(logs);
    }

    if (req.method === 'POST') {
      const log = req.body;
      log.timestamp = log.timestamp || new Date().toISOString();
      const result = await collection.insertOne(log);
      return res.status(201).json({ ...log, _id: result.insertedId });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
