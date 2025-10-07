import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slide } from "@/hooks/usePropostas";

interface SlideEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slide: Slide;
  onSave: (updatedSlide: Slide) => void;
}

export function SlideEditor({ open, onOpenChange, slide, onSave }: SlideEditorProps) {
  const [titulo, setTitulo] = useState(slide.titulo);
  const [destaque, setDestaque] = useState(slide.destaque || "");
  const [conteudo, setConteudo] = useState(slide.conteudo.join("\n"));

  useEffect(() => {
    setTitulo(slide.titulo);
    setDestaque(slide.destaque || "");
    setConteudo(slide.conteudo.join("\n"));
  }, [slide]);

  const handleSave = () => {
    const updatedSlide: Slide = {
      ...slide,
      titulo,
      destaque: destaque || undefined,
      conteudo: conteudo.split("\n").filter(line => line.trim()),
    };
    onSave(updatedSlide);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Slide</DialogTitle>
          <DialogDescription>
            Faça alterações no conteúdo do slide
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título do slide"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="destaque">Destaque (opcional)</Label>
            <Input
              id="destaque"
              value={destaque}
              onChange={(e) => setDestaque(e.target.value)}
              placeholder="Texto de destaque ou subtítulo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="conteudo">Conteúdo</Label>
            <Textarea
              id="conteudo"
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              placeholder="Um item por linha"
              className="min-h-[200px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Cada linha será um item de conteúdo no slide
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}