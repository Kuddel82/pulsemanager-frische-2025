import React from 'react';

// STUB: Native HTML toast to replace Radix-UI Toast
export const ToastProvider = ({ children, ...props }) => {
	console.log('🔧 Using STUB ToastProvider - Radix-UI disabled for DOM stability');
	return <div {...props}>{children}</div>;
};

export const Toast = ({ children, className, ...props }) => {
	return (
		<div className={`fixed top-4 right-4 bg-gray-900/95 border border-white/20 rounded-lg p-4 shadow-lg z-50 ${className || ''}`} {...props}>
			{children}
		</div>
	);
};

export const ToastTitle = ({ children, className, ...props }) => {
	return (
		<h3 className={`font-semibold text-white ${className || ''}`} {...props}>
			{children}
		</h3>
	);
};

export const ToastDescription = ({ children, className, ...props }) => {
	return (
		<p className={`text-sm text-gray-400 mt-1 ${className || ''}`} {...props}>
			{children}
		</p>
	);
};

export const ToastClose = ({ className, ...props }) => {
	return (
		<button className={`absolute top-2 right-2 text-gray-400 hover:text-white ${className || ''}`} {...props}>
			×
		</button>
	);
};

export const ToastViewport = ({ className, ...props }) => {
	return <div className={`fixed top-0 right-0 z-50 ${className || ''}`} {...props} />;
};
