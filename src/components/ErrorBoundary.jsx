import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    // ENHANCED ERROR LOGGING FOR RUNTIME DEBUGGING
    console.error("🚨 RUNTIME ERROR DETAILS:", {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
    
    // Try to identify the failing component
    if (errorInfo.componentStack) {
      const failingComponent = errorInfo.componentStack.split('\n')[1];
      console.error("🎯 FAILING COMPONENT:", failingComponent);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
          <div className="max-w-lg text-center p-8 bg-card rounded-xl shadow-2xl border border-destructive/50">
            <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-destructive mb-4">
              {this.props.t?.errorBoundaryTitle || "Oops! Something went wrong."}
            </h1>
            <p className="text-muted-foreground mb-6">
              {this.props.t?.errorBoundaryMessage || "We're sorry, but an unexpected error occurred. Please try refreshing the page or contact support if the problem persists."}
            </p>
            
            {import.meta.env.DEV && this.state.error && (
              <details className="mb-6 text-left bg-muted/50 dark:bg-muted/20 p-4 rounded-md text-xs overflow-auto">
                <summary className="font-semibold cursor-pointer text-destructive/80">
                  {this.props.t?.errorBoundaryDetails || "Error Details (Development Mode)"}
                </summary>
                <pre className="mt-2 whitespace-pre-wrap">
                  {this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack && (
                    `\n\nComponent Stack:\n${this.state.errorInfo.componentStack}`
                  )}
                </pre>
              </details>
            )}

            <Button 
              onClick={() => window.location.reload()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {this.props.t?.errorBoundaryRefresh || "Refresh Page"}
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

export { ErrorBoundary };