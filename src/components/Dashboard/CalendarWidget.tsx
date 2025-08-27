import { Calendar as CalendarIcon, Clock, MapPin, AlertCircle, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { Link } from "react-router-dom";

export function CalendarWidget() {
  const { events, isLoading, error, getTodayEvents, getUpcomingEvents } = useGoogleCalendar();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Próximos Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Próximos Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Conecte sua conta Google</p>
            <p className="text-xs">para visualizar seus eventos</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const todayEvents = getTodayEvents();
  const upcomingEvents = getUpcomingEvents(7).filter(event => !todayEvents.includes(event));
  const totalEvents = todayEvents.length + upcomingEvents.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarIcon className="w-5 h-5" />
            Próximos Eventos
            {totalEvents > 0 && (
              <Badge variant="secondary" className="text-xs">
                {totalEvents}
              </Badge>
            )}
          </CardTitle>
          <Link to="/agenda">
            <Button variant="outline" size="sm">
              Ver Todos
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {todayEvents.length > 0 && (
          <>
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Clock className="w-4 h-4" />
              Hoje
            </div>
            {todayEvents.slice(0, 2).map((event) => (
              <EventItem key={event.id} event={event} isToday={true} />
            ))}
            {todayEvents.length > 2 && (
              <div className="text-xs text-muted-foreground text-center py-2">
                +{todayEvents.length - 2} eventos hoje
              </div>
            )}
            {upcomingEvents.length > 0 && <div className="border-t pt-3" />}
          </>
        )}
        
        {upcomingEvents.length > 0 ? (
          <>
            <div className="text-sm font-medium text-muted-foreground">Próximos Eventos</div>
            {upcomingEvents.slice(0, 3).map((event) => (
              <EventItem key={event.id} event={event} isToday={false} />
            ))}
            {upcomingEvents.length > 3 && (
              <div className="text-xs text-muted-foreground text-center py-2">
                +{upcomingEvents.length - 3} eventos próximos
              </div>
            )}
          </>
        ) : todayEvents.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum evento próximo!</p>
            <p className="text-xs">Sua agenda está livre nos próximos dias.</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

interface EventItemProps {
  event: any;
  isToday: boolean;
}

function EventItem({ event, isToday }: EventItemProps) {
  const formatEventDate = (event: any) => {
    const startDate = new Date(event.start.dateTime || event.start.date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (startDate.toDateString() === today.toDateString()) {
      return "Hoje";
    }
    if (startDate.toDateString() === tomorrow.toDateString()) {
      return "Amanhã";
    }
    return startDate.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  };

  const formatEventTime = (event: any) => {
    if (event.start.date) return "Dia inteiro";
    return new Date(event.start.dateTime).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventStatus = (event: any) => {
    if (event.start.date) return 'allday';
    
    const now = new Date();
    const startTime = new Date(event.start.dateTime);
    const endTime = new Date(event.end.dateTime);
    
    if (now >= startTime && now <= endTime) return 'ongoing';
    if (startTime > now) return 'upcoming';
    return 'past';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing': return 'text-success';
      case 'upcoming': return 'text-primary';
      case 'allday': return 'text-info';
      default: return 'text-muted-foreground';
    }
  };

  const eventStatus = getEventStatus(event);

  return (
    <div className="flex items-start gap-3 p-2 rounded-lg border bg-card">
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-tight line-clamp-1">
            {event.summary}
          </p>
          <Badge 
            variant="secondary" 
            className={`text-xs px-1.5 py-0.5 shrink-0 ${getStatusColor(eventStatus)}`}
          >
            {formatEventTime(event)}
          </Badge>
        </div>
        
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarIcon className="w-3 h-3" />
            {formatEventDate(event)}
          </span>
          
          {event.location && (
            <span className="flex items-center gap-1 line-clamp-1">
              <MapPin className="w-3 h-3" />
              {event.location}
            </span>
          )}
        </div>

        {event.attendees && event.attendees.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="line-clamp-1">
              {event.attendees.length} participante{event.attendees.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}