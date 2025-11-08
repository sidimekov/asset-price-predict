import Skeleton from '@/shared/ui/Skeleton';

export default function AccountPage() {
    return (
        <div className="space-y-8 max-w-2xl">
            <h1 className="text-3xl font-bold text-ink">Настройки аккаунта</h1>
            <div className="bg-surface rounded-xl p-6 shadow-card space-y-6">
                <div>
                    <Skeleton height="1rem" width="30%" />
                    <Skeleton height="3rem" />
                </div>
                <Skeleton height="3rem" width="150px" />
            </div>
        </div>
    );
}