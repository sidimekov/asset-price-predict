import ForecastChart from '@/features/forecast/Chart';
import ExplainSidebar from '@/features/forecast/ExplainSidebar';
import ParamsPanel from '@/features/forecast/ParamsPanel';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ForecastPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-ink">Прогноз #{id}</h1>

      <ParamsPanel />

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <ForecastChart />
        </div>
        <ExplainSidebar />
      </div>
    </div>
  );
}
