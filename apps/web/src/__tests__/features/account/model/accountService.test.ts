// accountService.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { accountService } from '@/features/account/model/accountService';
import profileMock from '@/mocks/profile.json';

describe('accountService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getProfile', () => {
    it('should return profile from localStorage when available', async () => {
      const storedProfile = {
        username: 'stored',
        login: 'stored@test.com',
        avatarUrl: '',
      };
      localStorage.setItem('ap.profile.v1', JSON.stringify(storedProfile));

      const promise = accountService.getProfile();
      vi.advanceTimersByTime(150);
      const result = await promise;

      expect(result).toEqual(storedProfile);
    });

    it('should return mock profile when localStorage is empty', async () => {
      const promise = accountService.getProfile();
      vi.advanceTimersByTime(150);
      const result = await promise;

      expect(result).toEqual(profileMock);
    });

    it('should handle invalid JSON in localStorage', async () => {
      localStorage.setItem('ap.profile.v1', 'invalid json');

      const promise = accountService.getProfile();
      vi.advanceTimersByTime(150);
      const result = await promise;

      expect(result).toEqual(profileMock);
      expect(localStorage.getItem('ap.profile.v1')).toBeNull();
    });
  });

  describe('changePassword', () => {
    it('should succeed with valid password', async () => {
      const promise = accountService.changePassword({
        currentPassword: 'old123',
        newPassword: 'newpassword123',
      });
      vi.advanceTimersByTime(200);

      await expect(promise).resolves.not.toThrow();
    });

    it('should throw error for short password', async () => {
      const promise = accountService.changePassword({
        currentPassword: 'old123',
        newPassword: 'short',
      });
      vi.advanceTimersByTime(200);

      await expect(promise).rejects.toThrow('Password too short');
    });
  });
});
