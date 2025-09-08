import { useSortable } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaskCard } from "./TaskCard";
import { ColunaKanban, Tarefa } from "@/hooks/useProjetos";
import { InlineEdit } from "./InlineEdit";

import { logger } from '@/utils/logger';

interface KanbanColumnProps {
  coluna: ColunaKanban;
  tarefas: (Tarefa & { responsavel?: { name: string; avatar_url?: string } })[];
  onCreateTask: () => void;
  onEditTask: (task: Tarefa) => void;
  onDeleteTask: (task: Tarefa) => void;
}

export function KanbanColumn({ coluna, tarefas, onCreateTask, onEditTask, onDeleteTask }: KanbanColumnProps) {
  const { setNodeRef: droppableRef, isOver } = useDroppable({
    id: coluna.id,
  });

  const {
    attributes,
    listeners,
    setNodeRef: sortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: coluna.id,
  });

  const handleColumnNameSave = (newName: string) => {
    logger.debug("Update column name", { columnId: coluna.id, newName });
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={sortableRef}
      style={style}
      {...attributes}
      className={`flex-shrink-0 w-72 sm:w-80 bg-muted/30 rounded-lg transition-all duration-200 kanban-column ${
        isOver ? "ring-2 ring-primary/50 bg-accent/20 dnd-drop-target" : ""
      }`}
    >
      {/* Column Header */}
      <div 
        className="p-3 sm:p-4 border-b border-border/50 cursor-grab active:cursor-grabbing bg-muted/50 rounded-t-lg"
        {...listeners}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div
              className="w-3 h-3 rounded-full shadow-sm flex-shrink-0"
              style={{ backgroundColor: coluna.cor }}
            />
            <InlineEdit
              value={coluna.nome}
              onSave={handleColumnNameSave}
              className="font-semibold text-xs sm:text-sm flex-1 truncate"
              placeholder="Nome da coluna"
            />
            <Badge variant="secondary" className="text-xs bg-background/50 px-1.5 py-0.5">
              {tarefas.length}
            </Badge>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onCreateTask}
            className="h-6 w-6 p-0 ml-1 sm:ml-2 flex-shrink-0"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </div>
      </div>

      {/* Droppable Area */}
      <div
        ref={droppableRef}
        className={`p-2 sm:p-4 min-h-[150px] sm:min-h-[200px] max-h-[calc(100vh-220px)] sm:max-h-[calc(100vh-300px)] overflow-y-auto transition-colors custom-scrollbar ${
          isOver ? "bg-accent/10" : ""
        }`}
      >
        <SortableContext items={tarefas.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 sm:space-y-3">
            {tarefas.map((tarefa) => (
              <TaskCard 
                key={tarefa.id} 
                tarefa={tarefa} 
                onEdit={() => onEditTask(tarefa)}
                onDelete={() => onDeleteTask(tarefa)}
              />
            ))}
          </div>
        </SortableContext>
        
        {tarefas.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center">
            <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
              Nenhuma tarefa
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={onCreateTask}
              className="text-xs h-8"
            >
              <Plus className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">Adicionar tarefa</span>
              <span className="sm:hidden">Adicionar</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}