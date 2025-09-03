import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, UserCheck, X } from "lucide-react";
import { useVendedores } from "@/hooks/useVendedores";
import { useAuth } from "@/contexts/AuthContext";

interface VendedorSelectorProps {
  vendedorId: string;
  onVendedorChange: (vendedorId: string) => void;
  required?: boolean;
}

export function VendedorSelector({ vendedorId, onVendedorChange, required = false }: VendedorSelectorProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();

  // Determine if current user is a seller (only sees themselves) or admin (sees all)
  const isVendedor = user?.role === 'vendedor';
  const { data: vendedores = [], isLoading } = useVendedores({ 
    currentUserOnly: isVendedor 
  });

  // Auto-select the current user if they are a seller
  useEffect(() => {
    if (isVendedor && vendedores.length > 0 && !vendedorId) {
      const currentUserVendedor = vendedores.find(v => v.user_id === user?.id);
      if (currentUserVendedor) {
        onVendedorChange(currentUserVendedor.user_id);
      }
    }
  }, [isVendedor, vendedores, vendedorId, onVendedorChange, user?.id]);

  // Filtrar vendedores baseado no termo de busca
  const vendedoresFiltrados = vendedores.filter(vendedor =>
    vendedor.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const vendedorSelecionado = vendedores.find(vendedor => vendedor.user_id === vendedorId);

  const selecionarVendedor = (vendedor: any) => {
    onVendedorChange(vendedor.user_id);
    setDialogOpen(false);
  };

  const limparSelecao = () => {
    onVendedorChange("");
  };

  // If user is a seller, show a simplified view (no selection needed)
  if (isVendedor) {
    return (
      <div className="space-y-2">
        <Label className="text-base font-medium">
          Vendedor Responsável {required && "*"}
        </Label>
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{vendedorSelecionado?.name || "Carregando..."}</span>
              <Badge variant="secondary" className="text-xs ml-auto">
                Auto-selecionado
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin view - full selection interface
  return (
    <div className="space-y-2">
      <Label className="text-base font-medium">
        Vendedor Responsável {required && "*"}
      </Label>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full h-12 text-base justify-start text-left hover:shadow-elegant transition-shadow"
          >
            <UserCheck className="mr-2 h-4 w-4" />
            {vendedorSelecionado ? vendedorSelecionado.name : "Selecionar Vendedor..."}
          </Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Selecionar Vendedor
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 flex-1 min-h-0">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando vendedores...
                </div>
              ) : vendedoresFiltrados.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "Nenhum vendedor encontrado." : "Nenhum vendedor cadastrado."}
                </div>
              ) : (
                vendedoresFiltrados.map((vendedor) => (
                  <Card key={vendedor.id} className="cursor-pointer hover:shadow-elegant transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-base">{vendedor.name}</h3>
                            {vendedorId === vendedor.user_id && (
                              <Badge variant="default" className="text-xs">Selecionado</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {vendedor.role}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={vendedorId === vendedor.user_id ? "default" : "outline"}
                          onClick={() => selecionarVendedor(vendedor)}
                          className="ml-4"
                        >
                          {vendedorId === vendedor.user_id ? "Selecionado" : "Selecionar"}
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
    </div>
  );
}