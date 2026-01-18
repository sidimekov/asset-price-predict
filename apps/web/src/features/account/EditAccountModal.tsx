'use client';

import React, { useEffect, useState } from 'react';
import type { Profile } from './model/types';
import type { EditAccountMode } from './model/editAccountModes';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import PasswordInput from '@/shared/ui/PasswordInput';

interface Props {
  open: boolean;
  mode: EditAccountMode;
  profile: Profile;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (payload: any) => void;
}

export const EditAccountModal: React.FC<Props> = ({
  open,
  mode,
  profile,
  loading = false,
  error,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<any>({});
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLocalError(null);

    // Подготовка формы для каждого режима
    switch (mode) {
      case 'profile': // Account Settings
        setForm({
          username: profile.username ?? '',
          login: profile.login ?? '',
          avatarUrl: profile.avatarUrl ?? '',
        });
        break;
      case 'avatar':
        setForm({ avatarUrl: profile.avatarUrl ?? '' });
        break;
      case 'username':
        setForm({ username: profile.username ?? '' });
        break;
      case 'login':
        setForm({ login: profile.login ?? '' });
        break;
      case 'password':
        setForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        break;
    }
  }, [open, mode, profile]);

  if (!open) return null;

  const validate = (): boolean => {
    setLocalError(null);

    if (mode === 'password') {
      if (form.newPassword.length < 8) {
        setLocalError('New password must be at least 8 characters');
        return false;
      }
      if (form.newPassword !== form.confirmPassword) {
        setLocalError('Passwords do not match');
        return false;
      }
      return true;
    }

    if (form.username !== undefined && form.username.trim().length < 3) {
      setLocalError('Username must be at least 3 characters');
      return false;
    }

    if (form.login !== undefined && form.login.trim().length < 3) {
      setLocalError('Email must be at least 3 characters');
      return false;
    }

    return true;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave(form); // profileService обновит состояние, Sidebar перерисуется
  };

  // ===== Avatar загрузка и ресайз =====
  const resizeImage = async (dataUrl: string, size: number) => {
    return new Promise<string>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        resolve(canvas.toDataURL('image/webp', 0.8));
      };
      img.src = dataUrl;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setLocalError('File is too large (max 5 MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      let result = ev.target?.result as string;
      result = await resizeImage(result, 256);
      setForm({ ...form, avatarUrl: result });
    };
    reader.readAsDataURL(file);
  };

  const titleMap: Record<EditAccountMode, string> = {
    profile: 'Account Settings', // вернули
    avatar: 'Edit photo',
    username: 'Change username',
    login: 'Change email',
    password: 'Change password',
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal max-w-md mx-auto p-6 bg-primary rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header mb-6">
          <h2 className="text-2xl font-bold">{titleMap[mode]}</h2>
        </header>

        <br />

        <div className="modal-body space-y-4">
          {(localError || error) && (
            <p className="text-red-600">{localError || error}</p>
          )}

          {mode === 'profile' && (
            <div className="space-y-2">
              <div className="relative w-32 h-32">
                <img
                  src={form.avatarUrl || '/images/profile-avatar.png'}
                  alt="Avatar preview"
                  className="w-32 h-32 rounded-full object-cover border"
                />

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                {/* Кастомный текст поверх */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white font-semibold rounded-full pointer-events-none">
                  Click to upload
                </div>
              </div>

              <br />

              <Input
                ariaDescribedby="username"
                placeholder="Username"
                value={form.username ?? ''}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />

              <Input
                ariaDescribedby="login"
                placeholder="Email"
                value={form.login ?? ''}
                onChange={(e) => setForm({ ...form, login: e.target.value })}
              />
            </div>
          )}

          {mode === 'avatar' && (
            <div className="relative w-32 h-32">
              <img
                src={form.avatarUrl || '/images/profile-avatar.png'}
                alt="Avatar preview"
                className="w-32 h-32 rounded-full object-cover border"
              />

              {/* Скрытый input */}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              {/* Кастомный текст поверх */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white font-semibold rounded-full pointer-events-none">
                Click to upload
              </div>
            </div>
          )}

          {mode === 'username' && (
            <Input
              ariaDescribedby="username"
              placeholder="Username"
              value={form.username ?? ''}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          )}

          {mode === 'login' && (
            <Input
              ariaDescribedby="login"
              placeholder="Email"
              value={form.login ?? ''}
              onChange={(e) => setForm({ ...form, login: e.target.value })}
            />
          )}

          {mode === 'password' && (
            <>
              <PasswordInput
                ariaDescribedby="currentPassword"
                placeholder="Current password"
                value={form.currentPassword ?? ''}
                onChange={(e) =>
                  setForm({ ...form, currentPassword: e.target.value })
                }
              />
              <PasswordInput
                ariaDescribedby="newPassword"
                placeholder="New password"
                value={form.newPassword ?? ''}
                onChange={(e) =>
                  setForm({ ...form, newPassword: e.target.value })
                }
              />
              <PasswordInput
                ariaDescribedby="confirmPassword"
                placeholder="Confirm password"
                value={form.confirmPassword ?? ''}
                onChange={(e) =>
                  setForm({ ...form, confirmPassword: e.target.value })
                }
              />
            </>
          )}
        </div>

        <br />

        <footer className="modal-footer mt-6 flex justify-between gap-4">
          <div className="flex-1 max-w-[120px]">
            <Button variant="primary" onClick={onClose}>
              Cancel
            </Button>
          </div>
          <div className="flex-1 max-w-[120px]">
            <Button onClick={handleSave} disabled={loading}>
              Save
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
};
