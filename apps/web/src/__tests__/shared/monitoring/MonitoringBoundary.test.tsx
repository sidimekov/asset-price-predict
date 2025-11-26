import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/monitoring/sentry', () => ({
  initMonitoring: vi.fn(),
  captureException: vi.fn(),
}));

import { MonitoringBoundary } from '@/shared/monitoring/MonitoringBoundary';
import { captureException, initMonitoring } from '@/shared/monitoring/sentry';

const SafeChild = () => <div>safe child</div>;

const Boom = () => {
  throw new Error('boom');
};

describe('MonitoringBoundary', () => {
  it('initializes monitoring and renders children', async () => {
    render(
      <MonitoringBoundary>
        <SafeChild />
      </MonitoringBoundary>,
    );

    await waitFor(() => expect(initMonitoring).toHaveBeenCalledTimes(1));
    expect(screen.getByText('safe child')).toBeInTheDocument();
  });

  it('captures errors and renders fallback', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <MonitoringBoundary>
        <Boom />
      </MonitoringBoundary>,
    );

    await waitFor(() => expect(screen.getByText('something went wrong')).toBeInTheDocument());
    expect(captureException).toHaveBeenCalledWith(expect.any(Error), {
      componentStack: expect.stringContaining('Boom'),
    });
    consoleSpy.mockRestore();
  });
});
