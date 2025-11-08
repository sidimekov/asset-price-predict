import Skeleton from '@/shared/ui/Skeleton';
import { notFound } from 'next/navigation';

export default function ForecastDetail({ params }: { params: { id: string } }) {
  if (!params.id) notFound();

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-ink">Прогноз #{params.id}</h1>
      <div className="bg-surface rounded-xl p-8 shadow-card">
        <Skeleton height="2rem" />
        <Skeleton height="1rem" />
        <Skeleton height="1rem" />
        <Skeleton height="1rem" />
      </div>
    </div>
  );
}
