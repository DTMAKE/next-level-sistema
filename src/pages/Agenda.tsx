import { Calendar, X } from "lucide-react";
import { AgendaLayout } from "@/components/Agenda/AgendaLayout";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { Button } from "@/components/ui/button";
import googleLogo from "@/assets/google-logo.png";
import { useEffect } from "react";

export default function Agenda() {
  const { isConnected, connectGoogle, isConnecting, checkConnection } = useGoogleAuth();

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return (
    <div className="h-full flex flex-col">
      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {isConnected ? (
          <AgendaLayout />
        ) : (
          <div className="h-full flex items-center justify-center p-4">
            <div className="text-center space-y-6 max-w-sm">
              {/* Calendar Icon with Google Logo */}
              <div className="relative inline-flex items-center justify-center">
                <Calendar className="w-16 h-16 text-muted-foreground/40" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border border-border">
                  <img 
                    src={googleLogo} 
                    alt="Google" 
                    className="w-5 h-5 object-contain"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <X className="w-4 h-4" />
                <span className="font-medium">Não conectado</span>
              </div>

              {/* Description */}
              <p className="text-muted-foreground">
                Conecte para sincronizar eventos
              </p>

              {/* Connect Button */}
              <Button 
                onClick={connectGoogle}
                disabled={isConnecting}
                className="bg-foreground hover:bg-foreground/90 text-background px-8 py-2 rounded-full"
              >
                {isConnecting ? "Conectando..." : "Conectar Google"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}