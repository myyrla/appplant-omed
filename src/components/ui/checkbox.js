import React from "react";

export function Checkbox({ checked, onCheckedChange }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      className="w-4 h-4 rounded border-gray-300 text-red-700 focus:ring-red-500"
    />
  );
}
