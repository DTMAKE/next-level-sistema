import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2, FileDown } from "lucide-react";
import { Proposta } from "@/hooks/usePropostas";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PropostaCardProps {
  proposta: Proposta;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onExport: () => void;
}

export function PropostaCard({ proposta, onView, onEdit, onDelete, onExport }: PropostaCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold line-clamp-2">
            {proposta.titulo}
          </CardTitle>
          <Badge variant={proposta.status === 'finalizada' ? 'default' : 'secondary'}>
            {proposta.status === 'finalizada' ? 'Finalizada' : 'Rascunho'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3">
          {proposta.contexto}
        </p>
        <div className="mt-4 text-xs text-muted-foreground">
          <p>Criada em {format(new Date(proposta.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
          <p>{proposta.slides_json?.length || 0} slides</p>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onView} className="flex-1">
          <Eye className="h-4 w-4 mr-1" />
          Ver
        </Button>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onExport}>
          <FileDown className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}