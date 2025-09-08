import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, Edit3, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tarefa } from "@/hooks/useProjetos";
import { InlineEdit } from "./InlineEdit";
import { useKanbanTasks } from "@/hooks/useKanbanTasks";

interface TaskCardProps {
  tarefa: Tarefa;
  onEdit?: () => void;
  onDelete?: () => void;
}

const prioridades = {
  baixa: { color: "hsl(var(--success))", bg: "hsl(var(--success) / 0.1)" },
  media: { color: "hsl(var(--warning))", bg: "hsl(var(--warning) / 0.1)" },
  alta: { color: "hsl(var(--destructive))", bg: "hsl(var(--destructive) / 0.1)" },
};

export function TaskCard({ tarefa, onEdit, onDelete }: TaskCardProps) {
  const { updateTarefa } = useKanbanTasks(tarefa.projeto_id);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: tarefa.id,
  });

  const handleTitleSave = (newTitle: string) => {
    updateTarefa.mutate({
      id: tarefa.id,
      titulo: newTitle,
    });
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1000 : 1,
    borderLeftColor: tarefa.prioridade === 'alta' ? 'hsl(var(--destructive))' : 
                    tarefa.prioridade === 'media' ? 'hsl(var(--warning))' : 
                    'hsl(var(--success))'
  };

  const isOverdue = tarefa.data_vencimento && new Date(tarefa.data_vencimento) < new Date();

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit?.();
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onDoubleClick={handleDoubleClick}
      className={`cursor-grab active:cursor-grabbing bg-card hover:bg-muted/50 hover:shadow-md transition-all duration-200 group border-l-4 shadow-sm task-card ${
        isDragging ? "shadow-xl rotate-2 scale-105 bg-accent/20" : "hover:scale-[1.01]"
      } ${isOverdue ? "border-l-destructive" : ""}`}
    >
      <CardContent className="p-2 sm:p-3 space-y-1.5 sm:space-y-2">
        {/* Header with priority and edit button */}
        <div className="flex items-center justify-between">
          <Badge
            variant="secondary"
            className="text-xs px-1.5 py-0.5 sm:px-2 sm:py-1"
            style={{
              backgroundColor: prioridades[tarefa.prioridade].bg,
              color: prioridades[tarefa.prioridade].color,
              border: `1px solid ${prioridades[tarefa.prioridade].color}`,
            }}
          >
            <span className="hidden sm:inline">{tarefa.prioridade}</span>
            <span className="sm:hidden">{tarefa.prioridade.charAt(0).toUpperCase()}</span>
          </Badge>
          <div className="flex items-center gap-0.5 sm:gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 sm:h-6 sm:w-6 p-0"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Edit3 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 sm:h-6 sm:w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="font-medium text-xs sm:text-sm leading-snug">
          <InlineEdit
            value={tarefa.titulo}
            onSave={handleTitleSave}
            className="font-medium text-xs sm:text-sm"
            placeholder="Título da tarefa"
          />
        </div>

        {/* Description */}
        {tarefa.descricao && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-tight">
            {tarefa.descricao}
          </p>
        )}

        {/* Labels */}
        {tarefa.labels && tarefa.labels.length > 0 && (
          <div className="flex flex-wrap gap-0.5 sm:gap-1">
            {tarefa.labels.slice(0, 2).map((label, index) => (
              <Badge key={index} variant="outline" className="text-xs px-1 py-0 max-w-16 truncate">
                {label}
              </Badge>
            ))}
            {tarefa.labels.length > 2 && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                +{tarefa.labels.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 sm:pt-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {tarefa.data_vencimento && (
              <div className={`flex items-center gap-1 ${isOverdue ? "text-destructive font-medium" : ""}`}>
                <Calendar className="w-3 h-3 flex-shrink-0" />
                <span className="text-xs truncate max-w-20 sm:max-w-none">
                  {new Date(tarefa.data_vencimento).toLocaleDateString('pt-BR', { 
                    day: '2-digit', 
                    month: '2-digit'
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Assignees */}
          {tarefa.responsaveis && tarefa.responsaveis.length > 0 && (
            <div className="flex -space-x-1">
              {tarefa.responsaveis.slice(0, 2).map((responsavel) => (
                <Avatar key={responsavel.user_id} className="w-5 h-5 sm:w-6 sm:h-6 ring-2 ring-background shadow-sm">
                  <AvatarImage src={responsavel.avatar_url} />
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                    {responsavel.name?.charAt(0).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
              ))}
              {tarefa.responsaveis.length > 2 && (
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-muted ring-2 ring-background shadow-sm flex items-center justify-center">
                  <span className="text-xs font-medium">+{tarefa.responsaveis.length - 2}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}