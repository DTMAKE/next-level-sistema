import { CalendarDays } from "lucide-react";
import { AgendaLayout } from "@/components/Agenda/AgendaLayout";

export default function Agenda() {
  return (
    <div className="h-full flex flex-col">
      {/* Google Calendar Style Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-calendar-border bg-background">
        <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
        <h1 className="text-lg sm:text-xl font-semibold text-foreground">Agenda</h1>
      </div>

      {/* Main Agenda Layout - Full width and height */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <AgendaLayout />
      </div>
    </div>
  );
}