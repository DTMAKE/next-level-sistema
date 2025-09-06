import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, UserCheck, X, Mail, Phone, Building } from "lucide-react";
import { useClientes, type Cliente } from "@/hooks/useClientes";

interface ClientesSelectorVendaProps {
  clienteId: string;
  onClienteChange: (clienteId: string) => void;
  required?: boolean;
}

export function ClientesSelectorVenda({ clienteId, onClienteChange, required = false }: ClientesSelectorVendaProps) {
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
    <div className="space-y-2">
      <Label className="text-base font-medium">
        Cliente {required && "*"}
      </Label>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full h-12 text-base justify-start text-left hover:shadow-elegant transition-shadow"
          >
            <UserCheck className="mr-2 h-4 w-4" />
            {clienteSelecionado ? clienteSelecionado.nome : "Selecionar Cliente..."}
          </Button>
        </DialogTrigger>
        
        <DialogContent className="w-[95vw] max-w-2xl max-h-[80vh] flex flex-col px-4 sm:px-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Selecionar Cliente
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 flex-1 min-h-0">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10"
              />
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
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-sm sm:text-base">{cliente.nome}</h3>
                            {clienteId === cliente.id && (
                              <Badge variant="default" className="text-xs">Selecionado</Badge>
                            )}
                          </div>
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
                          variant={clienteId === cliente.id ? "default" : "outline"}
                          onClick={() => selecionarCliente(cliente)}
                          className="ml-4 h-9 self-start sm:self-auto"
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

      {clienteSelecionado && (
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
      )}
    </div>
  );
}