import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ContextForm } from "@/components/Propostas/ContextForm";
import { useGenerateProposta, useCreateProposta } from "@/hooks/usePropostas";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NovaProposta() {
  const navigate = useNavigate();
  const generateProposta = useGenerateProposta();
  const createProposta = useCreateProposta();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = async (data: {
    contexto: string;
    clienteNome: string;
    segmento: string;
    servicosIds: string[];
  }) => {
    setIsGenerating(true);
    try {
      const result = await generateProposta.mutateAsync(data);
      
      if (result && result.titulo && result.slides) {
        const novaProposta = await createProposta.mutateAsync({
          titulo: result.titulo,
          contexto: data.contexto,
          slides_json: result.slides,
          status: 'rascunho',
        });

        if (novaProposta) {
          navigate(`/proposta/${novaProposta.id}/editar`);
        }
      }
    } catch (error) {
      console.error('Error generating proposta:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/criador-propostas')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nova Proposta</h1>
          <p className="text-muted-foreground mt-1">
            Forneça o contexto para gerar uma proposta personalizada
          </p>
        </div>
      </div>

      <ContextForm onSubmit={handleSubmit} isGenerating={isGenerating} />
    </div>
  );
}