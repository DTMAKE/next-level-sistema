import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Upload, FileText, Repeat } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useCreateContaPagar, CreateContaPagarData } from "@/hooks/useContasPagar";

const formSchema = z.object({
  descricao: z.string().min(1, "Nome da despesa é obrigatório"),
  valor: z.number().min(0.01, "Valor deve ser maior que zero"),
  data_transacao: z.date({
    required_error: "Data da transação é obrigatória",
  }),
  data_vencimento: z.date().optional(),
  forma_pagamento: z.enum(['a_vista', 'parcelado']),
  parcelas: z.number().min(1).max(36).optional(),
  observacoes: z.string().optional(),
  recorrente: z.boolean().default(false),
  frequencia: z.enum(['mensal', 'trimestral', 'semestral', 'anual']).optional(),
  data_fim_recorrencia: z.date().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ContaPagarDialogProps {
  children: React.ReactNode;
}

export function ContaPagarDialog({ children }: ContaPagarDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const createContaPagar = useCreateContaPagar();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      descricao: "",
      valor: undefined,
      data_transacao: new Date(),
      forma_pagamento: "a_vista",
      parcelas: 2,
      observacoes: "",
      recorrente: false,
      frequencia: "mensal",
    },
  });

  const formaPagamento = form.watch("forma_pagamento");
  const recorrente = form.watch("recorrente");

  const onSubmit = async (data: FormData) => {
    const createData: CreateContaPagarData = {
      descricao: data.descricao,
      valor: data.valor,
      data_transacao: format(data.data_transacao, 'yyyy-MM-dd'),
      data_vencimento: data.data_vencimento ? format(data.data_vencimento, 'yyyy-MM-dd') : undefined,
      forma_pagamento: data.forma_pagamento,
      parcelas: data.parcelas,
      observacoes: data.observacoes,
      comprovante_file: selectedFile || undefined,
      recorrente: data.recorrente,
      frequencia: data.recorrente ? data.frequencia : undefined,
      data_fim_recorrencia: data.recorrente && data.data_fim_recorrencia ? format(data.data_fim_recorrencia, 'yyyy-MM-dd') : undefined,
    };

    try {
      await createContaPagar.mutateAsync(createData);
      form.reset({
        descricao: "",
        valor: undefined,
        data_transacao: new Date(),
        forma_pagamento: "a_vista",
        parcelas: 2,
        observacoes: "",
        recorrente: false,
        frequencia: "mensal",
      });
      setSelectedFile(null);
      setOpen(false);
    } catch (error) {
      console.error('Error creating conta a pagar:', error);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type (PDF, images)
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (allowedTypes.includes(file.type)) {
        setSelectedFile(file);
      } else {
        alert('Tipo de arquivo não permitido. Use PDF, JPG ou PNG.');
        event.target.value = '';
      }
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset everything when closing
      form.reset({
        descricao: "",
        valor: undefined,
        data_transacao: new Date(),
        forma_pagamento: "a_vista",
        parcelas: 2,
        observacoes: "",
        recorrente: false,
        frequencia: "mensal",
      });
      setSelectedFile(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto z-[100] max-w-[95vw] sm:max-w-[600px]">
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="text-2xl text-foreground">Nova Conta a Pagar</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Preencha os dados abaixo para cadastrar a despesa
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Nome da Despesa *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Aluguel, Energia, Fornecedor..." 
                      className="h-12 text-base"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Valor (R$) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0,00"
                        className="h-12 text-base"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === "" ? undefined : parseFloat(value) || 0);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="forma_pagamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Forma de Pagamento *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 text-base">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background border shadow-lg z-[100]">
                        <SelectItem value="a_vista">À Vista</SelectItem>
                        <SelectItem value="parcelado">Parcelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {formaPagamento === 'parcelado' && (
              <FormField
                control={form.control}
                name="parcelas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Número de Parcelas</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="2" 
                        max="36" 
                        placeholder="2"
                        className="h-12 text-base"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === "" ? undefined : parseInt(value) || 2);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_transacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Data da Despesa *</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        className="h-12 text-base"
                        {...field}
                        value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value ? new Date(value + 'T00:00:00') : null);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data_vencimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Data de Vencimento</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        className="h-12 text-base"
                        {...field}
                        value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value ? new Date(value + 'T00:00:00') : null);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Seção de Recorrência */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <FormField
                control={form.control}
                name="recorrente"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-base font-medium">
                        <Repeat className="h-4 w-4 inline mr-2" />
                        Despesa Recorrente
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Gerar automaticamente esta despesa todos os meses
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              {recorrente && (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="frequencia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Frequência</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 text-base">
                                <SelectValue placeholder="Selecione a frequência" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-background border shadow-lg z-[100]">
                              <SelectItem value="mensal">Mensal</SelectItem>
                              <SelectItem value="trimestral">Trimestral</SelectItem>
                              <SelectItem value="semestral">Semestral</SelectItem>
                              <SelectItem value="anual">Anual</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="data_fim_recorrencia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Data Fim (Opcional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              className="h-12 text-base"
                              {...field}
                              value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                field.onChange(value ? new Date(value + 'T00:00:00') : null);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/30 p-3 rounded border border-blue-200 dark:border-blue-800">
                    <p>💡 Se não informar data fim, a recorrência será gerada por 12 meses a partir da data inicial.</p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="comprovante" className="text-base font-medium">
                Nota/Comprovante (PDF, JPG, PNG)
              </Label>
              <div className="mt-2">
                <label htmlFor="comprovante" className="cursor-pointer">
                  <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors bg-muted/30">
                    {selectedFile ? (
                      <div className="flex items-center justify-center space-x-2">
                        <FileText className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-green-600 font-medium">{selectedFile.name}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Clique para selecionar arquivo</span>
                        <span className="text-xs text-muted-foreground">PDF, JPG ou PNG até 10MB</span>
                      </div>
                    )}
                  </div>
                </label>
                <input
                  id="comprovante"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                  key={selectedFile?.name || 'empty'}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Observações adicionais sobre esta despesa..."
                      className="min-h-[100px] text-base resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg border">
              <p>* Campos obrigatórios</p>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                className="flex-1 h-12 text-base"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createContaPagar.isPending}
                className="flex-1 h-12 text-base gradient-premium border-0 text-background font-medium"
              >
                {createContaPagar.isPending ? "Criando..." : "Criar Conta"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}