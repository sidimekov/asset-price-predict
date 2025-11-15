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
    const forecastTimeLabels = [
        '6:00AM',
        '12:00AM',
        '6:00PM',
        '12:00PM',
        '6:00AM',
        '12:00AM',
        '6:00PM',
        '12:00PM',
        '6:00AM',
        '12:00AM',
        '6:00PM',
        '12:00PM',
        '6:00AM',
        '12:00AM',
    ];

    return (
        <div className="min-h-screen bg-primary">
            <div className="grid grid-cols-12 gap-6 px-8 pt-8 pb-32">
                <div className="col-span-12">
                    <h1 className="text-2xl font-semibold text-white">{id}</h1>
                </div>

                <div className="col-span-12 lg:col-span-8">
                    <div className="bg-surface-dark rounded-3xl p-6">
                        <div className="overflow-x-auto w-[1100px]">
                            <div className="flex items-start">

                                <div className="flex items-start relative left-0">
                                    <YAxis className="h-96 w-full px-6 text-[#8480C9]" />

                                    <div className="flex flex-col">
                                        <div className="flex">
                                            <div className="relative h-96 w-[800px] flex-none">
                                                <CandlesChartPlaceholder state={chartState} />
                                            </div>

                                            <div className="relative h-96 w-[330px] left-0 border-l border-dashed border-[#8480C9] bg-[#1a1738] forecast-shape-panel flex-none">
                                                <ForecastShapePlaceholder className="h-96 w-full" />
                                            </div>
                                        </div>

                                        <XAxis
                                            width={1130}
                                            className="ml-12 h-96 text-[#8480C9]"
                                            labels={forecastTimeLabels}
                                        />
                                    </div>
                                </div>
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