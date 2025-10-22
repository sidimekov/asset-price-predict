import React from 'react';

interface AuthBrandProps {
    style?: React.CSSProperties;
}

const AuthBrand: React.FC<AuthBrandProps> = ({ style }) => {
    return (
        <h1
            style={{
                margin: 0,
                fontFamily: 'Montserrat, sans-serif',
                fontSize: '32px',
                fontWeight: 700,
                ...style,
            }}
        >
      <span
          style={{
              background: 'linear-gradient(to right, #FF409A, #C438EF)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
          }}
      >
        Asset
      </span>
            <span style={{ color: '#FFFFFF' }}>Predict</span>
        </h1>
    );
};

export default AuthBrand;