'use client';

import React, { useState } from 'react';

interface PasswordInputProps {
    placeholder?: string;
    value: string;
    onChange: (e: React.ChangeEvent<any>) => void;
    error?: string;
    ariaDescribedby?: string;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
                                                         placeholder,
                                                         value,
                                                         onChange,
                                                         error,
                                                         ariaDescribedby,
                                                     }) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div>
            <label
                htmlFor={ariaDescribedby}
                style={{
                    position: 'absolute',
                    width: '1px',
                    height: '1px',
                    padding: 0,
                    margin: '-1px',
                    overflow: 'hidden',
                    clip: 'rect(0, 0, 0, 0)',
                    border: 0,
                }}
            >
                {placeholder}
            </label>
            <div style={{ position: 'relative' }}>
                <input
                    type={showPassword ? 'text' : 'password'}
                    id={ariaDescribedby}
                    placeholder={value ? '' : placeholder}
                    value={value}
                    onChange={onChange}
                    style={{
                        width: '100%',
                        height: '48px',
                        padding: '0 12px',
                        borderRadius: '8px',
                        backgroundColor: '#2A265F',
                        border: '1px solid #333333',
                        color: '#FFFFFF',
                        fontFamily: 'Montserrat, sans-serif',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        paddingRight: '80px',
                        ...(value === '' && {
                            color: '#8480C9',
                        }),
                    }}
                    aria-describedby={error && ariaDescribedby ? `${ariaDescribedby}-error` : undefined}
                    aria-invalid={!!error}
                    required
                    onFocus={(e) => (e.currentTarget.style.outline = '2px solid #FF409A')}
                    onBlur={(e) => (e.currentTarget.style.outline = 'none')}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#8480C9',
                        fontFamily: 'Montserrat, sans-serif',
                        fontSize: '12px',
                        fontWeight: 400,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        outline: 'none',
                    }}
                    onFocus={(e) => (e.currentTarget.style.outline = '2px solid #FF409A')}
                    onBlur={(e) => (e.currentTarget.style.outline = 'none')}
                >
                    {showPassword ? 'Hide' : 'Show'}
                </button>
            </div>
            {error && (
                <span
                    id={ariaDescribedby ? `${ariaDescribedby}-error` : undefined}
                    style={{
                        display: 'block',
                        color: '#FF4444',
                        fontFamily: 'Montserrat, sans-serif',
                        fontSize: '12px',
                        fontWeight: 400,
                        marginTop: '4px',
                    }}
                >
          {error}
        </span>
            )}
        </div>
    );
};

export default PasswordInput;