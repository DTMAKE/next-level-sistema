import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Edit, Trash2, Copy, ExternalLink } from "lucide-react";
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
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg font-semibold">{senha.titulo}</CardTitle>
            <div className="flex gap-2">
              <SenhaDialog senha={senha}>
                <Button variant="ghost" size="icon">
                  <Edit className="h-4 w-4" />
                </Button>
              </SenhaDialog>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteDialogOpen(true)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {senha.usuario && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Usuário:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono">{senha.usuario}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => copyToClipboard(senha.usuario!, "Usuário")}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Senha:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono">
                {showPassword ? senha.senha : "••••••••"}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => copyToClipboard(senha.senha, "Senha")}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {senha.url && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">URL:</span>
              <a
                href={senha.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <span className="truncate max-w-[200px]">{senha.url}</span>
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
              </a>
            </div>
          )}

          {senha.observacoes && (
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">{senha.observacoes}</p>
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
