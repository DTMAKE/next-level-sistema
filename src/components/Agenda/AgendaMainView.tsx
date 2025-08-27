import { EventoUnificado } from "@/hooks/useAgendaUnificada";
import { EventListView } from "./EventListView";
import { EventGridView } from "./EventGridView";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, LinkIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { GoogleConnect } from "@/components/Dashboard/GoogleConnect";
import googleLogo from '@/assets/google-logo.png';

type ViewMode = 'day' | 'week' | 'month' | 'list';

interface AgendaMainViewProps {
  events: EventoUnificado[];
  isLoading: boolean;
  error: string | null;
  needsGoogleConnection?: boolean;
  viewMode: ViewMode;
  selectedDate: Date;
  dateRange?: DateRange;
  onEventSelect: (event: EventoUnificado) => void;
}

export function AgendaMainView({
  events,
  isLoading,
  error,
  needsGoogleConnection = false,
  viewMode,
  selectedDate,
  dateRange,
  onEventSelect
}: AgendaMainViewProps) {
  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto p-4 sm:p-6 space-y-4">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="border-calendar-border">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-4 sm:p-6">
        <Card className="max-w-md w-full border-calendar-border">
          <CardContent className="flex flex-col items-center justify-center p-6 sm:p-8 space-y-4">
            <Calendar className="w-12 h-12 text-muted-foreground" />
            <div className="text-center space-y-2">
              <h3 className="font-medium">Erro ao carregar eventos</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show Google connection message when no events and needs connection
  if (needsGoogleConnection && events.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-4 sm:p-6">
        <Card className="max-w-md w-full border-primary/20 bg-gradient-to-br from-background to-primary/5">
          <CardContent className="flex flex-col items-center justify-center p-6 sm:p-8 space-y-6">
            {/* Google logo with calendar icon */}
            <div className="relative">
              <Calendar className="w-16 h-16 text-muted-foreground/40" />
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                <img 
                  src={googleLogo} 
                  alt="Google" 
                  className="w-5 h-5 object-contain"
                />
              </div>
            </div>
            
            <div className="text-center space-y-3">
              <h3 className="font-semibold text-lg">Conecte sua conta Google</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Você precisa se conectar ao Google para ganhar acesso à sua agenda e sincronizar seus eventos.
              </p>
            </div>

            <div className="w-full max-w-xs">
              <GoogleConnect />
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <LinkIcon className="w-3 h-3" />
              <span>Conexão segura com Google Calendar</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-4 sm:p-6">
        <Card className="max-w-md w-full border-calendar-border">
          <CardContent className="flex flex-col items-center justify-center p-6 sm:p-8 space-y-4">
            <Calendar className="w-12 h-12 text-muted-foreground" />
            <div className="text-center space-y-2">
              <h3 className="font-medium">Nenhum evento encontrado</h3>
              <p className="text-sm text-muted-foreground">
                Aguarde a sincronização dos eventos ou crie um novo evento.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render based on view mode
  switch (viewMode) {
    case 'list':
      return (
        <div className="h-full">
          <EventListView
            events={events}
            onEventSelect={onEventSelect}
            dateRange={dateRange}
          />
        </div>
      );
    case 'day':
    case 'week':
    case 'month':
      return (
        <div className="h-full">
          <EventGridView
            events={events}
            viewMode={viewMode}
            selectedDate={selectedDate}
            onEventSelect={onEventSelect}
          />
        </div>
      );
    default:
      return (
        <div className="h-full">
          <EventListView
            events={events}
            onEventSelect={onEventSelect}
            dateRange={dateRange}
          />
        </div>
      );
  }
}