import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary capturou erro:", error);
    console.error("Component stack:", errorInfo.componentStack);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    // Limpar cache do React Query antes de recarregar
    try {
      localStorage.removeItem('REACT_QUERY_OFFLINE_CACHE');
    } catch (e) {
      // Ignorar erros de localStorage
    }
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  handleClearAndReload = () => {
    try {
      // Limpar storage que pode estar corrompido
      sessionStorage.clear();
      localStorage.removeItem('REACT_QUERY_OFFLINE_CACHE');
    } catch (e) {
      // Ignorar
    }
    window.location.href = "/auth";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMessage = this.state.error?.message || 'Erro desconhecido';
      const isAuthError = errorMessage.toLowerCase().includes('jwt') || 
                          errorMessage.toLowerCase().includes('auth') ||
                          errorMessage.toLowerCase().includes('session');

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Algo deu errado
              </h1>
              <p className="text-muted-foreground">
                {isAuthError 
                  ? "Sua sessão expirou ou há um problema de autenticação."
                  : "Ocorreu um erro inesperado no aplicativo."
                }
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {isAuthError ? (
                <Button onClick={this.handleClearAndReload} className="gap-2 w-full">
                  <RefreshCw className="w-4 h-4" />
                  Fazer Login Novamente
                </Button>
              ) : (
                <Button onClick={this.handleReload} className="gap-2 w-full">
                  <RefreshCw className="w-4 h-4" />
                  Recarregar Página
                </Button>
              )}
              <Button variant="outline" onClick={this.handleGoHome} className="gap-2 w-full">
                <Home className="w-4 h-4" />
                Ir para Início
              </Button>
            </div>

            {/* Mostrar detalhes do erro para debug */}
            <details className="mt-6 text-left bg-muted p-4 rounded-lg">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                Detalhes do erro
              </summary>
              <pre className="mt-2 text-xs text-destructive overflow-auto max-h-40 whitespace-pre-wrap">
                {errorMessage}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
