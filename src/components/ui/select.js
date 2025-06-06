import React, { useState } from 'react';

export function Select({ onValueChange, children }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const handleValueChange = (value) => {
    setSelected(value);
    onValueChange(value); // Chama a função do componente pai
    setOpen(false);
  };

  return (
    <SelectContext.Provider
      value={{ open, setOpen, selected, handleValueChange }}
    >
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
}

const SelectContext = React.createContext();

export function SelectTrigger({ children }) {
  const { open, setOpen } = React.useContext(SelectContext);

  return (
    <div className="SelectTrigger" onClick={() => setOpen(!open)}>
      {children}
    </div>
  );
}

export function SelectValue({ placeholder }) {
  const { selected } = React.useContext(SelectContext);
  return <span>{selected || placeholder}</span>;
}

export function SelectContent({ children }) {
  const { open } = React.useContext(SelectContext);
  if (!open) return null;
  return <div className="SelectContent">{children}</div>;
}

export function SelectItem({ value, children }) {
  const { handleValueChange } = React.useContext(SelectContext);

  return (
    <div className="SelectItem" onClick={() => handleValueChange(value)}>
      {children}
    </div>
  );
}
