import { useState } from "react";
import { AgendaToolbar } from "./AgendaToolbar";
import { AgendaMainView } from "./AgendaMainView";
import { EventoUnificado, useAgendaUnificada } from "@/hooks/useAgendaUnificada";
import { AgendaEventDetail } from "./AgendaEventDetail";
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
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedEvent, setSelectedEvent] = useState<EventoUnificado | null>(null);
  const isMobile = useIsMobile();

  const {
    eventos,
    isLoading: isLoadingUnified,
    error: errorUnified,
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
    setSelectedEvent(event);
  };

  const handleCloseEventDetail = () => {
    setSelectedEvent(null);
  };

  // Convert EventoUnificado to GoogleCalendarEvent for detail view
  const convertToGoogleEvent = (evento: EventoUnificado) => ({
    id: evento.id?.toString() || '',
    summary: evento.titulo,
    description: evento.descricao || '',
    start: {
      dateTime: evento.data_inicio,
      date: evento.data_inicio
    },
    end: {
      dateTime: evento.data_fim || evento.data_inicio,
      date: evento.data_fim || evento.data_inicio
    },
    location: evento.local || '',
    attendees: []
  });

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
        />
      </div>

      {/* Main View */}
      <div className="flex-1 min-h-0 overflow-hidden bg-calendar-grid/10">
        {selectedEvent ? (
          <AgendaEventDetail
            event={convertToGoogleEvent(selectedEvent)}
            onClose={handleCloseEventDetail}
          />
        ) : (
          <AgendaMainView
            events={filteredEvents}
            isLoading={loading}
            error={errorMessage}
            viewMode={viewMode}
            selectedDate={currentDate}
            dateRange={dateRange}
            onEventSelect={handleEventSelect}
          />
        )}
      </div>
    </div>
  );
}