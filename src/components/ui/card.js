import React from 'react';

export function Card({ children }) {
  return (
    <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16 }}>
      {children}
    </div>
  );
}

export function CardContent({ children, className }) {
  return <div className={className}>{children}</div>;
}
