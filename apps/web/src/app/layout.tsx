'use client';

import './globals.css';
import { Sidebar } from '@/shared/ui/Sidebar';
import { Container } from '@/shared/ui/Container';
import { YandexMetrika } from '@/shared/ui/YandexMetrika';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { StoreProvider } from '@/app/providers/StoreProvider';
import { useGetMeQuery } from '@/shared/api/account.api';
import { backendApi } from '@/shared/api/backendApi';
import { useAppDispatch } from '@/shared/store/hooks';
import type { HttpError } from '@/shared/networking/types';

const publicPaths = ['/auth', '/'];

const AppShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    const storedToken =
      typeof localStorage === 'undefined'
        ? null
        : localStorage.getItem('auth.token');
    setToken(storedToken);
    setIsAuthChecked(true);
  }, [pathname]);

  const safePathname = pathname ?? '';
  const isPublicPage = publicPaths.includes(safePathname);
  const { error: accountError } = useGetMeQuery(undefined, {
    skip: !token,
  });

  useEffect(() => {
    if (!isAuthChecked) {
      return;
    }
    if (!token && !isPublicPage) {
      router.replace('/auth');
    }
  }, [token, isPublicPage, isAuthChecked, router]);

  useEffect(() => {
    const isHttpError = (error: unknown): error is HttpError =>
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      typeof (error as HttpError).status === 'number';

    if (token && isHttpError(accountError) && accountError.status === 401) {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('auth.token');
      }
      setToken(null);
      dispatch(backendApi.util.resetApiState());
      router.replace('/auth');
    }
  }, [token, accountError, dispatch, router]);

  if (!isAuthChecked || (!token && !isPublicPage)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-ink text-lg">Загрузка...</div>
      </div>
    );
  }

  const showAppLayout = !!token && !isPublicPage;

  return (
    <>
      <YandexMetrika />
      {showAppLayout ? (
        <div className="flex h-screen overflow-hidden">
          <div className={sidebarOpen ? 'sidebar' : 'sidebar collapsed'}>
            <Sidebar />
          </div>

          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <div className="flex-1 flex flex-col overflow-hidden">
            <header className="lg:hidden bg-surface-dark border-b border-white/10 px-4 py-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-ink focus-visible:ring-2 focus-visible:ring-accent rounded p-1"
                aria-label="Открыть меню"
              >
                <Menu size={24} />
              </button>
            </header>

            <main className="flex-1 overflow-y-auto">
              <Container>
                <div className="py-8">{children}</div>
              </Container>
            </main>
          </div>
        </div>
      ) : (
        <>{children}</>
      )}
    </>
  );
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="bg-primary text-ink font-sans antialiased min-h-screen">
        <StoreProvider>
          <AppShell>{children}</AppShell>
        </StoreProvider>
      </body>
    </html>
  );
}
