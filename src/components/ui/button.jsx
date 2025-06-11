import * as React from "react"
import { cn } from "@/lib/utils"

// Log nur einmal, nicht bei jedem Render  
let hasLoggedStub = false;
if (!hasLoggedStub) {
	console.log('🔧 Using STUB Button - Radix-UI disabled for DOM stability');
	hasLoggedStub = true;
}

const buttonVariants = {
	variant: {
		default: "bg-primary text-primary-foreground hover:bg-primary/90",
		destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
		outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
		secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
		ghost: "hover:bg-accent hover:text-accent-foreground",
		link: "text-primary underline-offset-4 hover:underline",
	},
	size: {
		default: "h-10 px-4 py-2",
		sm: "h-9 rounded-md px-3",
		lg: "h-11 rounded-md px-8",
		icon: "h-10 w-10",
	}
};

const Button = React.forwardRef(({ className, variant = "default", size = "default", asChild = false, children, ...props }, ref) => {
	// STUB: Simple button without external dependencies
	const variantClass = buttonVariants.variant[variant] || buttonVariants.variant.default;
	const sizeClass = buttonVariants.size[size] || buttonVariants.size.default;
	
	const classes = cn(
		"inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
		variantClass,
		sizeClass,
		className
	);

	if (asChild) {
		// For asChild, wrap the children but don't create a button
		return React.cloneElement(children, {
			className: classes,
			ref,
			...props
		});
	}

	return (
		<button
			className={classes}
			ref={ref}
			{...props}
		>
			{children}
		</button>
	);
});

Button.displayName = "Button"

export { Button, buttonVariants }
