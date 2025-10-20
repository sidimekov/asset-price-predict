import Image from 'next/image';

// Мок-данные (будут заменены на вызов API позже)
const mockProfile = {
    username: 'Stepan Mikhailyuk',
    login: 'Anonymous123',
    avatarUrl: 'https://via.placeholder.com/150',
};

export default function ProfileHeader() {
    return (
        <div className="flex items-center mb-8">
            <div className="w-24 h-24 bg-gray-700 rounded-full mr-6 animate-pulse" />
            <div>
                <h1 className="text-white text-xl font-bold">Username: {mockProfile.username}</h1>
                <p className="text-gray-400 text-sm">Login: {mockProfile.login}</p>
            </div>
        </div>
    );
}