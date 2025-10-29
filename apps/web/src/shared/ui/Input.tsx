import React from 'react';

interface InputProps {
    placeholder: string;
    value: string;
    onChange: (e: React.ChangeEvent<any>) => void;
    error?: string;
    type?: string;
    ariaDescribedby: string;
}

export const Input: React.FC<InputProps> = ({
                                                placeholder,
                                                value,
                                                onChange,
                                                error,
                                                type = 'text',
                                                ariaDescribedby,
                                            }) => {
    return (
        <div>
            <label htmlFor={ariaDescribedby} className="sr-only">
                {placeholder}
            </label>
            <input
                type={type}
                id={ariaDescribedby}
                value={value}
                onChange={onChange}
                placeholder={value ? '' : placeholder}
                className="input"
                aria-describedby={error ? `${ariaDescribedby}-error` : undefined}
                aria-invalid={!!error}
                required
            />
            {error && (
                <span id={`${ariaDescribedby}-error`} className="error-text">
          {error}
        </span>
            )}
        </div>
    );
};