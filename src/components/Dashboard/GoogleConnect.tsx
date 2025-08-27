import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { Loader2, Check, X } from 'lucide-react';
import googleLogo from '@/assets/google-logo.png';

interface GoogleConnectProps {
  compact?: boolean;
}

export const GoogleConnect = ({ compact = false }: GoogleConnectProps) => {
  const { 
    isConnecting, 
    isConnected, 
    connectGoogle, 
    disconnectGoogle,
    checkConnection 
  } = useGoogleAuth();

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  if (compact) {
    return (
      <Button
        variant={isConnected ? "secondary" : "outline"}
        size="sm"
        onClick={isConnected ? disconnectGoogle : connectGoogle}
        disabled={isConnecting}
        className="h-8 px-3 gap-2"
      >
        {isConnecting ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <>
            <img 
              src={googleLogo} 
              alt="Google" 
              className="w-3 h-3 object-contain"
            />
            {isConnected ? (
              <Check className="w-3 h-3 text-success" />
            ) : (
              <X className="w-3 h-3 text-muted-foreground" />
            )}
          </>
        )}
      </Button>
    );
  }

  // Original card design for other locations
  return (
    <div className="relative overflow-hidden border rounded-lg shadow-lg">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/20 to-primary/5" />
      
      <div className="relative p-6 text-center">
        {/* Google Logo over Calendar Icon */}
        <div className="relative inline-flex items-center justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center">
            <img 
              src={googleLogo} 
              alt="Google" 
              className="w-6 h-6 object-contain"
            />
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center justify-center gap-2 mb-3">
          {isConnected ? (
            <div className="flex items-center gap-2 text-success">
              <Check className="w-4 h-4" />
              <span className="text-sm font-medium">Conectado</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <X className="w-4 h-4" />
              <span className="text-sm font-medium">Não conectado</span>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground mb-4 max-w-[200px] mx-auto">
          {isConnected 
            ? 'Acesso ao Google Calendar ativo' 
            : 'Conecte para sincronizar eventos'
          }
        </p>

        {/* Action Button */}
        {isConnected ? (
          <Button 
            variant="outline" 
            size="sm"
            onClick={disconnectGoogle}
            className="h-8 px-3 text-xs"
          >
            Desconectar
          </Button>
        ) : (
          <Button 
            onClick={connectGoogle}
            disabled={isConnecting}
            size="sm"
            className="h-8 px-4 text-xs bg-primary hover:bg-primary/90"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Conectando...
              </>
            ) : (
              'Conectar Google'
            )}
          </Button>
        )}
      </div>
    </div>
  );
};