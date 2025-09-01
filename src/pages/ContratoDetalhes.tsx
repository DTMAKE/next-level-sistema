import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, FileText, Calendar, DollarSign, User, Download, ExternalLink } from "lucide-react";
import { useContrato } from "@/hooks/useContratos";

export default function ContratoDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: contrato, isLoading, error } = useContrato(id!);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'suspenso': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'cancelado': return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'finalizado': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ativo': return 'Ativo';
      case 'suspenso': return 'Suspenso';
      case 'cancelado': return 'Cancelado';
      case 'finalizado': return 'Finalizado';
      default: return status;
    }
  };

  const handleDownloadPDF = () => {
    if (contrato?.pdf_url) {
      window.open(contrato.pdf_url, '_blank');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-elegant">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/contratos")}
              className="hover:shadow-premium transition-shadow"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
          <Card>
            <CardContent className="p-6">
              <p className="text-destructive">Erro ao carregar contrato: {error.message}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-elegant">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/contratos")}
              className="hover:shadow-premium transition-shadow"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
          <Card className="shadow-premium border-0 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!contrato) {
    return (
      <div className="min-h-screen bg-gradient-elegant">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/contratos")}
              className="hover:shadow-premium transition-shadow"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Contrato não encontrado.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-elegant">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/contratos")}
            className="hover:shadow-premium transition-shadow"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Contract Details */}
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="shadow-premium border-0 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-accent" />
                    <CardTitle className="text-2xl">{contrato.numero_contrato || `Contrato #${contrato.id.slice(-8)}`}</CardTitle>
                    <Badge className={getStatusColor(contrato.status)}>
                      {getStatusLabel(contrato.status)}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">
                    Criado em {new Date(contrato.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                
                {contrato.pdf_url && (
                  <Button 
                    onClick={handleDownloadPDF}
                    className="gradient-premium border-0 text-background"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Client Information */}
              <Card className="p-4">
                <CardTitle className="text-lg mb-4 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações do Cliente
                </CardTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nome</label>
                    <p className="text-lg">{contrato.cliente?.nome || 'Cliente não encontrado'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-lg">{contrato.cliente?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                    <p className="text-lg">{contrato.cliente?.telefone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">CNPJ</label>
                    <p className="text-lg">{contrato.cliente?.cnpj || 'N/A'}</p>
                  </div>
                </div>
                {contrato.cliente?.endereco && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-muted-foreground">Endereço</label>
                    <p className="text-lg">{contrato.cliente.endereco}</p>
                  </div>
                )}
              </Card>

              {/* Contract Information */}
              <Card className="p-4">
                <CardTitle className="text-lg mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Detalhes do Contrato
                </CardTitle>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Data de Início</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4" />
                      <p className="text-lg">{new Date(contrato.data_inicio).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  {contrato.data_fim && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Data de Fim</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4" />
                        <p className="text-lg">{new Date(contrato.data_fim).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Valor Total</label>
                    <div className="flex items-center gap-2 mt-1">
                      <DollarSign className="h-4 w-4" />
                      <p className="text-lg font-semibold">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(contrato.valor)}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Services */}
              {contrato.servicos && contrato.servicos.length > 0 && (
                <Card className="p-4">
                  <CardTitle className="text-lg mb-4">Serviços Inclusos</CardTitle>
                  <div className="space-y-3">
                    {contrato.servicos.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{item.servico?.nome || 'Serviço'}</p>
                          <p className="text-sm text-muted-foreground">
                            Quantidade: {item.quantidade} • Valor unitário: {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(item.valor_unitario)}
                          </p>
                        </div>
                        <p className="font-semibold">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(item.valor_total)}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* PDF Document */}
              {contrato.pdf_url && (
                <Card className="p-4">
                  <CardTitle className="text-lg mb-4">Documento do Contrato</CardTitle>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button 
                      onClick={handleDownloadPDF}
                      className="gradient-premium border-0 text-background"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                    <Button 
                      onClick={() => window.open(contrato.pdf_url, '_blank')}
                      variant="outline"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Abrir em Nova Aba
                    </Button>
                  </div>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}