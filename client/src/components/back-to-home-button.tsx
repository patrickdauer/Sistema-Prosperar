import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";

export function BackToHomeButton() {
  const handleBackToHome = () => {
    // Verifica se foi aberto em nova janela/aba
    if (window.opener && !window.opener.closed) {
      // Se tem janela pai, volta para ela e fecha a atual
      window.opener.focus();
      window.close();
    } else {
      // Se não tem janela pai, navega normalmente
      window.location.href = '/home';
    }
  };

  return (
    <Button
      onClick={handleBackToHome}
      variant="outline"
      size="sm"
      className="fixed top-4 right-4 z-50 bg-white/90 hover:bg-white border-gray-300 text-gray-700 hover:text-gray-900 shadow-lg"
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      Voltar ao Menu
    </Button>
  );
}