import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
}

export const useGoogleCalendar = () => {
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        method: 'GET'
      });

      if (error) throw error;

      if (data?.success) {
        setEvents(data.events || []);
      } else {
        throw new Error(data?.error || 'Failed to fetch calendar events');
      }
    } catch (error: any) {
      console.error('Error fetching calendar events:', error);
      setError(error.message || 'Erro ao carregar eventos do calendário');
      
      if (error.message?.includes('not connected')) {
        toast.error('Conecte sua conta Google primeiro');
      } else {
        toast.error('Erro ao carregar eventos do calendário');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getTodayEvents = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return events.filter(event => {
      const eventDate = new Date(event.start.dateTime || event.start.date || '');
      return eventDate >= today && eventDate < tomorrow;
    });
  }, [events]);

  const getUpcomingEvents = useCallback((days: number = 7) => {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return events.filter(event => {
      const eventDate = new Date(event.start.dateTime || event.start.date || '');
      return eventDate >= now && eventDate <= futureDate;
    }).slice(0, 10); // Limit to 10 events
  }, [events]);

  // Auto-fetch events when hook is used
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    isLoading,
    error,
    fetchEvents,
    getTodayEvents,
    getUpcomingEvents
  };
};