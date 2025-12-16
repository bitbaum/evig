import { hashPassword, comparePassword, generateToken, verifyToken, hasRole } from '../src/utils/auth';
import { AuthToken } from '../src/models/User';

describe('Authentication Utilities', () => {
  describe('Password Hashing', () => {
    it('should hash password', async () => {
      const password = 'testPassword123!';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
      expect(hash).not.toBe(password);
    });

    it('should verify correct password', async () => {
      const password = 'testPassword123!';
      const hash = await hashPassword(password);

      const isValid = await comparePassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'testPassword123!';
      const wrongPassword = 'wrongPassword123!';
      const hash = await hashPassword(password);

      const isValid = await comparePassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });
  });

  describe('JWT Tokens', () => {
    const testUser: AuthToken = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      role: 'user',
    };

    it('should generate valid JWT token', () => {
      const token = generateToken(testUser);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('should verify valid JWT token', () => {
      const token = generateToken(testUser);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.id).toBe(testUser.id);
      expect(decoded?.email).toBe(testUser.email);
      expect(decoded?.first_name).toBe(testUser.first_name);
      expect(decoded?.last_name).toBe(testUser.last_name);
      expect(decoded?.role).toBe(testUser.role);
    });

    it('should reject invalid JWT token', () => {
      const invalidToken = 'invalid.jwt.token';
      const decoded = verifyToken(invalidToken);

      expect(decoded).toBeNull();
    });

    it('should reject expired JWT token', () => {
      // Mock JWT secret for testing expired tokens
      process.env.JWT_SECRET = 'test-secret-for-expired-token';

      // Create token that expires immediately
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyM2U0NTY3LWU4OWItMTJkMy1hNDU2LTQyNjYxNDE3NDAwMCIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImZpcnN0X25hbWUiOiJUZXN0IiwibGFzdF9uYW1lIjoiVXNlciIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNjgzNjAwMDAwLCJleHAiOjEwODM2MDAwMDB9.invalid';

      const decoded = verifyToken(expiredToken);
      expect(decoded).toBeNull();

      // Restore original secret
      delete process.env.JWT_SECRET;
    });
  });

  describe('Role Authorization', () => {
    it('should allow admin to access admin resources', () => {
      expect(hasRole('admin', 'admin')).toBe(true);
    });

    it('should allow admin to access editor resources', () => {
      expect(hasRole('admin', 'editor')).toBe(true);
    });

    it('should allow admin to access user resources', () => {
      expect(hasRole('admin', 'user')).toBe(true);
    });

    it('should allow editor to access editor resources', () => {
      expect(hasRole('editor', 'editor')).toBe(true);
    });

    it('should allow editor to access user resources', () => {
      expect(hasRole('editor', 'user')).toBe(true);
    });

    it('should not allow editor to access admin resources', () => {
      expect(hasRole('editor', 'admin')).toBe(false);
    });

    it('should allow user to access user resources', () => {
      expect(hasRole('user', 'user')).toBe(true);
    });

    it('should not allow user to access editor resources', () => {
      expect(hasRole('user', 'editor')).toBe(false);
    });

    it('should not allow user to access admin resources', () => {
      expect(hasRole('user', 'admin')).toBe(false);
    });
  });
});



