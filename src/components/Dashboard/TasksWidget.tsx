import { Calendar, Clock, User, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useUserTasks } from "@/hooks/useUserTasks";
import { Link } from "react-router-dom";

const prioridades = {
  baixa: { color: "hsl(var(--success))", bg: "hsl(var(--success) / 0.1)" },
  media: { color: "hsl(var(--warning))", bg: "hsl(var(--warning) / 0.1)" },
  alta: { color: "hsl(var(--destructive))", bg: "hsl(var(--destructive) / 0.1)" },
};

export function TasksWidget() {
  const { tasks, isLoading, availableColumns, updateTaskColumn } = useUserTasks();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Minhas Tarefas
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

  const pendingTasks = tasks?.filter(task => task.coluna_nome !== 'Concluído') || [];
  const urgentTasks = pendingTasks.filter(task => 
    task.data_vencimento && new Date(task.data_vencimento) <= new Date()
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle2 className="w-5 h-5" />
            Minhas Tarefas
            {pendingTasks.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {pendingTasks.length}
              </Badge>
            )}
          </CardTitle>
          <Link to="/projetos">
            <Button variant="outline" size="sm">
              Ver Todos
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {urgentTasks.length > 0 && (
          <>
            <div className="flex items-center gap-2 text-sm font-medium text-destructive">
              <AlertCircle className="w-4 h-4" />
              Tarefas Urgentes
            </div>
            {urgentTasks.slice(0, 2).map((task) => (
              <TaskItem key={task.id} task={task} updateTaskColumn={updateTaskColumn} availableColumns={availableColumns} />
            ))}
            {urgentTasks.length > 2 && (
              <div className="text-xs text-muted-foreground text-center py-2">
                +{urgentTasks.length - 2} tarefas urgentes
              </div>
            )}
            <div className="border-t pt-3" />
          </>
        )}
        
        {pendingTasks.filter(task => !urgentTasks.includes(task)).length > 0 ? (
          <>
            <div className="text-sm font-medium text-muted-foreground">Próximas Tarefas</div>
            {pendingTasks
              .filter(task => !urgentTasks.includes(task))
              .slice(0, 3)
              .map((task) => (
                <TaskItem key={task.id} task={task} updateTaskColumn={updateTaskColumn} availableColumns={availableColumns} />
              ))}
            {pendingTasks.length > (urgentTasks.length + 3) && (
              <div className="text-xs text-muted-foreground text-center py-2">
                +{pendingTasks.length - (urgentTasks.length + 3)} tarefas pendentes
              </div>
            )}
          </>
        ) : urgentTasks.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma tarefa pendente!</p>
            <p className="text-xs">Você está em dia com suas responsabilidades.</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

interface TaskItemProps {
  task: any;
  updateTaskColumn: (taskId: string, columnId: string) => void;
  availableColumns: any[];
}

function TaskItem({ task, updateTaskColumn, availableColumns }: TaskItemProps) {
  const isOverdue = task.data_vencimento && new Date(task.data_vencimento) < new Date();
  
  // Find the "Concluído" column for this task's project
  const concludedColumn = availableColumns?.find(col => 
    col.projeto_id === task.projeto_id && col.nome === 'Concluído'
  );
  
  return (
    <div className="flex items-start gap-3 p-2 rounded-lg border bg-card">
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 rounded-full hover:bg-success/20"
        onClick={() => concludedColumn && updateTaskColumn(task.id, concludedColumn.id)}
        disabled={!concludedColumn}
      >
        <CheckCircle2 className="w-4 h-4" />
      </Button>
      
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-tight line-clamp-1">
            {task.titulo}
          </p>
          <Badge
            variant="secondary"
            className="text-xs px-1.5 py-0.5 shrink-0"
            style={{
              backgroundColor: prioridades[task.prioridade].bg,
              color: prioridades[task.prioridade].color,
              border: `1px solid ${prioridades[task.prioridade].color}`,
            }}
          >
            {task.prioridade}
          </Badge>
        </div>
        
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {task.projeto_nome}
          </span>
          
          {task.data_vencimento && (
            <span className={`flex items-center gap-1 ${isOverdue ? 'text-destructive font-medium' : ''}`}>
              <Calendar className="w-3 h-3" />
              {new Date(task.data_vencimento).toLocaleDateString()}
            </span>
          )}
        </div>

        {task.responsaveis && task.responsaveis.length > 0 && (
          <div className="flex items-center gap-1">
            <div className="flex -space-x-1">
              {task.responsaveis.slice(0, 3).map((responsavel: any, index: number) => (
                <Avatar key={responsavel.user_id} className="w-5 h-5 border border-background">
                  <AvatarImage src={responsavel.avatar_url} />
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                    {responsavel.name?.charAt(0).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
              ))}
              {task.responsaveis.length > 3 && (
                <div className="w-5 h-5 rounded-full bg-muted border border-background flex items-center justify-center">
                  <span className="text-xs">+{task.responsaveis.length - 3}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}