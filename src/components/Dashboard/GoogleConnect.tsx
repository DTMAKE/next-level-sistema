import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { Calendar, Loader2, Check, X } from 'lucide-react';
import googleLogo from '@/assets/google-logo.png';

export const GoogleConnect = () => {
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

  return (
    <Card className="relative overflow-hidden border-0 shadow-lg">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/20 to-primary/5" />
      
      <CardContent className="relative p-6 text-center">
        {/* Google Logo over Calendar Icon */}
        <div className="relative inline-flex items-center justify-center mb-4">
          <Calendar className="w-12 h-12 text-muted-foreground/30" />
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center">
            <img 
              src={googleLogo} 
              alt="Google" 
              className="w-4 h-4 object-contain"
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
      </CardContent>
    </Card>
  );
};