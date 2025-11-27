'use client';

import React, { Component, ReactNode, useEffect } from 'react';
import { captureException, initMonitoring } from './sentry';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

class Boundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    captureException(error, { componentStack: info.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return <div className="p-4 text-ink">something went wrong</div>;
    }

    return this.props.children;
  }
}

export const MonitoringBoundary = ({ children }: Props) => {
  useEffect(() => {
    initMonitoring();
  }, []);

  return <Boundary>{children}</Boundary>;
};
