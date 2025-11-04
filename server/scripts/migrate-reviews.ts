import mongoose from 'mongoose';
import { Product } from '../src/models/Product.js';
import { config } from '../src/config/env.js';
import { logger } from '../src/utils/logger.js';

/**
 * Migration script to add review fields to existing products
 * Run this once after deploying the review feature
 * 
 * Usage: npm run migrate:reviews
 */

async function migrateProductReviews() {
  try {
    // Connect to database
    await mongoose.connect(config.mongoUrl);
    logger.info('Connected to MongoDB for migration');

    // Count products without review fields
    const productsToUpdate = await Product.countDocuments({
      $or: [
        { reviews: { $exists: false } },
        { averageRating: { $exists: false } },
        { totalReviews: { $exists: false } },
      ],
    });

    logger.info(`Found ${productsToUpdate} products to update`);

    if (productsToUpdate === 0) {
      logger.info('No products need migration. All products already have review fields.');
      process.exit(0);
    }

    // Update products with default review fields
    const result = await Product.updateMany(
      {
        $or: [
          { reviews: { $exists: false } },
          { averageRating: { $exists: false } },
          { totalReviews: { $exists: false } },
        ],
      },
      {
        $set: {
          reviews: [],
          averageRating: 0,
          totalReviews: 0,
        },
      }
    );

    logger.info(`Migration completed successfully!`);
    logger.info(`Modified ${result.modifiedCount} products`);

    // Verify migration
    const verifyCount = await Product.countDocuments({
      reviews: { $exists: true },
      averageRating: { $exists: true },
      totalReviews: { $exists: true },
    });

    logger.info(`Verification: ${verifyCount} products now have review fields`);

    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateProductReviews();
