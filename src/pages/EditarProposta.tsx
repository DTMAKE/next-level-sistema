import { useState } from "react";
import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useProposta, useUpdateProposta, Slide } from "@/hooks/usePropostas";
import { SlidePreview } from "@/components/Propostas/SlidePreview";
import { SlideEditor } from "@/components/Propostas/SlideEditor";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronLeft, ChevronRight, Save, Check } from "lucide-react";
import { Loader2 } from "lucide-react";

export default function EditarProposta() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: proposta, isLoading } = useProposta(id!);
  const updateProposta = useUpdateProposta();
  
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [editingSlide, setEditingSlide] = useState<Slide | null>(null);

  // Initialize slides when proposta loads
  React.useEffect(() => {
    if (proposta?.slides_json) {
      setSlides(proposta.slides_json);
    }
  }, [proposta]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!proposta || slides.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground mb-4">Proposta não encontrada</p>
        <Button onClick={() => navigate('/criador-propostas')}>
          Voltar para Propostas
        </Button>
      </div>
    );
  }

  const currentSlide = slides[currentSlideIndex];

  const handleSaveSlide = (updatedSlide: Slide) => {
    const newSlides = [...slides];
    newSlides[currentSlideIndex] = updatedSlide;
    setSlides(newSlides);
    setEditingSlide(null);
  };

  const handleDeleteSlide = () => {
    if (slides.length === 1) return;
    const newSlides = slides.filter((_, idx) => idx !== currentSlideIndex);
    setSlides(newSlides);
    if (currentSlideIndex >= newSlides.length) {
      setCurrentSlideIndex(newSlides.length - 1);
    }
  };

  const handleSaveDraft = async () => {
    await updateProposta.mutateAsync({
      id: proposta.id,
      slides_json: slides,
      status: 'rascunho',
    });
  };

  const handleFinalize = async () => {
    await updateProposta.mutateAsync({
      id: proposta.id,
      slides_json: slides,
      status: 'finalizada',
    });
    navigate('/criador-propostas');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/criador-propostas')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{proposta.titulo}</h1>
            <p className="text-sm text-muted-foreground">Editando proposta</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSaveDraft}>
            <Save className="h-4 w-4 mr-2" />
            Salvar Rascunho
          </Button>
          <Button onClick={handleFinalize}>
            <Check className="h-4 w-4 mr-2" />
            Finalizar
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        <SlidePreview
          slide={currentSlide}
          index={currentSlideIndex}
          totalSlides={slides.length}
          onEdit={() => setEditingSlide(currentSlide)}
          onDelete={handleDeleteSlide}
        />

        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
            disabled={currentSlideIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>
          
          <span className="text-sm text-muted-foreground">
            Slide {currentSlideIndex + 1} de {slides.length}
          </span>
          
          <Button
            variant="outline"
            onClick={() => setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1))}
            disabled={currentSlideIndex === slides.length - 1}
          >
            Próximo
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {editingSlide && (
        <SlideEditor
          open={!!editingSlide}
          onOpenChange={(open) => !open && setEditingSlide(null)}
          slide={editingSlide}
          onSave={handleSaveSlide}
        />
      )}
    </div>
  );
}