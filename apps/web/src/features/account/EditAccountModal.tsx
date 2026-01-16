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

  // Инициализация формы при открытии модалки
  useEffect(() => {
    if (!open) return;

    setLocalError(null);

    switch (mode) {
      case 'profile':
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
    const trim = (v: string) => v.trim();

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

    if (form.username !== undefined) {
      if (trim(form.username).length < 3) {
        setLocalError('Username must be at least 3 characters');
        return false;
      }
    }

    if (form.login !== undefined) {
      if (trim(form.login).length < 3) {
        setLocalError('Email must be at least 3 characters');
        return false;
      }
    }

    return true;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave(form);
  };

  const titleMap: Record<EditAccountMode, string> = {
    profile: 'Account settings',
    avatar: 'Edit photo',
    username: 'Change username',
    login: 'Change email',
    password: 'Change password',
  };

  return (
    <div className="modal-overlay">
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

          {/* Не password поля */}
          {mode !== 'password' && (
            <>
              {'avatarUrl' in form && (
                <Input
                  ariaDescribedby="avatarUrl"
                  placeholder="Avatar URL"
                  value={form.avatarUrl ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, avatarUrl: e.target.value })
                  }
                />
              )}

              {'username' in form && (
                <Input
                  ariaDescribedby="username"
                  placeholder="Username"
                  value={form.username ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                />
              )}

              {'login' in form && (
                <Input
                  ariaDescribedby="login"
                  placeholder="Email"
                  value={form.login ?? ''}
                  onChange={(e) => setForm({ ...form, login: e.target.value })}
                />
              )}
            </>
          )}

          {/* Password */}
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
