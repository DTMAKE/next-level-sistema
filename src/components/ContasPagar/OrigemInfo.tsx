import { ShoppingCart, Building2 } from "lucide-react";
import { useVendaById } from "@/hooks/useVendaById";
import { useContratoById } from "@/hooks/useContratoById";

interface OrigemInfoProps {
  tipo: 'venda' | 'contrato';
  vendaId?: string;
  contratoId?: string;
}

export function OrigemInfo({ tipo, vendaId, contratoId }: OrigemInfoProps) {
  const { data: venda } = useVendaById(vendaId || null);
  const { data: contrato } = useContratoById(contratoId || null);

  if (tipo === 'venda' && venda) {
    return (
      <div className="flex items-center gap-2">
        <ShoppingCart className="h-4 w-4 text-green-600" />
        <span className="text-green-600 font-medium">
          {venda.numero_venda || `VENDA-${vendaId?.slice(0, 8)}`}
        </span>
      </div>
    );
  }

  if (tipo === 'contrato' && contrato) {
    return (
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-blue-600" />
        <span className="text-blue-600 font-medium">
          {contrato.numero_contrato || `CONTRATO-${contratoId?.slice(0, 8)}`}
        </span>
      </div>
    );
  }

  // Fallback para casos onde não conseguiu carregar os dados
  return (
    <div className="flex items-center gap-2">
      {tipo === 'venda' ? (
        <>
          <ShoppingCart className="h-4 w-4 text-green-600" />
          <span className="text-green-600 font-medium">
            VENDA-{vendaId?.slice(0, 8)}
          </span>
        </>
      ) : (
        <>
          <Building2 className="h-4 w-4 text-blue-600" />
          <span className="text-blue-600 font-medium">
            CONTRATO-{contratoId?.slice(0, 8)}
          </span>
        </>
      )}
    </div>
  );
}