import Skeleton from '@/shared/ui/Skeleton';

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-ink">История</h1>
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-surface rounded-lg p-4 shadow-soft">
            <Skeleton height="1rem" width="70%" />
            <Skeleton height="0.875rem" width="40%" />
          </div>
        ))}
      </div>
    </div>
  );
}
