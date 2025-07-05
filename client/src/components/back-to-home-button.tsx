import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import { useState, useEffect } from "react";

interface BackToHomeButtonProps {
  isPublicPage?: boolean;
}

export function BackToHomeButton({ isPublicPage = false }: BackToHomeButtonProps) {
  const [currentPath, setCurrentPath] = useState('');
  
  useEffect(() => {
    setCurrentPath(window.location.pathname);
  }, []);

  const handleBackToHome = () => {
    console.log('BackToHomeButton clicado, caminho atual:', currentPath);
    
    // Verifica se foi aberto em nova janela/aba
    if (window.opener && !window.opener.closed) {
      // Se tem janela pai, volta para ela e fecha a atual
      window.opener.focus();
      window.close();
    } else {
      // Lógica específica para a página novo-cliente
      if (currentPath === '/novo-cliente') {
        console.log('Navegando de novo-cliente para /clientes');
        window.location.href = '/clientes';
        return;
      }
      
      // Páginas públicas vão para a landing page, páginas internas vão para home
      const targetUrl = isPublicPage ? '/' : '/home';
      console.log('Navegando para:', targetUrl);
      window.location.href = targetUrl;
    }
  };

  const buttonText = currentPath === '/novo-cliente' ? 'Voltar aos Clientes' : 'Voltar ao Menu';

  return (
    <Button
      onClick={handleBackToHome}
      variant="outline"
      size="sm"
      className="fixed top-4 right-4 z-50 bg-white/90 hover:bg-white border-gray-300 text-gray-700 hover:text-gray-900 shadow-lg"
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      {buttonText}
    </Button>
  );
}