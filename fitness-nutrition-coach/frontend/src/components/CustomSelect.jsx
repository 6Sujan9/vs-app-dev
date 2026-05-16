import React, { useState, useRef, useEffect } from 'react';
import './styles/custom-select.css';

/**
 * CustomSelect replaces native <select> so option font-size is consistent
 * across browsers. API mirrors native <select>:
 *   <CustomSelect name="goal" value={val} onChange={handler}>
 *     <option value="a">Option A</option>
 *   </CustomSelect>
 */
const CustomSelect = ({ id, name, value, onChange, children, disabled }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const options = React.Children.map(children, (child) => ({
    value: child.props.value,
    label: child.props.children,
  }));

  const selected = options?.find((o) => o.value === value);

  useEffect(() => {
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleSelect = (optVal) => {
    onChange({ target: { name, value: optVal } });
    setOpen(false);
  };

  return (
    <div className={`custom-select${open ? ' open' : ''}${disabled ? ' disabled' : ''}`} ref={ref} id={id}>
      <div className="cs-trigger" onClick={() => !disabled && setOpen(!open)}>
        <span className="cs-value">{selected?.label ?? '— Select —'}</span>
        <span className="cs-arrow">▼</span>
      </div>

      {open && (
        <div className="cs-dropdown">
          {options?.map((opt) => (
            <div
              key={opt.value}
              className={`cs-option${opt.value === value ? ' cs-selected' : ''}`}
              onClick={() => handleSelect(opt.value)}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
