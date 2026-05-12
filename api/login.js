import clientPromise from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('physical_coupon');
    const collection = db.collection('users');

    const user = await collection.findOne(
      { email, password, enabled: { $ne: false } },
      { projection: { password: 0 } },
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
