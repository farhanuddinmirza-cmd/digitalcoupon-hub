import clientPromise from './db.js';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db('physical_coupon');
    const collection = db.collection('users');

    if (req.method === 'GET') {
      const users = await collection.find({}, { projection: { password: 0 } }).toArray();
      return res.status(200).json(users);
    }

    if (req.method === 'POST') {
      const user = req.body;
      user.enabled = user.enabled ?? true;
      user.createdAt = user.createdAt || new Date().toISOString().split('T')[0];
      const result = await collection.insertOne(user);
      const { password, ...safeUser } = user;
      return res.status(201).json({ ...safeUser, _id: result.insertedId });
    }

    if (req.method === 'PUT') {
      const { _id, ...updates } = req.body;
      if (!_id) return res.status(400).json({ error: '_id is required' });
      const filter = { _id: new ObjectId(_id) };
      const result = await collection.updateOne(filter, { $set: updates });
      if (result.matchedCount === 0) return res.status(404).json({ error: 'User not found' });
      return res.status(200).json({ _id, ...updates });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'id query param is required' });
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      if (result.deletedCount === 0) return res.status(404).json({ error: 'User not found' });
      return res.status(200).json({ deleted: id });
    }

    res.setHeader('Allow', 'GET, POST, PUT, DELETE');
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
