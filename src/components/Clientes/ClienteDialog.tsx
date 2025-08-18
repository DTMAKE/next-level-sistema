import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateCliente, useUpdateCliente, type Cliente } from "@/hooks/useClientes";

interface ClienteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente?: Cliente;
}

export function ClienteDialog({ open, onOpenChange, cliente }: ClienteDialogProps) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [cnpj, setCnpj] = useState("");

  const createCliente = useCreateCliente();
  const updateCliente = useUpdateCliente();

  const isEditing = !!cliente;
  const isLoading = createCliente.isPending || updateCliente.isPending;

  useEffect(() => {
    if (cliente) {
      setNome(cliente.nome);
      setEmail(cliente.email);
      setTelefone(cliente.telefone || "");
      setEndereco(cliente.endereco || "");
      setCnpj(cliente.cnpj || "");
    } else {
      setNome("");
      setEmail("");
      setTelefone("");
      setEndereco("");
      setCnpj("");
    }
  }, [cliente, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome.trim() || !email.trim()) return;

    try {
      if (isEditing) {
        await updateCliente.mutateAsync({
          id: cliente.id,
          nome: nome.trim(),
          email: email.trim(),
          telefone: telefone.trim() || undefined,
          endereco: endereco.trim() || undefined,
          cnpj: cnpj.trim() || undefined,
        });
      } else {
        await createCliente.mutateAsync({
          nome: nome.trim(),
          email: email.trim(),
          telefone: telefone.trim() || undefined,
          endereco: endereco.trim() || undefined,
          cnpj: cnpj.trim() || undefined,
        });
      }
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the hooks
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[95vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-lg sm:text-xl">
            {isEditing ? "Editar Cliente" : "Novo Cliente"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <Label htmlFor="nome" className="text-sm font-medium">Nome da Empresa *</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Digite o nome da empresa"
              className="h-10 sm:h-11"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite o email"
              className="h-10 sm:h-11"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefone" className="text-sm font-medium">Telefone</Label>
              <Input
                id="telefone"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="h-10 sm:h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj" className="text-sm font-medium">CNPJ</Label>
              <Input
                id="cnpj"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                placeholder="00.000.000/0000-00"
                className="h-10 sm:h-11"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="endereco" className="text-sm font-medium">Endereço</Label>
            <Input
              id="endereco"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Digite o endereço completo"
              className="h-10 sm:h-11"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !nome.trim() || !email.trim()}
              className="gradient-premium border-0 text-background w-full sm:w-auto order-1 sm:order-2"
            >
              {isLoading ? "Salvando..." : isEditing ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}