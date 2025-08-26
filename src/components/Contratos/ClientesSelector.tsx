import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Mail, Phone, Building, X } from "lucide-react";
import { useClientes, type Cliente } from "@/hooks/useClientes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ClientesSelectorProps {
  clienteId: string;
  onClienteChange: (clienteId: string) => void;
}

export function ClientesSelector({ clienteId, onClienteChange }: ClientesSelectorProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { data: clientesResponse, isLoading } = useClientes(searchTerm);
  const clientes = clientesResponse?.data || [];

  const clienteSelecionado = clientes.find(c => c.id === clienteId);

  const selecionarCliente = (cliente: Cliente) => {
    onClienteChange(cliente.id);
    setDialogOpen(false);
  };

  const limparSelecao = () => {
    onClienteChange("");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-base font-medium">Cliente *</Label>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <UserPlus className="mr-2 h-4 w-4" />
              Selecionar Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[80vh] overflow-y-auto px-4 sm:px-6">
            <DialogHeader>
              <DialogTitle>Selecionar Cliente</DialogTitle>
              <DialogDescription>
                Escolha o cliente para o contrato
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <Input
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              {isLoading ? (
                <div className="text-center py-4">Carregando clientes...</div>
              ) : clientes.length > 0 ? (
                <div className="grid gap-3 max-h-96 overflow-y-auto">
                  {clientes.map((cliente) => (
                    <Card 
                      key={cliente.id} 
                      className={`cursor-pointer hover:shadow-md transition-shadow ${
                        clienteId === cliente.id ? 'ring-2 ring-primary' : ''
                      }`}
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                          <div className="flex-1 space-y-2">
                            <h4 className="font-medium text-sm sm:text-base">{cliente.nome}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{cliente.email}</span>
                            </div>
                            {cliente.telefone && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {cliente.telefone}
                              </div>
                            )}
                            {cliente.cnpj && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Building className="h-3 w-3" />
                                <span className="truncate">CNPJ: {cliente.cnpj}</span>
                              </div>
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => selecionarCliente(cliente)}
                            variant={clienteId === cliente.id ? "default" : "outline"}
                            className="h-9 self-start sm:self-auto"
                          >
                            {clienteId === cliente.id ? "Selecionado" : "Selecionar"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum cliente encontrado
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {clienteSelecionado ? (
        <Card className="bg-primary/5">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1 space-y-2">
                <h4 className="font-medium">{clienteSelecionado.nome}</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  {clienteSelecionado.email}
                </div>
                {clienteSelecionado.telefone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {clienteSelecionado.telefone}
                  </div>
                )}
                {clienteSelecionado.cnpj && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building className="h-3 w-3" />
                    CNPJ: {clienteSelecionado.cnpj}
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={limparSelecao}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              Nenhum cliente selecionado
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Clique em "Selecionar Cliente" para começar
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}