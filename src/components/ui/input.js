import React from "react";
export function Input({ value, onChange, type = 'text', ...props }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      className="border p-2 rounded w-full"
      {...props}
    />
  );
}
