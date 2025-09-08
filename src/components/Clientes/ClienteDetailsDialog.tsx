import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Mail, 
  Phone, 
  Building2, 
  MapPin, 
  FileText, 
  Globe, 
  Calendar,
  UserCheck
} from "lucide-react";
import { type Cliente } from "@/hooks/useClientes";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClienteDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente?: Cliente;
}

export function ClienteDetailsDialog({ open, onOpenChange, cliente }: ClienteDetailsDialogProps) {
  if (!cliente) return null;

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "cliente":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            <div className="w-2 h-2 rounded-full bg-green-600 mr-2" />
            Cliente
          </Badge>
        );
      case "lead":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
            <div className="w-2 h-2 rounded-full bg-blue-600 mr-2" />
            Potencial Cliente
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <div className="w-2 h-2 rounded-full bg-gray-600 mr-2" />
            {status || "Cliente"}
          </Badge>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[95vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg sm:text-xl flex items-center gap-3">
              <Building2 className="h-6 w-6 text-primary" />
              {cliente.nome}
            </DialogTitle>
            {getStatusBadge(cliente.status)}
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Informações básicas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-sm break-all">{cliente.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {cliente.telefone && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                      <p className="text-sm">{cliente.telefone}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Segunda linha de informações */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cliente.cnpj && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">CNPJ</p>
                      <p className="text-sm">{cliente.cnpj}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {cliente.nacionalidade && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Nacionalidade</p>
                      <p className="text-sm">{cliente.nacionalidade}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Endereço */}
          {cliente.endereco && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Endereço</p>
                    <p className="text-sm">{cliente.endereco}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Datas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Criado em</p>
                    <p className="text-sm">
                      {format(new Date(cliente.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Última atualização</p>
                    <p className="text-sm">
                      {format(new Date(cliente.updated_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="flex justify-end pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}