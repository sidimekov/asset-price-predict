import { render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ServiceWorkerRegister } from '@/app/ServiceWorkerRegister';

describe('ServiceWorkerRegister', () => {
  const originalServiceWorker = navigator.serviceWorker;

  afterEach(() => {
    if (originalServiceWorker) {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: originalServiceWorker,
        configurable: true,
      });
    } else {
      // @ts-expect-error - allow delete serviceWorker for test cleanup
      delete navigator.serviceWorker;
    }
    vi.restoreAllMocks();
  });

  it('регистрация service worker, если поддерживается', async () => {
    const register = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { register },
      configurable: true,
    });

    render(<ServiceWorkerRegister />);

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith('/sw.js');
    });
  });

  it('логирование при ошибке регистрации sw', async () => {
    const error = new Error('boom');
    const register = vi.fn().mockRejectedValue(error);
    const warnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);

    Object.defineProperty(navigator, 'serviceWorker', {
      value: { register },
      configurable: true,
    });

    render(<ServiceWorkerRegister />);

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith('/sw.js');
      expect(warnSpy).toHaveBeenCalledWith(
        'Service worker registration failed',
        error,
      );
    });
  });
});
