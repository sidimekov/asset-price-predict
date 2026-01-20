'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import PasswordInput from '@/shared/ui/PasswordInput';
import type { UpdateAccountReq } from '@assetpredict/shared';
import type { AccountEditMode } from './model/accountTypes';
import {
  MAX_AVATAR_SIZE_BYTES,
  resizeImageToSquare,
} from './model/avatarUtils';

interface Props {
  mode: AccountEditMode | null;
  profile: {
    username?: string;
    email?: string;
    avatarUrl?: string;
  };
  onCancel: () => void;
  onSave: (patch: UpdateAccountReq) => void;
}

export const EditAccountModal: React.FC<Props> = ({
  mode,
  profile,
  onCancel,
  onSave,
}) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mode) return;

    setUsername(profile.username ?? '');
    setEmail(profile.email ?? '');
    setAvatarPreview(profile.avatarUrl ?? null);
    setAvatarBlob(null);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
  }, [mode, profile]);

  if (!mode) return null; // показываем ActionsList снаружи, если mode = null

  const canSave = (() => {
    switch (mode) {
      case 'avatar':
        return !!avatarBlob && !!avatarPreview;
      case 'username':
        return username.trim().length > 0;
      case 'email':
        return email.trim().length > 0;
      case 'password':
        return (
          currentPassword.length > 0 &&
          newPassword.length > 0 &&
          confirmPassword.length > 0
        );
      default:
        return true;
    }
  })();

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      setError('File is too large (max 5 MB)');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Invalid file type');
      return;
    }

    try {
      const blob = await resizeImageToSquare(file, 256);
      const previewUrl = URL.createObjectURL(blob);

      setAvatarBlob(blob);
      setAvatarPreview(previewUrl);
      setError(null);
    } catch {
      setError('Failed to process image');
    }
  };

  const handleSave = () => {
    switch (mode) {
      case 'avatar':
        if (!avatarBlob || !avatarPreview) return;
        onSave({ avatarUrl: avatarPreview });
        break;

      case 'username':
        onSave({ username: username.trim() });
        break;

      case 'email':
        onSave({ email: email.trim() });
        break;

      case 'password':
        if (!currentPassword || !newPassword || !confirmPassword) {
          setError('All fields are required');
          return;
        }
        if (newPassword.length < 6) {
          setError('Password must be at least 6 characters');
          return;
        }
        if (newPassword !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        onSave({ currentPassword, password: newPassword });
        break;
    }

    onCancel(); // скрываем форму и возвращаем ActionsList
  };

  // заголовок в зависимости от режима
  const headerMap: Record<AccountEditMode, string> = {
    avatar: 'Change Photo',
    username: 'Change Username',
    email: 'Change Email',
    password: 'Change Password',
    profile: 'Edit Profile',
  };
  const headerTitle = mode ? headerMap[mode] : '';

  return (
    <div className="inline-edit-container space-y-4 p-4">
      <h3 className="text-xl font-semibold">{headerTitle}</h3>
      <br />

      {mode === 'profile' || mode === 'avatar' ? (
        <div className="space-y-4">
          <div className="relative w-40 h-40 mx-auto">
            <img
              src={avatarPreview || '/images/profile-avatar.png'}
              alt="Avatar preview"
              className="w-40 h-40 rounded-full object-cover border"
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarFile}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white font-semibold rounded-full hover:bg-black/20 text-center text-sm pointer-events-none">
              {avatarPreview ? 'File selected' : 'Click to upload'}
            </div>
          </div>

          {mode === 'profile' && (
            <>
              <br />
              <Input
                ariaDescribedby=""
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <br />
              <Input
                ariaDescribedby=""
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </>
          )}

          {error && <div className="error-text text-center">{error}</div>}
        </div>
      ) : null}

      {mode === 'username' && (
        <Input
          ariaDescribedby=""
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      )}

      {mode === 'email' && (
        <Input
          ariaDescribedby=""
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      )}

      {mode === 'password' && (
        <div className="space-y-4">
          <PasswordInput
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <br />
          <PasswordInput
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <br />
          <PasswordInput
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {error && <div className="error-text text-center">{error}</div>}
        </div>
      )}

      <br />
      <div className="flex gap-2 justify-end mt-2">
        <Button variant="primary" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!canSave}>
          Save
        </Button>
      </div>
    </div>
  );
};
