// e2e/history.spec.ts
// Никаких import из 'vitest'!

const isVitest = !!(globalThis as any).vi;

if (isVitest) {
  // Под Vitest добавляем пустой "проходной" тест, чтобы файл считался
  const itAny: any = (globalThis as any).it;
  const expectAny: any = (globalThis as any).expect;
  if (itAny && expectAny) {
    itAny('e2e shim (ignored in real e2e run)', () => {
      expectAny(true).toBe(true);
    });
  }
} else {
  // Под Playwright динамически грузим реальные тесты
  await import('./history.playwright');
}
