import { useState, useEffect, useCallback } from 'react';
import { useGoogleCalendar, GoogleCalendarEvent } from './useGoogleCalendar';
import { useEventos, Evento } from './useEventos';

export interface EventoUnificado {
  id: string;
  titulo: string;
  descricao?: string;
  data_inicio: string;
  data_fim: string;
  local?: string;
  tipo: 'local' | 'google';
  cor: string;
  google_event_id?: string;
  evento_local?: Evento;
  evento_google?: GoogleCalendarEvent;
}

export const useAgendaUnificada = () => {
  const [eventos, setEventos] = useState<EventoUnificado[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { 
    events: googleEvents, 
    isLoading: isLoadingGoogle, 
    error: googleError,
    fetchEvents: refetchGoogleEvents 
  } = useGoogleCalendar();
  
  const { 
    fetchEventos, 
    createEvento, 
    updateEvento, 
    deleteEvento, 
    syncWithGoogle,
    isLoading: isLoadingLocal 
  } = useEventos();

  // Convert Google Calendar events to unified format
  const convertGoogleEvent = useCallback((googleEvent: GoogleCalendarEvent): EventoUnificado => {
    return {
      id: googleEvent.id,
      titulo: googleEvent.summary || 'Evento sem título',
      descricao: googleEvent.description,
      data_inicio: googleEvent.start.dateTime || googleEvent.start.date || '',
      data_fim: googleEvent.end.dateTime || googleEvent.end.date || '',
      local: googleEvent.location,
      tipo: 'google',
      cor: '#4285F4', // Google Calendar blue
      google_event_id: googleEvent.id,
      evento_google: googleEvent
    };
  }, []);

  // Convert local events to unified format
  const convertLocalEvent = useCallback((localEvent: Evento): EventoUnificado => {
    return {
      id: localEvent.id,
      titulo: localEvent.titulo,
      descricao: localEvent.descricao,
      data_inicio: localEvent.data_inicio,
      data_fim: localEvent.data_fim,
      local: localEvent.local,
      tipo: 'local',
      cor: localEvent.cor,
      google_event_id: localEvent.google_event_id,
      evento_local: localEvent
    };
  }, []);

  // Fetch and combine all events
  const fetchAllEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch local events
      const localEventos = await fetchEventos();
      const unifiedLocalEvents = localEventos.map(convertLocalEvent);

      // Convert Google events
      const unifiedGoogleEvents = googleEvents.map(convertGoogleEvent);

      // Combine and sort by start date
      const allEvents = [...unifiedLocalEvents, ...unifiedGoogleEvents];
      allEvents.sort((a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime());

      setEventos(allEvents);
    } catch (error: any) {
      console.error('Error fetching unified events:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [googleEvents, fetchEventos, convertGoogleEvent, convertLocalEvent]);

  // Auto-fetch when dependencies change
  useEffect(() => {
    fetchAllEvents();
  }, [fetchAllEvents]);

  // Create event (local with optional Google sync)
  const createEventoUnificado = useCallback(async (
    eventoData: { 
      titulo: string; 
      descricao?: string; 
      data_inicio: string; 
      data_fim: string; 
      local?: string; 
      cor?: string 
    },
    syncToGoogle: boolean = false
  ) => {
    const novoEvento = await createEvento(eventoData);
    if (novoEvento && syncToGoogle) {
      await syncWithGoogle(novoEvento, 'create');
    }
    await fetchAllEvents();
    return novoEvento;
  }, [createEvento, syncWithGoogle, fetchAllEvents]);

  // Update event
  const updateEventoUnificado = useCallback(async (
    id: string, 
    updates: { 
      titulo?: string; 
      descricao?: string; 
      data_inicio?: string; 
      data_fim?: string; 
      local?: string; 
      cor?: string 
    },
    syncToGoogle: boolean = false
  ) => {
    const evento = eventos.find(e => e.id === id);
    if (!evento) return null;

    if (evento.tipo === 'local') {
      const updatedEvento = await updateEvento(id, updates);
      if (updatedEvento && syncToGoogle && updatedEvento.google_event_id) {
        await syncWithGoogle(updatedEvento, 'update');
      }
      await fetchAllEvents();
      return updatedEvento;
    } else {
      // Google events - would need to update via Google Calendar API
      // For now, show message that Google events should be edited in Google Calendar
      return null;
    }
  }, [eventos, updateEvento, syncWithGoogle, fetchAllEvents]);

  // Delete event
  const deleteEventoUnificado = useCallback(async (
    id: string, 
    deleteFromGoogle: boolean = false
  ) => {
    const evento = eventos.find(e => e.id === id);
    if (!evento) return false;

    if (evento.tipo === 'local') {
      if (deleteFromGoogle && evento.google_event_id) {
        await syncWithGoogle(evento.evento_local!, 'delete');
      }
      const success = await deleteEvento(id);
      if (success) {
        await fetchAllEvents();
      }
      return success;
    } else {
      // Google events - would need to delete via Google Calendar API
      // For now, show message that Google events should be deleted in Google Calendar
      return false;
    }
  }, [eventos, deleteEvento, syncWithGoogle, fetchAllEvents]);

  // Get events for a specific date
  const getEventosForDate = useCallback((date: Date) => {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    return eventos.filter(evento => {
      const eventDate = new Date(evento.data_inicio);
      return eventDate >= targetDate && eventDate < nextDay;
    });
  }, [eventos]);

  // Get today's events
  const getTodayEvents = useCallback(() => {
    return getEventosForDate(new Date());
  }, [getEventosForDate]);

  // Get upcoming events
  const getUpcomingEvents = useCallback((days: number = 7) => {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return eventos.filter(evento => {
      const eventDate = new Date(evento.data_inicio);
      return eventDate >= now && eventDate <= futureDate;
    }).slice(0, 10);
  }, [eventos]);

  const refreshAllEvents = useCallback(async () => {
    await refetchGoogleEvents();
    await fetchAllEvents();
  }, [refetchGoogleEvents, fetchAllEvents]);

  return {
    eventos,
    isLoading: isLoading || isLoadingGoogle || isLoadingLocal,
    error: error || googleError,
    fetchAllEvents,
    refreshAllEvents,
    createEventoUnificado,
    updateEventoUnificado,
    deleteEventoUnificado,
    getEventosForDate,
    getTodayEvents,
    getUpcomingEvents
  };
};