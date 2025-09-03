import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, DollarSign, Calendar, Building2, FileText, Edit, Trash2, CreditCard, Hash, Phone, Mail, MapPin, Package, User } from "lucide-react";
import { useVenda } from "@/hooks/useVendas";
import { useProfiles } from "@/hooks/useProfiles";
import { VendaDialog } from "@/components/Vendas/VendaDialog";
import { DeleteVendaDialog } from "@/components/Vendas/DeleteVendaDialog";
import { QuickStatusChanger } from "@/components/Vendas/QuickStatusChanger";
import { formatDateToBrazilian } from "@/utils/dateUtils";
import { useState, useMemo } from "react";

const getStatusColor = (status: string) => {
  return "bg-black text-white";
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "fechada":
      return "Fechada";
    case "negociacao":
      return "Negociação";
    case "proposta":
      return "Proposta";
    case "perdida":
      return "Perdida";
    default:
      return status;
  }
};

export default function VendaDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: venda, isLoading, error } = useVenda(id!);
  
  // Buscar dados do vendedor se existe vendedor_id
  const vendedorIds = useMemo(() => {
    return venda?.vendedor_id ? [venda.vendedor_id] : [];
  }, [venda?.vendedor_id]);
  
  const { data: profiles } = useProfiles(vendedorIds);
  const vendedor = profiles?.[0];

  const handleEditVenda = () => {
    setDialogOpen(true);
  };

  const handleDeleteVenda = () => {
    setDeleteDialogOpen(true);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-elegant">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-8">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/vendas")}
              className="hover:shadow-premium transition-shadow h-9 w-9 sm:h-10 sm:w-10"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
          <Card>
            <CardContent className="p-3 sm:p-6">
              <p className="text-destructive text-sm sm:text-base">Erro ao carregar venda: {error.message}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-elegant">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-8">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/vendas")}
              className="hover:shadow-premium transition-shadow h-9 w-9 sm:h-10 sm:w-10"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-premium border-0 bg-card/50 backdrop-blur-sm">
              <CardHeader className="p-3 sm:p-6">
                <Skeleton className="h-6 sm:h-8 w-48 sm:w-64" />
                <Skeleton className="h-3 sm:h-4 w-32 sm:w-48" />
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
                  <Skeleton className="h-16 sm:h-24" />
                  <Skeleton className="h-16 sm:h-24" />
                  <Skeleton className="h-16 sm:h-24" />
                  <Skeleton className="h-16 sm:h-24" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!venda) {
    return (
      <div className="min-h-screen bg-gradient-elegant">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-8">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/vendas")}
              className="hover:shadow-premium transition-shadow h-9 w-9 sm:h-10 sm:w-10"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
          <Card>
            <CardContent className="p-3 sm:p-6">
              <p className="text-muted-foreground text-sm sm:text-base">Venda não encontrada.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-elegant">
      <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* Header */}
        <div className="space-y-3 sm:space-y-6 mb-5 sm:mb-10">
          {/* Back button and title */}
          <div className="flex items-center gap-3 sm:gap-5">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/vendas")}
              className="hover:shadow-premium transition-shadow shrink-0 h-9 w-9 sm:h-10 sm:w-10"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <div className="p-1.5 sm:p-3 rounded-lg bg-primary/10 shrink-0">
                <DollarSign className="h-4 w-4 sm:h-7 sm:w-7 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold truncate">
                  Venda - {venda.cliente?.nome}
                </h1>
                <p className="text-sm sm:text-lg text-muted-foreground mt-0.5 sm:mt-1">Detalhes da venda</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-row gap-2 sm:gap-4 sm:justify-end">
            <Button 
              variant="outline"
              onClick={handleEditVenda}
              className="hover:shadow-premium transition-shadow flex-1 sm:w-auto h-9 sm:h-10 text-sm"
            >
              <Edit className="h-4 w-4 mr-1.5 sm:mr-2" />
              Editar
            </Button>
            <Button 
              variant="outline"
              onClick={handleDeleteVenda}
              className="hover:shadow-premium transition-shadow text-destructive hover:text-destructive flex-1 sm:w-auto h-9 sm:h-10 text-sm"
            >
              <Trash2 className="h-4 w-4 mr-1.5 sm:mr-2" />
              Excluir
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-8">
            {/* Informações da Venda */}
            <Card className="shadow-premium border-0 bg-card/50 backdrop-blur-sm">
              <CardHeader className="p-3 sm:p-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-6">
                  <CardTitle className="text-lg sm:text-2xl">Informações da Venda</CardTitle>
                  <div className="w-full sm:w-auto">
                    <QuickStatusChanger venda={venda} />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-3 sm:p-8 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                  {/* Valor Total */}
                  <div className="space-y-2 sm:space-y-4">
                    <div className="flex items-center gap-2 sm:gap-3 text-muted-foreground">
                      <DollarSign className="h-4 w-4 sm:h-6 sm:w-6" />
                      <span className="font-medium text-sm sm:text-base">Valor Total</span>
                    </div>
                    <p className="text-xl sm:text-3xl font-bold text-accent pl-6 sm:pl-9">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(venda.valor)}
                    </p>
                  </div>

                  {/* Data da Venda */}
                  <div className="space-y-2 sm:space-y-4">
                    <div className="flex items-center gap-2 sm:gap-3 text-muted-foreground">
                      <Calendar className="h-4 w-4 sm:h-6 sm:w-6" />
                      <span className="font-medium text-sm sm:text-base">Data da Venda</span>
                    </div>
                    <p className="text-base sm:text-xl pl-6 sm:pl-9">
                      {formatDateToBrazilian(venda.data_venda)}
                    </p>
                  </div>

                  {/* Forma de Pagamento */}
                  {venda.forma_pagamento && (
                    <div className="space-y-2 sm:space-y-4">
                      <div className="flex items-center gap-2 sm:gap-3 text-muted-foreground">
                        <CreditCard className="h-4 w-4 sm:h-6 sm:w-6" />
                        <span className="font-medium text-sm sm:text-base">Forma de Pagamento</span>
                      </div>
                      <p className="text-base sm:text-xl pl-6 sm:pl-9 capitalize">
                        {venda.forma_pagamento.replace('_', ' ')}
                      </p>
                    </div>
                  )}

                  {/* Parcelas */}
                  {venda.parcelas && venda.parcelas > 1 && (
                    <div className="space-y-2 sm:space-y-4">
                      <div className="flex items-center gap-2 sm:gap-3 text-muted-foreground">
                        <Hash className="h-4 w-4 sm:h-6 sm:w-6" />
                        <span className="font-medium text-sm sm:text-base">Parcelas</span>
                      </div>
                      <p className="text-base sm:text-xl pl-6 sm:pl-9">{venda.parcelas}x</p>
                    </div>
                  )}
                </div>

                {/* Descrição */}
                {venda.descricao && (
                  <div className="space-y-2 sm:space-y-4 mt-4 sm:mt-8">
                    <div className="flex items-center gap-2 sm:gap-3 text-muted-foreground">
                      <FileText className="h-4 w-4 sm:h-6 sm:w-6" />
                      <span className="font-medium text-sm sm:text-base">Descrição</span>
                    </div>
                    <p className="text-sm sm:text-base pl-6 sm:pl-9 bg-muted/50 p-3 sm:p-5 rounded-lg">{venda.descricao}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Serviços */}
            {venda.venda_servicos && venda.venda_servicos.length > 0 && (
              <Card className="shadow-premium border-0 bg-card/50 backdrop-blur-sm">
                <CardHeader className="p-3 sm:p-8">
                  <CardTitle className="text-lg sm:text-2xl flex items-center gap-2 sm:gap-3">
                    <Package className="h-4 w-4 sm:h-6 sm:w-6" />
                    Serviços
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-8 pt-0">
                  <div className="space-y-3 sm:space-y-6">
                    {venda.venda_servicos.map((item) => (
                      <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6 p-3 sm:p-6 bg-muted/30 rounded-lg">
                        <div className="space-y-1 sm:space-y-2 flex-1 min-w-0">
                          <h4 className="font-medium text-sm sm:text-lg truncate">{item.servico.nome}</h4>
                          {item.servico.descricao && (
                            <p className="text-xs sm:text-base text-muted-foreground line-clamp-2">{item.servico.descricao}</p>
                          )}
                          <div className="flex flex-col xs:flex-row gap-1 xs:gap-6 text-xs sm:text-base text-muted-foreground">
                            <span>Qtd: {item.quantidade}</span>
                            <span>Valor unit: {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(item.valor_unitario)}</span>
                          </div>
                        </div>
                        <div className="text-left sm:text-right shrink-0">
                          <p className="text-base sm:text-xl font-semibold text-accent">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(item.valor_total)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-3 sm:space-y-8">
            {/* Vendedor */}
            {vendedor && (
              <Card className="shadow-premium border-0 bg-card/50 backdrop-blur-sm">
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="text-lg sm:text-2xl flex items-center gap-2 sm:gap-3">
                    <User className="h-4 w-4 sm:h-6 sm:w-6" />
                    Vendedor Responsável
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0 space-y-3 sm:space-y-5">
                  <div>
                    <h3 className="font-semibold text-base sm:text-xl break-words">{vendedor.name}</h3>
                    <p className="text-sm text-muted-foreground capitalize">{vendedor.role}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cliente */}
            <Card className="shadow-premium border-0 bg-card/50 backdrop-blur-sm">
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="text-lg sm:text-2xl flex items-center gap-2 sm:gap-3">
                  <Building2 className="h-4 w-4 sm:h-6 sm:w-6" />
                  Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0 space-y-3 sm:space-y-5">
                <div>
                  <h3 className="font-semibold text-base sm:text-xl break-words">{venda.cliente?.nome}</h3>
                </div>
                
                {venda.cliente?.email && (
                  <div className="flex items-center gap-2 sm:gap-3 text-muted-foreground">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-sm sm:text-base truncate">{venda.cliente.email}</span>
                  </div>
                )}
                
                {venda.cliente?.telefone && (
                  <div className="flex items-center gap-2 sm:gap-3 text-muted-foreground">
                    <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-sm sm:text-base">{venda.cliente.telefone}</span>
                  </div>
                )}
                
                {venda.cliente?.endereco && (
                  <div className="flex items-start gap-2 sm:gap-3 text-muted-foreground">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 sm:mt-1" />
                    <span className="text-sm sm:text-base">{venda.cliente.endereco}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Informações de Auditoria */}
            <Card className="shadow-premium border-0 bg-card/50 backdrop-blur-sm">
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="text-base sm:text-xl">Auditoria</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0 space-y-3 sm:space-y-5 text-xs sm:text-base text-muted-foreground">
                <div>
                  <span className="font-medium">Criado em:</span>
                  <br />
                  <span className="mt-1 block">
                    {new Date(venda.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Atualizado em:</span>
                  <br />
                  <span className="mt-1 block">
                    {new Date(venda.updated_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <VendaDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          venda={venda}
        />

        <DeleteVendaDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          venda={venda}
        />
      </div>
    </div>
  );
}