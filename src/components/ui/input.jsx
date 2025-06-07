import React from 'react';

// STUB: Native HTML input to replace Radix-UI Input
export const Input = ({ className, type = "text", placeholder, value, onChange, disabled, ...props }) => {
  console.log('🔧 Using STUB Input - Radix-UI disabled for DOM stability');
  
  const baseClasses = "w-full px-3 py-2 bg-gray-800/50 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200";
  
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`${baseClasses} ${className || ''}`}
      {...props}
    />
  );
};

export default Input;