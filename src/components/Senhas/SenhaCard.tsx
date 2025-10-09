import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Edit, Trash2, Copy } from "lucide-react";
import { Senha, useDeleteSenha } from "@/hooks/useSenhas";
import { useToast } from "@/hooks/use-toast";
import { SenhaDialog } from "./SenhaDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SenhaCardProps {
  senha: Senha;
}

export function SenhaCard({ senha }: SenhaCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const deleteSenha = useDeleteSenha();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência.`,
    });
  };

  const handleDelete = () => {
    deleteSenha.mutate(senha.id);
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base sm:text-lg font-semibold break-words pr-2">{senha.titulo}</CardTitle>
            <div className="flex gap-1 shrink-0">
              <SenhaDialog senha={senha}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Edit className="h-4 w-4" />
                </Button>
              </SenhaDialog>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 flex-1">
          {senha.usuario && (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Usuário:</span>
              <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-md">
                <span className="font-mono text-sm truncate flex-1">{senha.usuario}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => copyToClipboard(senha.usuario!, "Usuário")}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Senha:</span>
            <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-md">
              <span className="font-mono text-sm truncate flex-1">
                {showPassword ? senha.senha : "••••••••"}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => copyToClipboard(senha.senha, "Senha")}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {senha.observacoes && (
            <div className="pt-2 border-t space-y-1">
              <span className="text-xs text-muted-foreground">Observações:</span>
              <p className="text-sm text-muted-foreground break-words">{senha.observacoes}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          Criada em {new Date(senha.created_at).toLocaleDateString('pt-BR')}
        </CardFooter>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a senha "{senha.titulo}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
