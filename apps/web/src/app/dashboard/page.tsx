import Skeleton from '@/shared/ui/Skeleton';

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-ink">Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-surface rounded-xl p-6 shadow-card">
            <Skeleton height="1rem" width="60%" />
            <Skeleton height="2rem" />
          </div>
        ))}
      </div>
    </div>
  );
}
