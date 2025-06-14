import React from 'react';

// STUB: Native HTML checkbox to replace Radix-UI Switch
export const Switch = ({ checked, onCheckedChange, disabled, className, ...props }) => {
  console.log('🔧 Using STUB Switch - Radix-UI disabled for DOM stability');
  
  const handleChange = (e) => {
    if (onCheckedChange) {
      onCheckedChange(e.target.checked);
    }
  };
  
  return (
    <label className={`relative inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className || ''}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        className="sr-only"
        {...props}
      />
      <div className={`w-11 h-6 bg-gray-700 rounded-full transition-colors ${checked ? 'bg-green-500' : 'bg-gray-600'}`}>
        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'} mt-0.5 ml-0.5`} />
      </div>
    </label>
  );
};

export default Switch;
