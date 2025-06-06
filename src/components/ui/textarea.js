import React from "react";

export function Textarea({ value, onChange, ...props }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      className="border p-2 rounded w-full"
      {...props}
    />
  );
}
