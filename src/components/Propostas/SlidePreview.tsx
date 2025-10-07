import { Card } from "@/components/ui/card";
import { Slide } from "@/hooks/usePropostas";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";

interface SlidePreviewProps {
  slide: Slide;
  index: number;
  totalSlides: number;
  onEdit: () => void;
  onDelete: () => void;
}

const slideTypeColors = {
  capa: 'from-primary to-primary/80',
  sobre: 'from-blue-500 to-blue-600',
  problema: 'from-orange-500 to-orange-600',
  solucao: 'from-green-500 to-green-600',
  servicos: 'from-purple-500 to-purple-600',
  investimento: 'from-emerald-500 to-emerald-600',
  cronograma: 'from-cyan-500 to-cyan-600',
  proximos_passos: 'from-indigo-500 to-indigo-600',
  contato: 'from-pink-500 to-pink-600',
};

export function SlidePreview({ slide, index, totalSlides, onEdit, onDelete }: SlidePreviewProps) {
  const bgGradient = slideTypeColors[slide.tipo] || 'from-gray-500 to-gray-600';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Slide {index + 1} de {totalSlides}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-1" />
            Editar
          </Button>
          {totalSlides > 1 && (
            <Button variant="outline" size="sm" onClick={onDelete} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-1" />
              Excluir
            </Button>
          )}
        </div>
      </div>

      <Card className={`aspect-[16/9] p-8 bg-gradient-to-br ${bgGradient} text-white relative overflow-hidden`}>
        <div className="absolute top-4 right-4 opacity-20">
          <img 
            src="/lovable-uploads/4745b238-fc3b-42b3-8500-dda5e9b944b2.png" 
            alt="Next Level Logo" 
            className="h-12"
          />
        </div>

        {slide.tipo === 'capa' ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h1 className="text-4xl font-bold mb-4">{slide.titulo}</h1>
            {slide.destaque && (
              <p className="text-xl opacity-90">{slide.destaque}</p>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <h2 className="text-3xl font-bold mb-6">{slide.titulo}</h2>
            
            {slide.destaque && (
              <div className="bg-white/20 rounded-lg p-4 mb-6">
                <p className="text-lg font-semibold">{slide.destaque}</p>
              </div>
            )}

            <div className="flex-1 space-y-3">
              {slide.conteudo.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-white mt-2 flex-shrink-0" />
                  <p className="text-lg leading-relaxed">{item}</p>
                </div>
              ))}
            </div>

            {slide.tipo === 'contato' && (
              <div className="mt-6 pt-6 border-t border-white/20">
                <p className="text-sm opacity-80">Next Level - Transformando Negócios com Tecnologia</p>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}