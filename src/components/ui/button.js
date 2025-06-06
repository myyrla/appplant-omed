import React from 'react';

export function Button({ children, onClick, className }) {
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded bg-blue-600 text-white hover:bg-blue-700 ${className}`}
    >
      {children}
    </button>
  );
}
