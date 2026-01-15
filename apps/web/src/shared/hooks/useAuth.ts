'use client';

import { useState, useEffect } from 'react';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mockAuth = localStorage.getItem('ap.auth.mock') === 'true';
    setIsAuthenticated(mockAuth);
  }, []);

  return { isAuthenticated, setIsAuthenticated };
}
