import { Request, Response, NextFunction } from 'express';
import { ProfileService } from './profile.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { AuthRequest } from '../../middlewares/auth.js';

const profileService = new ProfileService();

export class ProfileController {
  /**
   * Get current user profile
   */
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as AuthRequest).user!.userId;
      const profile = await profileService.getProfile(userId);

      return ApiResponse.success(res, profile);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as AuthRequest).user!.userId;
      const profile = await profileService.updateProfile(userId, req.body);

      return ApiResponse.success(res, profile);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password
   */
  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as AuthRequest).user!.userId;
      const result = await profileService.changePassword(userId, req.body);

      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete account
   */
  async deleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as AuthRequest).user!.userId;
      const result = await profileService.deleteAccount(userId);

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }
}
