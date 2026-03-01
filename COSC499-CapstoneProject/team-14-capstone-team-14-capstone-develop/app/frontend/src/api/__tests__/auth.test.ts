// src/api/__tests__/auth.test.ts

import MockAdapter from 'axios-mock-adapter';
import axiosInstance from '../axiosInstance';
import {
  forgotPassword,
  validateResetToken,
  resetPassword,
  changePassword,
} from '../auth';

const mock = new MockAdapter(axiosInstance);

describe('Auth API - Password Reset Functions', () => {
  afterEach(() => {
    mock.reset();
  });

  describe('forgotPassword', () => {
    test('successfully sends forgot password request', async () => {
      mock.onPost('/auth/forgot-password/').reply(200, {
        message: 'Reset email sent',
      });

      const result = await forgotPassword('test@example.com');

      expect(result).toEqual({ success: true });
      expect(mock.history.post[0].data).toBe(
        JSON.stringify({ email: 'test@example.com' })
      );
    });

    test('handles forgot password error', async () => {
      mock.onPost('/auth/forgot-password/').reply(400, {
        message: 'User not found',
      });

      const result = await forgotPassword('nonexistent@example.com');

      expect(result).toEqual({ success: false, error: 'User not found' });
    });

    test('handles network error', async () => {
      mock.onPost('/auth/forgot-password/').networkError();

      const result = await forgotPassword('test@example.com');

      expect(result).toEqual({
        success: false,
        error: 'Failed to send reset email',
      });
    });
  });

  describe('validateResetToken', () => {
    test('successfully validates token', async () => {
      mock.onPost('/auth/validate-reset-token/').reply(200, {
        valid: true,
        email: 'test@example.com',
      });

      const result = await validateResetToken('uid123', 'token123');

      expect(result).toEqual({
        success: true,
        data: { valid: true, email: 'test@example.com' },
      });
      expect(mock.history.post[0].data).toBe(
        JSON.stringify({ uid: 'uid123', token: 'token123' })
      );
    });

    test('handles invalid token', async () => {
      mock.onPost('/auth/validate-reset-token/').reply(400, {
        message: 'Invalid or expired token',
      });

      const result = await validateResetToken('uid123', 'invalid-token');

      expect(result).toEqual({
        success: false,
        error: 'Invalid or expired token',
      });
    });
  });

  describe('resetPassword', () => {
    test('successfully resets password', async () => {
      mock.onPost('/auth/reset-password/').reply(200, {
        message: 'Password reset successfully',
      });

      const result = await resetPassword('uid123', 'token123', 'NewPass123!');

      expect(result).toEqual({
        success: true,
        data: { message: 'Password reset successfully' },
      });
      expect(mock.history.post[0].data).toBe(
        JSON.stringify({
          uid: 'uid123',
          token: 'token123',
          new_password: 'NewPass123!',
        })
      );
    });

    test('handles reset password error', async () => {
      mock.onPost('/auth/reset-password/').reply(400, {
        message: 'Invalid token',
      });

      const result = await resetPassword(
        'uid123',
        'invalid-token',
        'NewPass123!'
      );

      expect(result).toEqual({ success: false, error: 'Invalid token' });
    });
  });

  describe('changePassword', () => {
    test('successfully changes password', async () => {
      mock.onPost('/auth/change-password/').reply(200, {
        message: 'Password changed successfully',
      });

      const result = await changePassword('OldPass123!', 'NewPass123!');

      expect(result).toEqual({
        success: true,
        data: { message: 'Password changed successfully' },
      });
      expect(mock.history.post[0].data).toBe(
        JSON.stringify({
          current_password: 'OldPass123!',
          new_password: 'NewPass123!',
        })
      );
    });

    test('handles incorrect current password', async () => {
      mock.onPost('/auth/change-password/').reply(400, {
        message: 'Current password is incorrect',
      });

      const result = await changePassword('WrongPass123!', 'NewPass123!');

      expect(result).toEqual({
        success: false,
        error: 'Current password is incorrect',
      });
    });
  });
});
