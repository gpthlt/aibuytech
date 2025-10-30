import mongoose from 'mongoose';
import { config } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { Category } from '../src/models/Category.js';
import { Product } from '../src/models/Product.js';
import { Cart } from '../src/models/Cart.js';
import { hashPassword } from '../src/utils/crypto.js';
import { logger } from '../src/utils/logger.js';

const categories = [
  { name: 'Laptop', slug: 'laptop', description: 'Máy tính xách tay' },
  { name: 'Smartphone', slug: 'smartphone', description: 'Điện thoại thông minh' },
  { name: 'Tablet', slug: 'tablet', description: 'Máy tính bảng' },
  { name: 'Accessories', slug: 'accessories', description: 'Phụ kiện công nghệ' },
  { name: 'Gaming', slug: 'gaming', description: 'Thiết bị gaming' },
];

const productTemplates = [
  { name: 'MacBook Pro 16" M3', price: 65000000, stock: 15, category: 'laptop' },
  { name: 'Dell XPS 15', price: 45000000, stock: 20, category: 'laptop' },
  { name: 'Lenovo ThinkPad X1', price: 38000000, stock: 12, category: 'laptop' },
  { name: 'ASUS ROG Zephyrus', price: 55000000, stock: 8, category: 'laptop' },
  { name: 'iPhone 15 Pro Max', price: 35000000, stock: 30, category: 'smartphone' },
  { name: 'Samsung Galaxy S24 Ultra', price: 30000000, stock: 25, category: 'smartphone' },
  { name: 'Google Pixel 8 Pro', price: 25000000, stock: 18, category: 'smartphone' },
  { name: 'Xiaomi 14 Pro', price: 20000000, stock: 22, category: 'smartphone' },
  { name: 'iPad Pro 12.9"', price: 28000000, stock: 15, category: 'tablet' },
  { name: 'Samsung Galaxy Tab S9', price: 22000000, stock: 20, category: 'tablet' },
  { name: 'Microsoft Surface Pro 9', price: 32000000, stock: 10, category: 'tablet' },
  { name: 'Lenovo Tab P12', price: 15000000, stock: 25, category: 'tablet' },
  { name: 'AirPods Pro 2', price: 6000000, stock: 50, category: 'accessories' },
  { name: 'Sony WH-1000XM5', price: 9000000, stock: 30, category: 'accessories' },
  { name: 'Logitech MX Master 3S', price: 2500000, stock: 40, category: 'accessories' },
  { name: 'Apple Magic Keyboard', price: 4500000, stock: 35, category: 'accessories' },
  { name: 'PlayStation 5', price: 15000000, stock: 12, category: 'gaming' },
  { name: 'Xbox Series X', price: 14000000, stock: 15, category: 'gaming' },
  { name: 'Nintendo Switch OLED', price: 9000000, stock: 20, category: 'gaming' },
  { name: 'Steam Deck', price: 12000000, stock: 10, category: 'gaming' },
];

async function seed() {
  try {
    logger.info('🌱 Starting seed process...');

    // Connect to database
    await mongoose.connect(config.mongoUrl);
    logger.info('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Cart.deleteMany({});
    logger.info('🗑️  Cleared existing data');

    // Create admin user
    const adminPassword = await hashPassword('Admin@123');
    const admin = await User.create({
      email: 'admin@aibuytech.vn',
      password: adminPassword,
      name: 'Admin User',
      role: 'admin',
    });
    logger.info('👤 Created admin user');

    // Create regular users
    const userPassword = await hashPassword('User@123');
    const user1 = await User.create({
      email: 'user1@test.com',
      password: userPassword,
      name: 'Test User 1',
      role: 'user',
    });

    const user2 = await User.create({
      email: 'user2@test.com',
      password: userPassword,
      name: 'Test User 2',
      role: 'user',
    });
    logger.info('👥 Created regular users');

    // Create categories
    const createdCategories = await Category.insertMany(categories);
    logger.info('📁 Created categories');

    // Create products
    const products = productTemplates.map((template) => {
      const category = createdCategories.find((cat) => cat.slug === template.category);
      return {
        name: template.name,
        description: `High-quality ${template.name} with latest features`,
        price: template.price,
        category: category!._id,
        stock: template.stock,
        isActive: true,
      };
    });

    await Product.insertMany(products);
    logger.info('📦 Created products');

    // Create sample carts
    const allProducts = await Product.find().limit(3);
    await Cart.create({
      user: user1._id,
      items: allProducts.slice(0, 2).map((p) => ({
        product: p._id,
        quantity: 1,
        price: p.price,
      })),
    });

    await Cart.create({
      user: user2._id,
      items: [
        {
          product: allProducts[2]._id,
          quantity: 2,
          price: allProducts[2].price,
        },
      ],
    });
    logger.info('🛒 Created sample carts');

    logger.info('✨ Seed completed successfully!');
    logger.info('\n📋 Test Accounts:');
    logger.info('   Admin: admin@aibuytech.vn / Admin@123');
    logger.info('   User1: user1@test.com / User@123');
    logger.info('   User2: user2@test.com / User@123');

    process.exit(0);
  } catch (error) {
    logger.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
