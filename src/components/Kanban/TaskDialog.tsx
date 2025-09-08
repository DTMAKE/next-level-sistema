import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, User, AlertCircle, Tag, FileText } from "lucide-react";
import { format } from "date-fns";
import { useKanbanTasks } from "@/hooks/useKanbanTasks";
import { Tarefa } from "@/hooks/useProjetos";
import { useToast } from "@/hooks/use-toast";
import { MultipleAssigneeSelector } from "./MultipleAssigneeSelector";

const tarefaSchema = z.object({
  titulo: z.string()
    .min(3, "Título deve ter pelo menos 3 caracteres")
    .max(100, "Título não pode ter mais de 100 caracteres"),
  descricao: z.string()
    .max(500, "Descrição não pode ter mais de 500 caracteres")
    .optional(),
  prioridade: z.enum(["baixa", "media", "alta"]).default("media"),
  responsavelIds: z.array(z.string()).optional(),
  data_vencimento: z.date().optional(),
  labels: z.string()
    .max(200, "Labels não podem ter mais de 200 caracteres")
    .optional(),
});

type TarefaFormData = z.infer<typeof tarefaSchema>;

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projetoId: string;
  colunaId?: string;
  tarefa?: Tarefa;
}

export function TaskDialog({ open, onOpenChange, projetoId, colunaId, tarefa }: TaskDialogProps) {
  const { createTarefa, updateTarefa, usuarios, colunas } = useKanbanTasks(projetoId);
  const { toast } = useToast();
  const titleInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<TarefaFormData>({
    resolver: zodResolver(tarefaSchema),
    defaultValues: {
      titulo: tarefa?.titulo || "",
      descricao: tarefa?.descricao || "",
      prioridade: tarefa?.prioridade || "media",
      responsavelIds: tarefa?.responsaveis?.map(r => r.user_id) || [],
      data_vencimento: tarefa?.data_vencimento ? new Date(tarefa.data_vencimento) : undefined,
      labels: tarefa?.labels?.join(", ") || "",
    },
  });

  // Auto focus title input when dialog opens
  useEffect(() => {
    if (open && titleInputRef.current) {
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
  }, [open]);

  // Reset form when dialog closes or when tarefa changes
  useEffect(() => {
    if (!open) {
      form.reset({
        titulo: "",
        descricao: "",
        prioridade: "media",
        responsavelIds: [],
        data_vencimento: undefined,
        labels: "",
      });
    } else if (tarefa) {
      form.reset({
        titulo: tarefa.titulo || "",
        descricao: tarefa.descricao || "",
        prioridade: tarefa.prioridade || "media",
        responsavelIds: tarefa.responsaveis?.map(r => r.user_id) || [],
        data_vencimento: tarefa.data_vencimento ? new Date(tarefa.data_vencimento) : undefined,
        labels: tarefa.labels?.join(", ") || "",
      });
    } else {
      form.reset({
        titulo: "",
        descricao: "",
        prioridade: "media",
        responsavelIds: [],
        data_vencimento: undefined,
        labels: "",
      });
    }
  }, [open, form, tarefa]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (open && e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        form.handleSubmit(onSubmit)();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, form]);

  const onSubmit = async (data: TarefaFormData) => {
    try {
      const tarefaData = {
        titulo: data.titulo,
        descricao: data.descricao,
        prioridade: data.prioridade,
        projeto_id: projetoId,
        coluna_id: colunaId || tarefa?.coluna_id || "",
        data_vencimento: data.data_vencimento?.toISOString().split('T')[0],
        labels: data.labels ? data.labels.split(",").map(label => label.trim()).filter(Boolean) : [],
        responsavelIds: data.responsavelIds || [],
      };

      if (tarefa) {
        // Update existing task
        updateTarefa.mutate({
          id: tarefa.id,
          ...tarefaData,
        });
      } else {
        // Create new task
        createTarefa.mutate(tarefaData);
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar tarefa:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar a tarefa. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const remainingChars = {
    titulo: 100 - form.watch("titulo").length,
    descricao: 500 - (form.watch("descricao")?.length || 0),
    labels: 200 - (form.watch("labels")?.length || 0),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 flex-shrink-0" />
            <span className="truncate">{tarefa ? "Editar Tarefa" : "Nova Tarefa"}</span>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Título */}
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Título *
                    <span className={`text-xs ml-auto ${
                      remainingChars.titulo < 10 ? "text-destructive" : "text-muted-foreground"
                    }`}>
                      {remainingChars.titulo} caracteres restantes
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      ref={titleInputRef}
                      placeholder="Digite o título da tarefa"
                      {...field}
                      className="focus:ring-primary"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descrição */}
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Descrição
                    <span className={`text-xs ml-auto ${
                      remainingChars.descricao < 50 ? "text-destructive" : "text-muted-foreground"
                    }`}>
                      {remainingChars.descricao} caracteres restantes
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva os detalhes da tarefa (opcional)"
                      className="resize-none min-h-[100px] focus:ring-primary"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Prioridade e Responsáveis - Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="prioridade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Prioridade
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="focus:ring-primary">
                          <SelectValue placeholder="Selecionar prioridade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="baixa">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            Baixa
                          </div>
                        </SelectItem>
                        <SelectItem value="media">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            Média
                          </div>
                        </SelectItem>
                        <SelectItem value="alta">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            Alta
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="responsavelIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Responsáveis
                    </FormLabel>
                    <FormControl>
                      <MultipleAssigneeSelector
                        users={usuarios}
                        selectedUserIds={field.value || []}
                        onSelectionChange={field.onChange}
                        placeholder="Selecionar responsáveis"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Data de Vencimento */}
            <FormField
              control={form.control}
              name="data_vencimento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    Data de Vencimento
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={`w-full pl-3 text-left font-normal focus:ring-primary ${
                            !field.value && "text-muted-foreground"
                          }`}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy")
                          ) : (
                            <span>Selecionar data (opcional)</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-auto p-0 max-w-[90vw]" 
                      align="start"
                      side="bottom"
                      sideOffset={4}
                    >
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Labels */}
            <FormField
              control={form.control}
              name="labels"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Tags
                    <span className={`text-xs ml-auto ${
                      remainingChars.labels < 20 ? "text-destructive" : "text-muted-foreground"
                    }`}>
                      {remainingChars.labels} caracteres restantes
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Tag1, Tag2, Tag3 (opcional, separadas por vírgula)"
                      className="focus:ring-primary"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createTarefa.isPending || updateTarefa.isPending}
                className="min-w-[100px] w-full sm:w-auto order-1 sm:order-2"
              >
                {createTarefa.isPending || updateTarefa.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-b-transparent"></div>
                    Salvando...
                  </div>
                ) : (
                  tarefa ? "Atualizar" : "Criar Tarefa"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}