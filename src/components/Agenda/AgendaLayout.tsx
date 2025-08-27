import { useState } from "react";
import { AgendaToolbar } from "./AgendaToolbar";
import { AgendaMainView } from "./AgendaMainView";
import { EventoUnificado, useAgendaUnificada } from "@/hooks/useAgendaUnificada";
import { EventoDialog } from "./EventoDialog";
import { Button } from "@/components/ui/button";
import { GoogleConnect } from "@/components/Dashboard/GoogleConnect";
import { Plus } from "lucide-react";
import { DateRange } from "react-day-picker";
import { useIsMobile } from "@/hooks/use-mobile";

interface AgendaLayoutProps {
  events?: any[];
  isLoading?: boolean;
  error?: string | null;
}

type ViewMode = 'day' | 'week' | 'month' | 'list';

export function AgendaLayout({ events, isLoading, error }: AgendaLayoutProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const isMobile = useIsMobile();

  const {
    eventos,
    isLoading: isLoadingUnified,
    error: errorUnified,
    createEventoUnificado,
    updateEventoUnificado,
    deleteEventoUnificado,
    refreshAllEvents
  } = useAgendaUnificada();

  // Use unified events instead of Google-only events
  const allEvents = eventos;
  const loading = isLoading || isLoadingUnified;
  const errorMessage = error || errorUnified;

  // Filter events based on search
  const filteredEvents = allEvents.filter(event => {
    const matchesSearch = searchQuery === "" || 
      event.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.descricao?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const handleEventSelect = (event: EventoUnificado) => {
    // Handle event selection - could open a detail modal
    console.log('Selected event:', event);
  };

  const handleCreateEvent = async (data: any, syncToGoogle: boolean) => {
    await createEventoUnificado(data, syncToGoogle);
  };

  const handleUpdateEvent = async (id: string, data: any, syncToGoogle: boolean) => {
    await updateEventoUnificado(id, data, syncToGoogle);
  };

  const handleDeleteEvent = async (id: string, deleteFromGoogle: boolean) => {
    await deleteEventoUnificado(id, deleteFromGoogle);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Agenda Toolbar */}
      <div className="flex-shrink-0">
        <AgendaToolbar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          selectedDate={currentDate}
          onDateChange={setCurrentDate}
        >
          {/* New Event Button - Desktop Only */}
          {!isMobile && (
            <EventoDialog
              onSave={handleCreateEvent}
              isOpen={showCreateDialog}
              onOpenChange={setShowCreateDialog}
            >
              <Button className="bg-foreground hover:bg-foreground/90 text-background border-0 shadow-md flex-shrink-0 px-3 lg:px-4">
                <Plus className="w-4 h-4 lg:mr-2" />
                <span className="hidden lg:inline">Novo Evento</span>
                <span className="lg:hidden ml-1 text-xs">Novo</span>
              </Button>
            </EventoDialog>
          )}
        </AgendaToolbar>
      </div>


      {/* Main View */}
      <div className="flex-1 min-h-0 overflow-hidden bg-calendar-grid/10">
        <AgendaMainView
          events={filteredEvents}
          isLoading={loading}
          error={errorMessage}
          viewMode={viewMode}
          selectedDate={currentDate}
          dateRange={dateRange}
          onEventSelect={handleEventSelect}
        />
      </div>


      {/* Mobile New Event Button - Fixed at bottom */}
      {isMobile && (
        <div className="flex-shrink-0 p-3 border-t border-muted-foreground/20 bg-background">
          <EventoDialog
            onSave={handleCreateEvent}
            isOpen={showCreateDialog}
            onOpenChange={setShowCreateDialog}
          >
            <Button className="w-full bg-foreground hover:bg-foreground/90 text-background border-0 shadow-md h-12">
              <Plus className="w-5 h-5 mr-2" />
              Novo Evento
            </Button>
          </EventoDialog>
        </div>
      )}

      {/* Google Integration Section */}
      <div className="flex-shrink-0 border-t border-muted-foreground/20 bg-background p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-1">Integração com Google Calendar</p>
            <p className="text-xs">Sincronize seus eventos com sua conta Google para uma experiência completa.</p>
          </div>
          <div className="flex-shrink-0">
            <GoogleConnect />
          </div>
        </div>
      </div>
    </div>
  );
}