import { Badge } from "@/components/ui/badge";
import { Repeat } from "lucide-react";

interface ContratoRecorrenteBadgeProps {
  tipoContrato: 'unico' | 'recorrente';
  valor?: number;
}

export function ContratoRecorrenteBadge({ tipoContrato, valor }: ContratoRecorrenteBadgeProps) {
  if (tipoContrato === 'unico') {
    return null;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Badge variant="secondary" className="flex items-center gap-1 text-xs">
      <Repeat className="h-3 w-3" />
      Recorrente {valor && `(${formatCurrency(valor)}/mês)`}
    </Badge>
  );
}