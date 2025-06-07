import React from 'react';

// STUB: Native HTML button to replace Radix-UI Button
export const Button = ({ children, onClick, disabled, className, variant, size, ...props }) => {
	console.log('🔧 Using STUB Button - Radix-UI disabled for DOM stability');
	
	const baseClasses = "inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed";
	
	const variantClasses = {
		default: "bg-gradient-to-r from-green-400 to-blue-500 text-black hover:from-green-500 hover:to-blue-600 focus:ring-green-400/50",
		outline: "border border-white/20 text-white hover:bg-white/10 focus:ring-white/50",
		ghost: "text-white hover:bg-white/10 focus:ring-white/50",
		destructive: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-400/50"
	};
	
	const sizeClasses = {
		default: "py-2 px-4",
		sm: "py-1 px-3 text-sm",
		lg: "py-3 px-6 text-lg",
		icon: "p-2"
	};
	
	const finalClasses = `${baseClasses} ${variantClasses[variant] || variantClasses.default} ${sizeClasses[size] || sizeClasses.default} ${className || ''}`;
	
	return (
		<button 
			onClick={onClick}
			disabled={disabled}
			className={finalClasses}
			{...props}
		>
			{children}
		</button>
	);
};

export const buttonVariants = () => ({});

export default Button;
