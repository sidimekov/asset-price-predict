// AccountPage.noImport.test.tsx
import { describe, it, expect, vi } from 'vitest';

describe('AccountPage тест без импорта', () => {
  // Сначала мокаем всё
  vi.mock('next/navigation', () => ({
    useRouter: vi.fn(),
  }));

  vi.mock('@/shared/api/account.api', () => ({
    useGetMeQuery: vi.fn(),
    useUpdateMeMutation: vi.fn(),
    accountApi: { util: { updateQueryData: vi.fn() } },
  }));

  vi.mock('@/shared/api/auth.api', () => ({
    useLogoutMutation: vi.fn(),
  }));

  vi.mock('@/shared/api/backendApi', () => ({
    backendApi: { util: { resetApiState: vi.fn() } },
  }));

  vi.mock('@/shared/store/hooks', () => ({
    useAppDispatch: vi.fn(),
  }));

  it('проверяет что тесты работают', () => {
    // Простейший тест чтобы убедиться что vitest работает
    expect(1 + 1).toBe(2);
  });

  it('может создать моки', async () => {
    // Проверяем что можем импортировать мокированные модули
    const accountApi = await import('@/shared/api/account.api');
    expect(accountApi.useGetMeQuery).toBeDefined();

    const authApi = await import('@/shared/api/auth.api');
    expect(authApi.useLogoutMutation).toBeDefined();
  });
});
