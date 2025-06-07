// CRITICAL: Complete Radix-UI Deactivation to prevent DOM conflicts
// This file provides stub implementations for all Radix-UI components

console.warn('🚨 RADIX-UI DISABLED: All components replaced with native HTML for DOM stability');

// Stub for Button component
export const Button = ({ children, onClick, disabled, className, variant, size, ...props }) => {
  const baseClasses = "py-2 px-4 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2";
  const variantClasses = variant === 'outline' 
    ? "border border-white/20 text-white hover:bg-white/10"
    : "bg-gradient-to-r from-green-400 to-blue-500 text-black hover:from-green-500 hover:to-blue-600 focus:ring-green-400/50";
  
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  );
};

// Stub for Input component
export const Input = ({ className, ...props }) => (
  <input 
    className={`w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400 ${className || ''}`}
    {...props}
  />
);

// Stub for Label component
export const Label = ({ children, className, ...props }) => (
  <label className={`block text-sm font-medium text-white mb-1 ${className || ''}`} {...props}>
    {children}
  </label>
);

// Stub for Card components
export const Card = ({ children, className, ...props }) => (
  <div className={`bg-white/5 border border-white/10 rounded-xl shadow-lg ${className || ''}`} {...props}>
    {children}
  </div>
);

export const CardHeader = ({ children, className, ...props }) => (
  <div className={`p-6 pb-0 ${className || ''}`} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ children, className, ...props }) => (
  <h3 className={`text-lg font-semibold text-white ${className || ''}`} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className, ...props }) => (
  <p className={`text-sm text-gray-400 ${className || ''}`} {...props}>
    {children}
  </p>
);

export const CardContent = ({ children, className, ...props }) => (
  <div className={`p-6 ${className || ''}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className, ...props }) => (
  <div className={`p-6 pt-0 ${className || ''}`} {...props}>
    {children}
  </div>
);

// Stub for Alert components
export const Alert = ({ children, className, ...props }) => (
  <div className={`p-4 bg-yellow-400/10 border border-yellow-400/20 rounded-lg ${className || ''}`} {...props}>
    {children}
  </div>
);

export const AlertDescription = ({ children, className, ...props }) => (
  <div className={`text-sm text-yellow-400 ${className || ''}`} {...props}>
    {children}
  </div>
);

// Stub for Dialog components (just return children without portal)
export const Dialog = ({ children, open, onOpenChange }) => open ? <>{children}</> : null;
export const DialogContent = ({ children, className, ...props }) => (
  <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 ${className || ''}`} {...props}>
    <div className="bg-gray-900 border border-white/10 rounded-xl p-6 max-w-md w-full mx-4">
      {children}
    </div>
  </div>
);
export const DialogHeader = ({ children, ...props }) => <div {...props}>{children}</div>;
export const DialogTitle = ({ children, className, ...props }) => (
  <h2 className={`text-lg font-semibold text-white mb-2 ${className || ''}`} {...props}>
    {children}
  </h2>
);
export const DialogDescription = ({ children, className, ...props }) => (
  <p className={`text-sm text-gray-400 mb-4 ${className || ''}`} {...props}>
    {children}
  </p>
);
export const DialogFooter = ({ children, ...props }) => <div {...props}>{children}</div>;

// Stub for useToast hook
export const useToast = () => {
  console.warn('🚨 useToast disabled for DOM stability');
  return {
    toast: (options) => {
      console.log('Toast (disabled):', options?.title || options?.description || options);
    }
  };
};

// Export everything to prevent import errors
export default {
  Button,
  Input,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Alert,
  AlertDescription,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  useToast
}; 