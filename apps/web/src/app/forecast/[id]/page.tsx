import Skeleton from '@/shared/ui/Skeleton';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ForecastDetail({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-ink">Прогноз #{id}</h1>
      <div className="bg-surface rounded-xl p-8 shadow-card space-y-3">
        <Skeleton height="2rem" />
        <Skeleton height="1rem" />
        <Skeleton height="1rem" />
        <Skeleton height="1rem" />
      </div>
    </div>
  );
}
