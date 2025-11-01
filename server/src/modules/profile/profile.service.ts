import { User } from '../../models/User.js';
import { hashPassword, comparePassword } from '../../utils/crypto.js';
import { AppError } from '../../middlewares/error.js';
import { UpdateProfileDto, ChangePasswordDto } from './profile.dto.js';

export class ProfileService {
  /**
   * Get user profile by ID
   */
  async getProfile(userId: string) {
    const user = await User.findById(userId).select('-password -refreshToken');
    
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return {
      id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      address: user.address,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: UpdateProfileDto) {
    // Check if email is being changed and if it's already taken
    if (data.email) {
      const existingUser = await User.findOne({
        email: data.email,
        _id: { $ne: userId }, // Exclude current user
      });

      if (existingUser) {
        throw new AppError('Email already in use', 400, 'EMAIL_IN_USE');
      }
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          ...(data.name && { name: data.name }),
          ...(data.email && { email: data.email }),
          ...(data.phone !== undefined && { phone: data.phone || undefined }),
          ...(data.address !== undefined && { address: data.address || undefined }),
        },
      },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return {
      id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      address: user.address,
      role: user.role,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, data: ChangePasswordDto) {
    // Get user with password
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Verify current password
    const isPasswordValid = await comparePassword(
      data.currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 401, 'INVALID_PASSWORD');
    }

    // Check if new password is same as current
    const isSamePassword = await comparePassword(data.newPassword, user.password);
    if (isSamePassword) {
      throw new AppError(
        'New password must be different from current password',
        400,
        'SAME_PASSWORD'
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(data.newPassword);

    // Update password
    await User.findByIdAndUpdate(userId, {
      password: hashedPassword,
    });

    return { message: 'Password changed successfully' };
  }

  /**
   * Delete user account (soft delete - optional feature)
   */
  async deleteAccount(userId: string) {
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return { message: 'Account deleted successfully' };
  }
}
