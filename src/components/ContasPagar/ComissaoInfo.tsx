import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Building2, ShoppingCart, User, Calendar, DollarSign } from "lucide-react";
import { ContaPagar } from "@/hooks/useContasPagar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ComissaoInfoProps {
  conta: ContaPagar;
  size?: "sm" | "md" | "lg";
}

interface ComissaoData {
  vendedor: string;
  cliente: string;
  tipo: 'contrato' | 'venda';
  numeroContrato?: string;
  valorVenda?: number;
  dataVenda?: string;
}

export function ComissaoInfo({
  conta,
  size = "md"
}: ComissaoInfoProps) {
  const getComissaoInfo = (): ComissaoData | null => {
    if (conta.comissoes) {
      const vendedorNome = conta.comissoes.vendedor_profile?.name || 'Vendedor';
      let clienteNome = 'Cliente';
      
      // Buscar nome do cliente da venda ou do contrato
      if (conta.comissoes.vendas?.clientes?.nome) {
        clienteNome = conta.comissoes.vendas.clientes.nome;
      } else if (conta.comissoes.contrato?.clientes?.nome) {
        clienteNome = conta.comissoes.contrato.clientes.nome;
      }
      
      if (conta.comissoes.contrato_id) {
        return {
          vendedor: vendedorNome,
          cliente: clienteNome,
          tipo: 'contrato',
          numeroContrato: conta.comissoes.contrato?.numero_contrato || `Contrato ${conta.comissoes.contrato_id.slice(0, 8)}`
        };
      } else if (conta.comissoes.venda_id) {
        return {
          vendedor: vendedorNome,
          cliente: clienteNome,
          tipo: 'venda',
          valorVenda: conta.comissoes.vendas?.valor || 0,
          dataVenda: conta.comissoes.vendas?.data_venda
        };
      }
    }
    return null;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const comissaoInfo = getComissaoInfo();
  
  if (!comissaoInfo) {
    return null;
  }

  const isSmall = size === "sm";
  const iconSize = isSmall ? "h-3 w-3" : "h-4 w-4";
  const textSize = isSmall ? "text-xs" : "text-sm";

  return (
    <div className={`space-y-2 ${isSmall ? 'space-y-1' : ''}`}>
      {/* Vendedor */}
      <div className="flex items-center gap-2">
        <User className={`${iconSize} text-purple-600`} />
        <span className={`${textSize} text-muted-foreground`}>
          Vendedor: <span className="text-purple-600 font-medium">{comissaoInfo.vendedor}</span>
        </span>
      </div>

      {/* Cliente */}
      <div className="flex items-center gap-2">
        <Building2 className={`${iconSize} text-blue-600`} />
        <span className={`${textSize} text-muted-foreground`}>
          Cliente: <span className="text-blue-600 font-medium">{comissaoInfo.cliente}</span>
        </span>
      </div>

      {/* Informações específicas por tipo */}
      {comissaoInfo.tipo === 'venda' && comissaoInfo.valorVenda && (
        <div className="flex items-center gap-2">
          <DollarSign className={`${iconSize} text-green-600`} />
          <span className={`${textSize} text-muted-foreground`}>
            Valor da Venda: <span className="text-green-600 font-medium">{formatCurrency(comissaoInfo.valorVenda)}</span>
          </span>
        </div>
      )}

      {comissaoInfo.tipo === 'venda' && comissaoInfo.dataVenda && (
        <div className="flex items-center gap-2">
          <Calendar className={`${iconSize} text-orange-600`} />
          <span className={`${textSize} text-muted-foreground`}>
            Data da Venda: <span className="text-orange-600 font-medium">
              {format(new Date(comissaoInfo.dataVenda), "dd/MM/yyyy", { locale: ptBR })}
            </span>
          </span>
        </div>
      )}

      {comissaoInfo.numeroContrato && (
        <div className="flex items-center gap-2">
          <ShoppingCart className={`${iconSize} text-orange-600`} />
          <span className={`${textSize} text-muted-foreground`}>
            Contrato: <span className="text-orange-600 font-medium">{comissaoInfo.numeroContrato}</span>
          </span>
        </div>
      )}

      {/* Badge do tipo */}
      <div className="flex items-start pt-1">
        <Badge 
          variant="outline" 
          className={`${isSmall ? 'text-xs px-2 py-0.5' : 'text-sm'} bg-purple-50 text-purple-700 border-purple-200`}
        >
          <UserCheck className={`${iconSize} mr-1`} />
          Comissão de {comissaoInfo.tipo === 'contrato' ? 'Contrato' : 'Venda'}
        </Badge>
      </div>
    </div>
  );
}