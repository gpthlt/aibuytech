import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { corsMiddleware } from './middlewares/cors.js';
import { rateLimitMiddleware } from './middlewares/rateLimit.js';
import { requestIdMiddleware } from './middlewares/requestId.js';
import { errorHandler, notFoundHandler } from './middlewares/error.js';

// Import models to register schemas
import './models/User.js';
import './models/Category.js';
import './models/Product.js';
import './models/Cart.js';
import './models/Order.js';

// Import routes
import authRoutes from './modules/auth/auth.routes.js';
import productsRoutes from './modules/products/products.routes.js';
import cartRoutes from './modules/cart/cart.routes.js';
import ordersRoutes from './modules/orders/orders.routes.js';
import paymentsRoutes from './modules/payments/payments.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';

const app: Application = express();

// Security & Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Fix CORS for images
  })
);
app.use(corsMiddleware);
app.use(rateLimitMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(requestIdMiddleware);

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Swagger documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AIBUYTECH.VN API',
      version: '1.0.0',
      description: 'E-commerce API for AIBUYTECH.VN',
    },
    servers: [
      {
        url: 'http://localhost:8000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/modules/**/*.routes.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/api/v1/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
    },
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productsRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/orders', ordersRoutes);
app.use('/api/v1/payments', paymentsRoutes);
app.use('/api/v1/admin', adminRoutes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
