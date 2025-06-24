import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function RedirectSistema() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirect to sistema-final (our main internal system)
    setLocation('/sistema-final');
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecionando para o Sistema Interno...</h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
      </div>
    </div>
  );
}