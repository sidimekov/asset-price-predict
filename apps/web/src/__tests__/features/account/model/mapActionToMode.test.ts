// mapActionToMode.test.ts
import { describe, it, expect } from 'vitest';
import { mapActionToMode } from '@/features/account/model/mapActionToMode';

describe('mapActionToMode', () => {
  it('should map "Edit photo" to "avatar"', () => {
    expect(mapActionToMode('Edit photo')).toBe('avatar');
  });

  it('should map "Change username" to "username"', () => {
    expect(mapActionToMode('Change username')).toBe('username');
  });

  it('should map "Change login" to "login"', () => {
    expect(mapActionToMode('Change login')).toBe('login');
  });

  it('should map "Change password" to "password"', () => {
    expect(mapActionToMode('Change password')).toBe('password');
  });

  it('should return null for unknown action', () => {
    expect(mapActionToMode('Unknown action')).toBeNull();
  });

  it('should return null for "Log out"', () => {
    expect(mapActionToMode('Log out')).toBeNull();
  });
});
