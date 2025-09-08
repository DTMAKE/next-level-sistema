import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useProjetos } from "@/hooks/useProjetos";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const projetoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().optional(),
  cor: z.string().default("#3B82F6"),
  privado: z.boolean().default(false),
});

type ProjetoFormData = z.infer<typeof projetoSchema>;

interface ProjetoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projeto?: any;
}

const cores = [
  "#3B82F6", "#EF4444", "#10B981", "#F59E0B", 
  "#8B5CF6", "#06B6D4", "#F97316", "#84CC16"
];

export function ProjetoDialog({ open, onOpenChange, projeto }: ProjetoDialogProps) {
  const { createProjeto, updateProjeto } = useProjetos();
  const { user } = useAuth();
  const [selectedCor, setSelectedCor] = useState("#3B82F6");
  const [userRole, setUserRole] = useState<string>("");

  const form = useForm<ProjetoFormData>({
    resolver: zodResolver(projetoSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      cor: "#3B82F6",
      privado: false,
    },
  });

  // Get user role
  useEffect(() => {
    const getUserRole = async () => {
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", user.id)
          .single();
        setUserRole(data?.role || "");
      }
    };
    getUserRole();
  }, [user]);

  // Reset form when projeto changes or dialog opens
  useEffect(() => {
    if (open) {
      const defaultValues = {
        nome: projeto?.nome || "",
        descricao: projeto?.descricao || "",
        cor: projeto?.cor || "#3B82F6",
        privado: projeto?.privado || false,
      };
      form.reset(defaultValues);
      setSelectedCor(projeto?.cor || "#3B82F6");
    }
  }, [open, projeto, form]);

  const onSubmit = async (data: ProjetoFormData) => {
    try {
      const projetoData = { 
        nome: data.nome,
        descricao: data.descricao,
        cor: selectedCor, 
        ativo: true,
        privado: data.privado || false,
      };
      
      if (projeto) {
        await updateProjeto.mutateAsync({ id: projeto.id, ...projetoData });
      } else {
        await createProjeto.mutateAsync(projetoData);
      }
      
      onOpenChange(false);
      form.reset();
      setSelectedCor("#3B82F6");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[425px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {projeto ? "Editar Projeto" : "Novo Projeto"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Projeto</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Website da empresa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva brevemente o projeto..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Cor do Projeto</FormLabel>
              <div className="flex flex-wrap gap-2">
                {cores.map((cor) => (
                  <button
                    key={cor}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      selectedCor === cor 
                        ? "border-foreground scale-110" 
                        : "border-muted-foreground/20 hover:border-muted-foreground/40"
                    }`}
                    style={{ backgroundColor: cor }}
                    onClick={() => setSelectedCor(cor)}
                  />
                ))}
              </div>
            </div>

            {userRole === 'admin' && (
              <FormField
                control={form.control}
                name="privado"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Projeto Privado
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Apenas administradores poderão ver este projeto
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            )}

            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
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
                disabled={createProjeto.isPending || updateProjeto.isPending}
                className="w-full sm:w-auto order-1 sm:order-2"
              >
                {createProjeto.isPending || updateProjeto.isPending
                  ? "Salvando..." 
                  : projeto ? "Atualizar" : "Criar Projeto"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}