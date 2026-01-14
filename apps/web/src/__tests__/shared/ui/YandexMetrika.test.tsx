import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { YandexMetrika } from '@/shared/ui/YandexMetrika';

// Мокаем process.env
vi.mock('process', () => ({
    env: {
        NEXT_PUBLIC_YM_ID: undefined
    }
}));

// Мокаем next/script
vi.mock('next/script', () => ({
    default: ({ id, strategy, children }: any) => {
        return (
            <script
                data-testid={`script-${id}`}
                data-strategy={strategy}
                dangerouslySetInnerHTML={{ __html: children as string }}
            />
        );
    }
}));

describe('YandexMetrika', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
        vi.resetModules();
        process.env = { ...OLD_ENV };
    });

    afterEach(() => {
        process.env = OLD_ENV;
    });

    describe('когда NEXT_PUBLIC_YM_ID не установлен', () => {
        it('возвращает null', () => {
            delete process.env.NEXT_PUBLIC_YM_ID;
            const { container } = render(<YandexMetrika />);
            expect(container.firstChild).toBeNull();
        });

        it('не рендерит скрипт', () => {
            delete process.env.NEXT_PUBLIC_YM_ID;
            render(<YandexMetrika />);
            expect(screen.queryByTestId('script-yandex-metrika')).toBeNull();
        });
    });

    describe('когда NEXT_PUBLIC_YM_ID установлен', () => {
        const ymId = '12345678';

        beforeEach(() => {
            process.env.NEXT_PUBLIC_YM_ID = ymId;
        });

        it('рендерит Script компонент', () => {
            render(<YandexMetrika />);
            const script = screen.getByTestId('script-yandex-metrika');
            expect(script).toBeInTheDocument();
        });

        it('использует правильную стратегию загрузки', () => {
            render(<YandexMetrika />);
            const script = screen.getByTestId('script-yandex-metrika');
            expect(script.getAttribute('data-strategy')).toBe('afterInteractive');
        });

        it('вставляет правильный Yandex Metrika код', () => {
            render(<YandexMetrika />);
            const script = screen.getByTestId('script-yandex-metrika');
            const scriptContent = script.innerHTML;

            expect(scriptContent).toContain('ym(');
            expect(scriptContent).toContain(ymId);
            expect(scriptContent).toContain('clickmap:true');
            expect(scriptContent).toContain('trackLinks:true');
            expect(scriptContent).toContain('accurateTrackBounce:true');
            expect(scriptContent).toContain('webvisor:true');
            expect(scriptContent).toContain('https://mc.yandex.ru/metrika/tag.js');
        });

        it('содержит правильный id в скрипте', () => {
            render(<YandexMetrika />);
            const script = screen.getByTestId('script-yandex-metrika');
            const scriptContent = script.innerHTML;

            expect(scriptContent).toContain(`ym(${ymId}, "init"`);
        });

        it('корректно обрабатывает разные ID', () => {
            const testIds = ['12345', '67890', 'abcdef'];

            testIds.forEach(testId => {
                process.env.NEXT_PUBLIC_YM_ID = testId;
                const { unmount } = render(<YandexMetrika />);

                const script = screen.getByTestId('script-yandex-metrika');
                const scriptContent = script.innerHTML;
                expect(scriptContent).toContain(testId);

                unmount();
            });
        });
    });

    describe('типы и пропсы', () => {
        it('является React компонентом', () => {
            expect(typeof YandexMetrika).toBe('function');
        });

        it('не принимает пропсы', () => {
            // Компонент не имеет пропсов
            const component = <YandexMetrika />;
            expect(component.props).toEqual({});
        });
    });
});