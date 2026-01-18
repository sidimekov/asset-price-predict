// apps/web/src/app/layout.tsx
'use client';

import './globals.css';
import { Sidebar } from '@/shared/ui/Sidebar';
import { Container } from '@/shared/ui/Container';
import { YandexMetrika } from '@/shared/ui/YandexMetrika';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { StoreProvider } from '@/app/providers/StoreProvider';
import { ProfileProvider } from '@/features/account/ProfileContext'; // <-- добавляем

const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const mockAuth = true;
    setIsAuthenticated(mockAuth);
  }, []);

  return { isAuthenticated };
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const publicPaths = ['/auth', '/'];
  const isPublicPage = publicPaths.includes(pathname);

  const showAppLayout = isAuthenticated && !isPublicPage;

  if (isAuthenticated === null) {
    return (
      <html lang="ru">
        <body className="bg-primary min-h-screen flex items-center justify-center">
          <StoreProvider>
            <div className="text-ink text-lg">Загрузка...</div>
          </StoreProvider>
        </body>
      </html>
    );
  }

  return (
    <html lang="ru">
      <body className="bg-primary text-ink font-sans antialiased min-h-screen">
        <StoreProvider>
          <ProfileProvider>
            {' '}
            {/* <-- оборачиваем в ProfileProvider */}
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
          </ProfileProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
