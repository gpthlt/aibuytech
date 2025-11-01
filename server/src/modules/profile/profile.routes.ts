import { Router } from 'express';
import { ProfileController } from './profile.controller.js';
import { validate } from '../../middlewares/validate.js';
import { authenticate } from '../../middlewares/auth.js';
import { updateProfileSchema, changePasswordSchema } from './profile.dto.js';

const router = Router();
const profileController = new ProfileController();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/profile:
 *   get:
 *     tags: [Profile]
 *     summary: Get current user profile
 *     security:
 *       - bearerAuth: []
 */
router.get('/', profileController.getProfile);

/**
 * @swagger
 * /api/v1/profile:
 *   put:
 *     tags: [Profile]
 *     summary: Update user profile
 *     security:
 *       - bearerAuth: []
 */
router.put('/', validate(updateProfileSchema), profileController.updateProfile);

/**
 * @swagger
 * /api/v1/profile/change-password:
 *   post:
 *     tags: [Profile]
 *     summary: Change password
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/change-password',
  validate(changePasswordSchema),
  profileController.changePassword
);

/**
 * @swagger
 * /api/v1/profile:
 *   delete:
 *     tags: [Profile]
 *     summary: Delete user account
 *     security:
 *       - bearerAuth: []
 */
router.delete('/', profileController.deleteAccount);

export default router;
