import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProfileHeader } from '@/features/account/ProfileHeader';

// Мокаем JSON данные
vi.mock('@/mocks/profile.json', () => ({
    default: {
        avatarUrl: '/test-avatar.jpg',
        username: 'testuser',
        login: 'test@example.com'
    }
}));

describe('ProfileHeader', () => {

    it('shows profile info when not loading', () => {
        render(<ProfileHeader loading={false} />);
        // Проверяем только основные элементы
        expect(screen.getByAltText('testuser avatar')).toBeInTheDocument();
        expect(screen.getByText('testuser')).toBeInTheDocument();
    });

    it('renders without onClick prop', () => {
        render(<ProfileHeader loading={false} />);
        // Просто проверяем что компонент рендерится
        expect(screen.getByAltText('testuser avatar')).toBeInTheDocument();
    });
});