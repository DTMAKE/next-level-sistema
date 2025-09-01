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
      className={`flex-shrink-0 w-80 bg-muted/30 rounded-lg transition-all duration-200 ${
        isOver ? "ring-2 ring-primary/50 bg-accent/20" : ""
      }`}
    >
      {/* Column Header */}
      <div 
        className="p-4 border-b border-border/50 cursor-grab active:cursor-grabbing bg-muted/50 rounded-t-lg"
        {...listeners}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <div
              className="w-3 h-3 rounded-full shadow-sm flex-shrink-0"
              style={{ backgroundColor: coluna.cor }}
            />
            <InlineEdit
              value={coluna.nome}
              onSave={handleColumnNameSave}
              className="font-semibold text-sm flex-1"
              placeholder="Nome da coluna"
            />
            <Badge variant="secondary" className="text-xs bg-background/50">
              {tarefas.length}
            </Badge>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onCreateTask}
            className="h-6 w-6 p-0 ml-2"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Droppable Area */}
      <div
        ref={droppableRef}
        className={`p-4 min-h-[200px] max-h-[calc(100vh-300px)] overflow-y-auto transition-colors ${
          isOver ? "bg-accent/10" : ""
        }`}
      >
        <SortableContext items={tarefas.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
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
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Nenhuma tarefa nesta coluna
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={onCreateTask}
              className="text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Adicionar tarefa
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}