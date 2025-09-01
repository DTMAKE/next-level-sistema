import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // Replace console.error with proper error reporting service
      // Example: Sentry.captureException(error, { extra: errorInfo });
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback onReset={() => this.setState({ hasError: false })} />;
    }

    return this.props.children;
  }
}

function ErrorFallback({ onReset }: { onReset: () => void }) {
  const handleGoHome = () => {
    // Use React Router navigation instead of window.location.href
    window.location.pathname = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <CardTitle>Algo deu errado</CardTitle>
          <CardDescription>
            Ocorreu um erro inesperado. Tente recarregar a página ou voltar à página inicial.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={onReset} className="w-full" variant="default">
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar Novamente
          </Button>
          <Button 
            onClick={handleGoHome} 
            variant="outline" 
            className="w-full"
          >
            <Home className="w-4 h-4 mr-2" />
            Ir para Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default ErrorBoundary;