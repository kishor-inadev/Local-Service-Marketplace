/// <reference types="jest" />

// Mock ESM-only dependencies before any imports
jest.mock('otplib', () => ({
  authenticator: { generate: jest.fn().mockReturnValue('123456'), verify: jest.fn().mockReturnValue(true), generateSecret: jest.fn().mockReturnValue('MOCKSECRET') },
  verifySync: jest.fn().mockReturnValue(false),
}));

import { AuthService } from './auth.service';
import {
  UnauthorizedException,
  ConflictException,
  TooManyRequestsException,
} from '@/common/exceptions/http.exceptions';

// ─── Helpers ────────────────────────────────────────────────────────────────

const makeLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
} as any);

const makeActiveUser = (overrides = {}) => ({
  id: 'user-1',
  email: 'alice@example.com',
  password_hash: null as string | null,
  name: 'Alice',
  role: 'customer',
  status: 'active',
  email_verified: true,
  phone_verified: false,
  profile_picture_url: null,
  timezone: 'UTC',
  language: 'en',
  last_login_at: null,
  ...overrides,
});

const makeService = (overrides: {
  userRepo?: any;
  sessionRepo?: any;
  loginAttemptRepo?: any;
  jwtService?: any;
} = {}) => {
  const userRepo = overrides.userRepo ?? {
    findByEmail: jest.fn(),
    findByPhone: jest.fn(),
    create: jest.fn(),
    updateLastLogin: jest.fn().mockResolvedValue(undefined),
  };
  const sessionRepo = overrides.sessionRepo ?? {
    create: jest.fn().mockResolvedValue(undefined),
  };
  const loginAttemptRepo = overrides.loginAttemptRepo ?? {
    countRecentFailedAttempts: jest.fn().mockResolvedValue(0),
    create: jest.fn().mockResolvedValue(undefined),
  };
  const jwtService = overrides.jwtService ?? {
    generateAccessToken: jest.fn().mockReturnValue('access-token'),
    generateRefreshToken: jest.fn().mockReturnValue('refresh-token'),
  };

  const service = new AuthService(
    userRepo,
    sessionRepo,
    loginAttemptRepo,
    { findBySocialId: jest.fn(), createOrUpdate: jest.fn() } as any, // socialAccountRepo
    { findByUserId: jest.fn() } as any,                              // twoFactorSecretRepo
    { create: jest.fn(), findByToken: jest.fn() } as any,            // magicLinkTokenRepo
    { create: jest.fn() } as any,                                    // loginHistoryRepo
    { create: jest.fn() } as any,                                    // accountDeletionRequestRepo
    jwtService,
    {
      createEmailVerificationToken: jest.fn().mockResolvedValue('verify-token-123'),
      createPasswordResetToken: jest.fn(),
    } as any,                                                        // tokenService
    { sendSms: jest.fn() } as any,                                   // smsClient
    { sendEmail: jest.fn().mockResolvedValue(undefined) } as any,    // notificationClient
    {
      get: jest.fn().mockReturnValue('5'),                           // MAX_LOGIN_ATTEMPTS & more
    } as any,                                                        // configService
    makeLogger(),
  );

  return { service, userRepo, sessionRepo, loginAttemptRepo, jwtService };
};

// ─── AuthService.login ───────────────────────────────────────────────────────

describe('AuthService.login', () => {
  it('returns tokens on successful login', async () => {
    const passwordHash = '$2a$10$abc'; // placeholder — bcrypt.compare is mocked below
    const user = makeActiveUser({ password_hash: passwordHash });

    const { service, userRepo, sessionRepo, loginAttemptRepo, jwtService } = makeService({
      userRepo: {
        findByEmail: jest.fn().mockResolvedValue(user),
        updateLastLogin: jest.fn().mockResolvedValue(undefined),
      },
    });

    // Spy on bcrypt.compare via jest.mock is heavy; instead patch through a spy
    const bcrypt = require('bcryptjs');
    jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true);

    const result = await service.login({ email: 'alice@example.com', password: 'correct' });

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.user.email).toBe('alice@example.com');
    expect(loginAttemptRepo.create).toHaveBeenCalledWith('alice@example.com', true, undefined);
  });

  it('throws UnauthorizedException on wrong password', async () => {
    const user = makeActiveUser({ password_hash: 'hash' });
    const { service } = makeService({
      userRepo: {
        findByEmail: jest.fn().mockResolvedValue(user),
        updateLastLogin: jest.fn(),
      },
    });

    const bcrypt = require('bcryptjs');
    jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false);

    await expect(service.login({ email: 'alice@example.com', password: 'wrong' })).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException when user not found', async () => {
    const { service } = makeService({
      userRepo: { findByEmail: jest.fn().mockResolvedValue(null), updateLastLogin: jest.fn() },
    });

    await expect(service.login({ email: 'ghost@example.com', password: 'any' })).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws TooManyRequestsException on too many failed attempts', async () => {
    const { service } = makeService({
      loginAttemptRepo: {
        countRecentFailedAttempts: jest.fn().mockResolvedValue(5),
        create: jest.fn(),
      },
    });

    await expect(service.login({ email: 'alice@example.com', password: 'any' })).rejects.toThrow(
      TooManyRequestsException,
    );
  });

  it('throws UnauthorizedException when account is not active', async () => {
    const user = makeActiveUser({ status: 'suspended', password_hash: 'hash' });
    const { service } = makeService({
      userRepo: { findByEmail: jest.fn().mockResolvedValue(user), updateLastLogin: jest.fn() },
    });

    const bcrypt = require('bcryptjs');
    jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true);

    await expect(service.login({ email: 'alice@example.com', password: 'correct' })).rejects.toThrow(
      UnauthorizedException,
    );
  });
});

// ─── AuthService.register ────────────────────────────────────────────────────

describe('AuthService.register', () => {
  it('creates user and returns success message', async () => {
    const createdUser = makeActiveUser();
    const { service, userRepo } = makeService({
      userRepo: {
        findByEmail: jest.fn().mockResolvedValue(null),
        findByPhone: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(createdUser),
        updateLastLogin: jest.fn(),
      },
    });

    const result = await service.register({
      email: 'alice@example.com',
      name: 'Alice',
      userType: 'customer',
    } as any);

    expect(userRepo.create).toHaveBeenCalled();
    expect(result.email).toBe('alice@example.com');
    expect(result.message).toMatch(/success/i);
  });

  it('throws ConflictException on duplicate email', async () => {
    const { service } = makeService({
      userRepo: {
        findByEmail: jest.fn().mockResolvedValue(makeActiveUser()),
        findByPhone: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        updateLastLogin: jest.fn(),
      },
    });

    await expect(
      service.register({ email: 'alice@example.com', name: 'Alice', userType: 'customer' } as any),
    ).rejects.toThrow(ConflictException);
  });

  it('throws BadRequestException when neither email nor phone is provided', async () => {
    const { service } = makeService();
    const { BadRequestException: BE } = await import('@/common/exceptions/http.exceptions');

    await expect(service.register({ name: 'Alice' } as any)).rejects.toThrow(BE);
  });
});
