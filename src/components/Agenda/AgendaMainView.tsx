import { EventoUnificado } from "@/hooks/useAgendaUnificada";
import { EventListView } from "./EventListView";
import { EventGridView } from "./EventGridView";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Calendar } from "lucide-react";
import { DateRange } from "react-day-picker";

type ViewMode = 'day' | 'week' | 'month' | 'list';

interface AgendaMainViewProps {
  events: EventoUnificado[];
  isLoading: boolean;
  error: string | null;
  viewMode: ViewMode;
  selectedDate: Date;
  dateRange?: DateRange;
  onEventSelect: (event: EventoUnificado) => void;
}

export function AgendaMainView({
  events,
  isLoading,
  error,
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
            <AlertCircle className="w-12 h-12 text-muted-foreground" />
            <div className="text-center space-y-2">
              <h3 className="font-medium">Erro ao carregar eventos</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
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
                Conecte sua conta Google ou aguarde a sincronização dos eventos.
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