import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Send, X } from 'lucide-react';
import { useCandidaturas, type CandidaturaData } from '@/hooks/useCandidaturas';

export function TeamApplication() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CandidaturaData>({
    nome: '',
    email: '',
    telefone: '',
    sobre_voce: '',
    objetivo_vendas: '',
  });

  const { createCandidatura, isLoading } = useCandidaturas();

  const totalSteps = 5;

  const updateFormData = (field: keyof CandidaturaData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const progress = (currentStep / totalSteps) * 100;

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return formData.nome.trim().length >= 2;
      case 2:
        return formData.email.trim().includes('@');
      case 3:
        return formData.telefone.trim().length >= 10;
      case 4:
        return formData.sobre_voce.trim().length >= 50;
      case 5:
        return formData.objetivo_vendas.trim().length >= 50;
      default:
        return false;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && currentStep < 4) { // Don't auto-advance on textareas
      e.preventDefault();
      if (isStepValid(currentStep)) {
        handleNext();
      }
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps && isStepValid(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    const result = await createCandidatura(formData);
    if (result.success) {
      // Reset form
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        sobre_voce: '',
        objetivo_vendas: '',
      });
      setCurrentStep(1);
      // Navigate back to landing page
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header with close button */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground hover:bg-transparent active:bg-transparent focus:bg-transparent"
            >
              <X className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold">Candidatura Next Level</h1>
          </div>
          <div className="text-sm text-muted-foreground">
            {currentStep} de {totalSteps}
          </div>
        </div>
        <Progress value={progress} className="h-1" />
      </div>

      {/* Main content */}
      <div className="pt-20 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="w-full max-w-2xl">
              
              {/* Step 1: Name */}
              {currentStep === 1 && (
                <div className="space-y-8 text-center sm:text-left animate-fade-in">
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-foreground">
                      Qual é o seu nome e sobrenome? ✋
                    </h2>
                    <p className="text-lg text-muted-foreground">
                      Vamos começar do básico - digite seu nome completo
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Input
                      autoFocus
                      value={formData.nome}
                      onChange={(e) => updateFormData('nome', e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Digite seu nome e sobrenome"
                      className="text-xl p-6 border-2 bg-background/50 backdrop-blur-sm focus:border-primary/50"
                    />
                    {formData.nome.length > 0 && formData.nome.length < 2 && (
                      <p className="text-sm text-destructive">Nome deve ter pelo menos 2 caracteres</p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Email */}
              {currentStep === 2 && (
                <div className="space-y-8 text-center sm:text-left animate-fade-in">
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-foreground">
                      {formData.nome ? `${formData.nome}, qual é o seu email?` : 'Qual é o seu email?'} 📧
                    </h2>
                    <p className="text-lg text-muted-foreground">
                      Precisamos do seu email para entrar em contato
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Input
                      autoFocus
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData('email', e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="seuemail@exemplo.com"
                      className="text-xl p-6 border-2 bg-background/50 backdrop-blur-sm focus:border-primary/50"
                    />
                    {formData.email.length > 0 && !formData.email.includes('@') && (
                      <p className="text-sm text-destructive">Insira um email válido</p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Phone */}
              {currentStep === 3 && (
                <div className="space-y-8 text-center sm:text-left animate-fade-in">
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-foreground">
                      {formData.nome ? `${formData.nome}, qual é o seu telefone?` : 'Qual é o seu telefone?'} 📱
                    </h2>
                    <p className="text-lg text-muted-foreground">
                      WhatsApp ou telefone para contato direto
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Input
                      autoFocus
                      type="tel"
                      value={formData.telefone}
                      onChange={(e) => updateFormData('telefone', e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="(11) 99999-9999"
                      className="text-xl p-6 border-2 bg-background/50 backdrop-blur-sm focus:border-primary/50"
                    />
                    {formData.telefone.length > 0 && formData.telefone.length < 10 && (
                      <p className="text-sm text-destructive">Telefone deve ter pelo menos 10 dígitos</p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: About You */}
              {currentStep === 4 && (
                <div className="space-y-8 text-center sm:text-left animate-fade-in">
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-foreground">
                      {formData.nome ? `${formData.nome}, conte-nos sobre você` : 'Conte-nos sobre você'} 🌟
                    </h2>
                    <p className="text-lg text-muted-foreground">
                      Sua experiência, personalidade, o que te motiva... Queremos te conhecer!
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Textarea
                      autoFocus
                      value={formData.sobre_voce}
                      onChange={(e) => updateFormData('sobre_voce', e.target.value)}
                      placeholder="Fale sobre sua trajetória, experiências profissionais, o que você gosta de fazer, seus pontos fortes..."
                      className="text-lg p-6 border-2 bg-background/50 backdrop-blur-sm min-h-[200px] resize-none focus:border-primary/50"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{formData.sobre_voce.length >= 50 ? '✅ Perfeito!' : 'Mínimo 50 caracteres'}</span>
                      <span>{formData.sobre_voce.length}/50</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Sales Objective */}
              {currentStep === 5 && (
                <div className="space-y-8 text-center sm:text-left animate-fade-in">
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-foreground">
                      {formData.nome ? `${formData.nome}, por que quer fazer parte do nosso time?` : 'Por que quer fazer parte do nosso time?'} 🚀
                    </h2>
                    <p className="text-lg text-muted-foreground">
                      Quais são seus objetivos? Como você pode contribuir com a Next Level?
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Textarea
                      autoFocus
                      value={formData.objetivo_vendas}
                      onChange={(e) => updateFormData('objetivo_vendas', e.target.value)}
                      placeholder="Explique seus objetivos profissionais, por que vendas te atrai, o que você pode trazer para o time..."
                      className="text-lg p-6 border-2 bg-background/50 backdrop-blur-sm min-h-[200px] resize-none focus:border-primary/50"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{formData.objetivo_vendas.length >= 50 ? '✅ Perfeito!' : 'Mínimo 50 caracteres'}</span>
                      <span>{formData.objetivo_vendas.length}/50</span>
                    </div>
                  </div>
                </div>
              )}


            </div>
          </div>
        </div>
      </div>

      {/* Footer with navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t">
        <div className="flex justify-between items-center p-4 max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>

          {currentStep < totalSteps ? (
            <Button
              onClick={handleNext}
              disabled={!isStepValid(currentStep)}
              size="lg"
              className="flex items-center gap-2 px-8"
            >
              {currentStep < 3 ? 'OK' : 'Continuar'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !isStepValid(currentStep)}
              size="lg"
              className="flex items-center gap-2 px-8"
            >
              {isLoading ? (
                <>Enviando...</>
              ) : (
                <>
                  Enviar candidatura
                  <Send className="w-4 h-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}