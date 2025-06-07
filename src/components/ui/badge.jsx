import React from 'react';

// STUB: Native HTML badge to replace Radix-UI Badge
export const Badge = ({ children, className, variant = "default", ...props }) => {
  console.log('🔧 Using STUB Badge - Radix-UI disabled for DOM stability');
  
  const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
  
  const variantClasses = {
    default: "bg-green-400/20 text-green-400 border border-green-400/30",
    secondary: "bg-gray-600/20 text-gray-300 border border-gray-600/30",
    destructive: "bg-red-500/20 text-red-400 border border-red-500/30",
    outline: "border border-white/20 text-white"
  };
  
  const finalClasses = `${baseClasses} ${variantClasses[variant]} ${className || ''}`;
  
  return (
    <span className={finalClasses} {...props}>
      {children}
    </span>
  );
};

export default Badge;