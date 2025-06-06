<<<<<<< HEAD
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
=======
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
>>>>>>> 0e0d72ef0ffe35c709d367ba866e0519b1e161e0
