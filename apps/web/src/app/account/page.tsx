import ProfileHeader from '@/features/account/ProfileHeader';
import ActionsList from '@/features/account/ActionsList';

export default function AccountPage() {
    return (
        <div className="flex h-screen">
            {/* Сайдбар (предполагается частью layout, включен здесь для контекста) */}
            <aside className="w-64 bg-gray-800 text-white p-4">
                <nav>
                    <ul>
                        <li><a href="/dashboard" className="text-purple-300">Панель управления</a></li>
                        <li><a href="/history" className="text-purple-300">История</a></li>
                        <li><a href="/account" className="text-purple-300">Настройки аккаунта</a></li>
                    </ul>
                </nav>
            </aside>

            {/* Основной контент */}
            <main className="flex-1 p-6 bg-gray-900 text-white">
                <div className="w-full h-12 mb-6 bg-gray-700 rounded animate-pulse" />
                <div className="max-w-2xl mx-auto">
                    <ProfileHeader />
                    <ActionsList />
                </div>
            </main>
        </div>
    );
}