'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import CandlesChartPlaceholder from '@/widgets/chart/CandlesChartPlaceholder';
import ForecastShapePlaceholder from '@/widgets/chart/ForecastShapePlaceholder';
import XAxis from '@/widgets/chart/coordinates/XAxis';
import YAxis from '@/widgets/chart/coordinates/YAxis';
import ParamsPanel from '@/features/params/ParamsPanel';
import FactorsTable from '@/features/factors/FactorsTable';

type State = 'idle' | 'loading' | 'empty' | 'ready';
type ParamsState = 'idle' | 'loading' | 'error' | 'success';

type ForecastPageProps = {
    params: {
        id: string;
    };
};

export default function ForecastPage({ params }: ForecastPageProps) {
    const { id } = params;
    const router = useRouter();

    const [chartState, setChartState] = React.useState<State>('idle');
    const [paramsState, setParamsState] = React.useState<ParamsState>('idle');
    const [factorsState, setFactorsState] = React.useState<State>('idle');

    React.useEffect(() => {
        setChartState('loading');
        setParamsState('loading');
        setFactorsState('loading');

        const t = setTimeout(() => {
            setChartState('ready');
            setParamsState('success');
            setFactorsState('ready');
        }, 1200);

        return () => clearTimeout(t);
    }, []);

    const handleBackToAssets = () => {
        router.push('/dashboard');
    };

    return (
        <div className="min-h-screen bg-primary">
            <div className="grid grid-cols-12 gap-6 px-8 pt-8 pb-32">
                {/* Заголовок с именем актива */}
                <div className="col-span-12">
                    <h1 className="text-2xl font-semibold text-white">{id}</h1>
                </div>

                <div className="col-span-12 lg:col-span-8">
                    <div className="bg-surface-dark rounded-3xl p-6">
                        {/* Делаем общий контейнер relative, чтобы можно было прицепить Forecast справа */}
                        <div className="relative">
                            {/* Это — ТОЧНО ТАК ЖЕ, как на dashboard */}
                            <div className="flex items-start">
                                <YAxis className="h-96 w-full px-6" />

                                <div className="flex-1 flex flex-col">
                                    <div className="flex-1 relative">
                                        <CandlesChartPlaceholder state={chartState} />
                                    </div>

                                    <XAxis className="ml-12 h-96 w-full" />
                                </div>
                            </div>

                            {/* А вот это — ДОПОЛНИТЕЛЬНЫЙ блок справа от существующего графика */}
                            <div className="absolute inset-y-0 right-[-480px] w-[330px] border-l border-dashed border-[#8480C9] bg-[#201d47]">
                                <ForecastShapePlaceholder className="h-full w-full" />
                            </div>
                        </div>
                    </div>

                    <div className="h-8" />
                </div>

                <div className="hidden lg:block col-span-4" />

                <div className="col-span-12 lg:col-span-4">
                    <ParamsPanel
                        state={paramsState}
                        onPredict={handleBackToAssets}
                        buttonLabel="Back to asset selection"
                    />
                </div>

                <div className="hidden lg:block col-span-1" />

                <div className="col-span-12 lg:col-span-7">
                    <div className="overflow-x-auto">
                        <div className="min-w-[600px] lg:min-w-0">
                            <FactorsTable state={factorsState} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-10" />
        </div>
    );
}