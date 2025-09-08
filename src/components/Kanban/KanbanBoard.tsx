import { useState } from "react";
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, PointerSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useKanbanTasks } from "@/hooks/useKanbanTasks";
import { KanbanColumn } from "./KanbanColumn";
import { TaskCard } from "./TaskCard";
import { TaskDialog } from "./TaskDialog";
import { DeleteTaskDialog } from "./DeleteTaskDialog";
import { MobileFAB } from "./MobileFAB";
import { Tarefa } from "@/hooks/useProjetos";
import { useIsMobile } from "@/hooks/use-mobile";

interface KanbanBoardProps {
  projetoId: string;
}

export function KanbanBoard({ projetoId }: KanbanBoardProps) {
  const isMobile = useIsMobile();
  const { colunas, tarefas, updateTaskPosition, deleteTarefa, isLoadingColunas, isLoadingTarefas } = useKanbanTasks(projetoId);
  const [activeTask, setActiveTask] = useState<Tarefa | null>(null);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [editingTask, setEditingTask] = useState<Tarefa | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Tarefa | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: isMobile ? 5 : 8, // Shorter distance for mobile
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tarefas.find(t => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeTask = tarefas.find(t => t.id === active.id);
    if (!activeTask) return;

    // Check if we're dropping over a column or task
    const overColumn = colunas.find(c => c.id === over.id);
    const overTask = tarefas.find(t => t.id === over.id);
    
    let targetColumnId = overColumn?.id;
    let newPosition = 0;
    
    if (overTask) {
      targetColumnId = overTask.coluna_id;
      
      // If same column, reorder within column
      if (activeTask.coluna_id === targetColumnId) {
        const columnTasks = tarefas.filter(t => t.coluna_id === targetColumnId && t.id !== activeTask.id);
        const overIndex = columnTasks.findIndex(t => t.id === overTask.id);
        newPosition = overIndex >= 0 ? overIndex : columnTasks.length;
      } else {
        // Moving to different column, place after the over task
        newPosition = overTask.posicao + 1;
      }
    } else if (overColumn) {
      // Dropping on empty column or at the end
      const tasksInTargetColumn = tarefas.filter(t => t.coluna_id === targetColumnId);
      newPosition = tasksInTargetColumn.length;
    }

    if (!targetColumnId) return;

    // Only update if position or column changed
    if (activeTask.coluna_id !== targetColumnId || activeTask.posicao !== newPosition) {
      updateTaskPosition.mutate({
        taskId: activeTask.id,
        newColumnId: targetColumnId,
        newPosition,
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
  };

  const handleCreateTask = (columnId: string) => {
    setSelectedColumn(columnId);
    setEditingTask(null);
    setShowTaskDialog(true);
  };

  const handleEditTask = (tarefa: Tarefa) => {
    setEditingTask(tarefa);
    setSelectedColumn(tarefa.coluna_id);
    setShowTaskDialog(true);
  };

  const handleDeleteTask = (tarefa: Tarefa) => {
    setTaskToDelete(tarefa);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (taskToDelete) {
      deleteTarefa.mutate(taskToDelete.id);
      setTaskToDelete(null);
      setShowDeleteDialog(false);
    }
  };

  const handleCreateTaskFAB = () => {
    // Use first column as default for mobile FAB
    const firstColumn = colunas[0];
    if (firstColumn) {
      handleCreateTask(firstColumn.id);
    }
  };

  // Filter tasks based on search
  const filteredTarefas = tarefas.filter(task => 
    searchTerm === "" || 
    task.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoadingColunas || isLoadingTarefas) {
    return (
      <div className="flex gap-2 sm:gap-4 lg:gap-6 overflow-x-auto pb-4 px-2 sm:px-4 lg:px-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex-shrink-0 w-72 sm:w-80 bg-muted/20 rounded-lg p-3 sm:p-4 animate-pulse">
            <div className="h-4 sm:h-6 bg-muted rounded w-20 sm:w-24 mb-3 sm:mb-4"></div>
            <div className="space-y-2 sm:space-y-3">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="h-16 sm:h-20 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] sm:h-[calc(100vh-200px)] flex flex-col bg-gradient-to-br from-muted/30 to-background">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-6 px-3 sm:px-1 py-2 sm:py-4 border-b bg-background/95 backdrop-blur-sm">
        <div className="relative flex-1 max-w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tarefas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background text-sm h-9 sm:h-10"
          />
        </div>
        <Button variant="outline" size="sm" className="bg-background flex-shrink-0 h-9 sm:h-10">
          <Filter className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Filtros</span>
          <span className="sm:hidden">Filtrar</span>
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className={`flex gap-2 sm:gap-3 lg:gap-6 overflow-x-auto pb-4 sm:pb-6 px-2 sm:px-4 lg:px-6 flex-1 min-h-0 custom-scrollbar ${isMobile ? 'kanban-container' : ''}`}>
          <SortableContext items={colunas.map(c => c.id)} strategy={horizontalListSortingStrategy}>
            {colunas.map((coluna) => (
              <KanbanColumn
                key={coluna.id}
                coluna={coluna}
                tarefas={filteredTarefas.filter(t => t.coluna_id === coluna.id)}
                onCreateTask={() => handleCreateTask(coluna.id)}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
              />
            ))}
          </SortableContext>
        </div>
        
        <DragOverlay>
          {activeTask && (
            <div className={`rotate-3 opacity-90 scale-105 ${isMobile ? 'dnd-dragging' : ''}`}>
              <TaskCard tarefa={activeTask} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <TaskDialog
        open={showTaskDialog}
        onOpenChange={setShowTaskDialog}
        projetoId={projetoId}
        colunaId={selectedColumn}
        tarefa={editingTask}
      />
      
      <DeleteTaskDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleConfirmDelete}
        taskTitle={taskToDelete?.titulo}
      />

      <MobileFAB 
        onClick={handleCreateTaskFAB}
        visible={colunas.length > 0 && !showTaskDialog}
      />
    </div>
  );
}