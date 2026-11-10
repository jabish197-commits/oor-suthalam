import mongoose from 'mongoose';
import { setServers } from 'node:dns';

export default async function connectDB() {
  // Optional process-only override for networks whose DNS rejects Atlas SRV queries.
  if (process.env.MONGO_DNS_SERVERS) {
    setServers(process.env.MONGO_DNS_SERVERS.split(',').map((server) => server.trim()));
  }
  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });
  console.log('MongoDB connected');
}
