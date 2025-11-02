import { User } from '../../models/User.js';
import { hashPassword, comparePassword } from '../../utils/crypto.js';
import { generateAccessToken, generateRefreshToken, TokenPayload } from '../../utils/jwt.js';
import { AppError } from '../../middlewares/error.js';
import { RegisterDto, LoginDto } from './auth.dto.js';

export class AuthService {
  async register(data: RegisterDto) {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new AppError('Email already registered', 400, 'EMAIL_EXISTS');
    }

    const hashedPassword = await hashPassword(data.password);
    const user = await User.create({
      email: data.email,
      password: hashedPassword,
      name: data.name,
      phone: data.phone,
      address: data.address,
    });

    const payload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await User.findByIdAndUpdate(user._id, { refreshToken });

    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  async login(data: LoginDto) {
    const user = await User.findOne({ email: data.email }).select('+password');
    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const isPasswordValid = await comparePassword(data.password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const payload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await User.findByIdAndUpdate(user._id, { refreshToken });

    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  async refresh(oldRefreshToken: string) {
    const user = await User.findOne({ refreshToken: oldRefreshToken }).select('+refreshToken');
    if (!user) {
      throw new AppError('Invalid refresh token', 401, 'INVALID_TOKEN');
    }

    const payload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await User.findByIdAndUpdate(user._id, { refreshToken });

    return { accessToken, refreshToken };
  }

  async logout(userId: string) {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
  }
}
