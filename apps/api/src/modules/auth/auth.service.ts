import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from '../users/entities/user.entity';
import { Role } from './entities/role.entity';
import { RegisterDto, LoginDto, UserResponseDto } from './dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<{ user: UserResponseDto; accessToken: string }> {
    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Check if username already exists (if provided)
    if (dto.username) {
      const existingUsername = await this.userRepository.findOne({
        where: { username: dto.username },
      });

      if (existingUsername) {
        throw new ConflictException('Username already taken');
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Get default user role
    const userRole = await this.roleRepository.findOne({
      where: { key: 'user' },
    });

    // Create user
    const user = this.userRepository.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      displayName: dto.displayName,
      username: dto.username || null,
      status: UserStatus.ACTIVE,
      roles: userRole ? [userRole] : [],
    });

    await this.userRepository.save(user);

    // Generate tokens
    const accessToken = this.generateAccessToken(user);

    return {
      user: this.mapUserToResponse(user),
      accessToken,
    };
  }

  async login(dto: LoginDto): Promise<{ user: UserResponseDto; accessToken: string }> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    // Generate tokens
    const accessToken = this.generateAccessToken(user);

    return {
      user: this.mapUserToResponse(user),
      accessToken,
    };
  }

  async refreshToken(user: User): Promise<{ accessToken: string }> {
    const accessToken = this.generateAccessToken(user);
    return { accessToken };
  }

  async getMe(user: User): Promise<UserResponseDto> {
    // Reload user with all relations
    const fullUser = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['roles', 'roles.permissions'],
    });

    if (!fullUser) {
      throw new NotFoundException('User not found');
    }

    return this.mapUserToResponse(fullUser);
  }

  private generateAccessToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    return this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
    });
  }

  private mapUserToResponse(user: User): UserResponseDto {
    const roles = user.roles?.map((role) => role.key) || [];
    const permissions = new Set<string>();

    if (user.roles) {
      for (const role of user.roles) {
        if (role.permissions) {
          for (const permission of role.permissions) {
            permissions.add(permission.key);
          }
        }
      }
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      status: user.status,
      roles,
      permissions: Array.from(permissions),
      createdAt: user.createdAt,
    };
  }
}
