import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateSenha, useUpdateSenha, Senha } from "@/hooks/useSenhas";
import { useAuth } from "@/contexts/AuthContext";

interface SenhaDialogProps {
  children?: React.ReactNode;
  senha?: Senha;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SenhaDialog({ children, senha, open: controlledOpen, onOpenChange: controlledOnOpenChange }: SenhaDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;
  const { user } = useAuth();
  const createSenha = useCreateSenha();
  const updateSenha = useUpdateSenha();

  const [titulo, setTitulo] = useState("");
  const [usuario, setUsuario] = useState("");
  const [senhaValue, setSenhaValue] = useState("");
  const [observacoes, setObservacoes] = useState("");

  // Update form when senha prop changes or dialog opens
  useEffect(() => {
    if (open) {
      if (senha) {
        setTitulo(senha.titulo);
        setUsuario(senha.usuario || "");
        setSenhaValue(senha.senha);
        setObservacoes(senha.observacoes || "");
      } else {
        setTitulo("");
        setUsuario("");
        setSenhaValue("");
        setObservacoes("");
      }
    }
  }, [senha, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const senhaData = {
      user_id: user.id,
      titulo,
      usuario: usuario || null,
      senha: senhaValue,
      url: null,
      observacoes: observacoes || null,
    };

    if (senha) {
      await updateSenha.mutateAsync({ id: senha.id, ...senhaData });
    } else {
      await createSenha.mutateAsync(senhaData);
    }

    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setTitulo("");
    setUsuario("");
    setSenhaValue("");
    setObservacoes("");
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) resetForm();
    }}>
      {children && (
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{senha ? "Editar Senha" : "Nova Senha"}</DialogTitle>
            <DialogDescription>
              {senha ? "Edite as informações da senha" : "Adicione uma nova senha ao cofre"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Email Corporativo, AWS, etc."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="usuario">Usuário/Email</Label>
              <Input
                id="usuario"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="usuario@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha">Senha *</Label>
              <Input
                id="senha"
                type="password"
                value={senhaValue}
                onChange={(e) => setSenhaValue(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Notas adicionais..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {senha ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
