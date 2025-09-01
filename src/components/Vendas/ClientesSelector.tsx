import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, User, Phone, Mail, Building, X, Plus } from "lucide-react";
import { useClientes } from "@/hooks/useClientes";
import { ClienteDialog } from "@/components/Clientes/ClienteDialog";

interface Cliente {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  cnpj?: string;
}

interface ClientesSelectorProps {
  clienteId: string;
  onClienteChange: (clienteId: string) => void;
}

export function ClientesSelector({ clienteId, onClienteChange }: ClientesSelectorProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clienteDialogOpen, setClienteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: clientesResponse, isLoading } = useClientes(searchTerm);
  const clientes = clientesResponse?.data || [];

  const clienteSelecionado = clientes.find(cliente => cliente.id === clienteId);

  const selecionarCliente = (cliente: Cliente) => {
    onClienteChange(cliente.id);
    setDialogOpen(false);
  };

  const limparSelecao = () => {
    onClienteChange("");
  };

  const handleNovoClienteCriado = () => {
    setClienteDialogOpen(false);
    // A query será invalidada automaticamente pelo hook de criação
  };

  return (
    <div className="space-y-3">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full h-12 text-base justify-start text-left hover:shadow-elegant transition-shadow"
          >
            <User className="mr-2 h-4 w-4" />
            {clienteSelecionado ? clienteSelecionado.nome : "Selecionar Cliente..."}
          </Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Selecionar Cliente
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 flex-1 min-h-0">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por nome, email ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>
              <Button
                variant="outline"
                size="default"
                onClick={() => setClienteDialogOpen(true)}
                className="h-10 px-3 whitespace-nowrap"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Cliente
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando clientes...
                </div>
              ) : clientes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado."}
                </div>
              ) : (
                clientes.map((cliente) => (
                  <Card key={cliente.id} className="cursor-pointer hover:shadow-elegant transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-base">{cliente.nome}</h3>
                            {clienteId === cliente.id && (
                              <Badge variant="default" className="text-xs">Selecionado</Badge>
                            )}
                          </div>
                          <div className="space-y-1">
                            {cliente.email && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                <span>{cliente.email}</span>
                              </div>
                            )}
                            {cliente.telefone && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                <span>{cliente.telefone}</span>
                              </div>
                            )}
                            {cliente.cnpj && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Building className="h-3 w-3" />
                                <span>CNPJ: {cliente.cnpj}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={clienteId === cliente.id ? "default" : "outline"}
                          onClick={() => selecionarCliente(cliente)}
                          className="ml-4"
                        >
                          {clienteId === cliente.id ? "Selecionado" : "Selecionar"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ClienteDialog
        open={clienteDialogOpen}
        onOpenChange={(open) => {
          setClienteDialogOpen(open);
          if (!open) {
            handleNovoClienteCriado();
          }
        }}
      />
    </div>
  );
}