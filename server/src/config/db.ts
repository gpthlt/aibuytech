import mongoose from 'mongoose';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(config.mongoUrl);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    // Create indexes
    await createIndexes();
  } catch (error) {
    logger.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

async function createIndexes() {
  try {
    // User indexes
    await mongoose.connection.collection('users').createIndex({ email: 1 }, { unique: true });

    // Product indexes
    await mongoose.connection.collection('products').createIndex({ name: 'text' });
    await mongoose.connection.collection('products').createIndex({ category: 1 });
    await mongoose.connection.collection('products').createIndex({ price: 1 });
    await mongoose.connection.collection('products').createIndex({ createdAt: -1 });

    // Order indexes
    await mongoose.connection.collection('orders').createIndex({ user: 1 });
    await mongoose.connection.collection('orders').createIndex({ status: 1 });
    await mongoose.connection.collection('orders').createIndex({ createdAt: -1 });

    logger.info('Database indexes created successfully');
  } catch (error) {
    logger.warn('Some indexes may already exist:', error);
  }
}

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
  logger.info('MongoDB Disconnected');
};
