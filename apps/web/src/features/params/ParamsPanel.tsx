'use client';
import React from 'react';
import Skeleton from '@/shared/ui/Skeleton';

type ParamsState = 'idle' | 'loading' | 'error' | 'success';

interface ParamsPanelProps {
    state: ParamsState;
    onPredict?: () => void;
    buttonLabel?: string;

    selectedModel?: string;
    selectedDate?: string;
    onModelChange?: (value: string) => void;
    onDateChange?: (value: string) => void;
    readOnly?: boolean;
}

export default function ParamsPanel({
                                        state,
                                        onPredict,
                                        buttonLabel,
                                        selectedModel,
                                        selectedDate,
                                        onModelChange,
                                        onDateChange,
                                        readOnly = false,
                                    }: ParamsPanelProps) {
    const isLoading = state === 'loading';

    const getTodayDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // локальные стейты (на случай, если родитель не контролирует значения)
    const [internalModel, setInternalModel] = React.useState<string>(
        selectedModel ?? '',
    );
    const [internalDate, setInternalDate] = React.useState<string>(
        selectedDate ?? getTodayDate(),
    );

    const modelValue = selectedModel ?? internalModel;
    const dateValue = selectedDate ?? internalDate;

    const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (readOnly) return;
        onModelChange?.(value);
        if (selectedModel === undefined) {
            setInternalModel(value);
        }
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (readOnly) return;
        onDateChange?.(value);
        if (selectedDate === undefined) {
            setInternalDate(value);
        }
    };

    if (state === 'loading') {
        return (
            <div className="mt-8 bg-surface-dark rounded-3xl p-6 ">
                <p className="text-[#8480C9]">Parameters</p>
                <br />
                <div className="param-panel-item w-full h-12 pl-4 rounded overflow-hidden relative -mt-2">
                    <Skeleton width="100%" height="100%" />
                </div>
                <br />
                <br />
                <div className="param-panel-item w-full h-12 pl-4 rounded overflow-hidden relative -mt-2">
                    <Skeleton width="100%" height="100%" />
                </div>
                <br />
                <br />
                <div className="relative left-10 gradient-button w-60 h-12 rounded overflow-hidden -mt-2">
                    <Skeleton width="100%" height="100%" />
                </div>
            </div>
        );
    }

    if (state === 'error') {
        return (
            <div className="mt-8 bg-surface-dark rounded-3xl p-6 ">
                <p className="text-error">Error loading parameters</p>
            </div>
        );
    }

    return (
        <div className="mt-8 bg-surface-dark rounded-3xl p-6 ">
            <p className="text-[#8480C9]">Parameters</p>
            <br />
            <select
                className="appearance-none text-center param-panel-item w-full h-12 pl-4 rounded"
                value={modelValue}
                onChange={handleModelChange}
                disabled={readOnly}
            >
                <option value="" className="text-center">
                    Select predict model
                </option>
                <option value="model-1">Model 1</option>
                <option value="model-2">Model 2</option>
                <option value="model-3">Model 3</option>
            </select>
            <br />
            <br />
            <input
                type="date"
                className="text-center param-panel-item w-full h-12 pl-4 rounded"
                value={dateValue}
                onChange={handleDateChange}
                disabled={readOnly}
            />
            <br />
            <br />
            <button
                className="relative left-10 gradient-button w-60 h-12 rounded text-ink font-medium transition-smooth scale-on-press"
                onClick={onPredict}
                aria-busy={isLoading}
                disabled={isLoading || !onPredict}
            >
                {buttonLabel ?? 'Predict'}
            </button>
        </div>
    );
}