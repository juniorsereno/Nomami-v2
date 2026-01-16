"use client"

import { useState, useEffect } from 'react';
import { Share, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AddToHomePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    if (standalone) return;

    // Detect device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);
    
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    // Check if user dismissed the prompt before
    const dismissed = localStorage.getItem('addToHomeDismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      // Show again after 7 days
      if (daysSinceDismissed < 7) return;
    }

    // Show prompt after a short delay
    const timer = setTimeout(() => {
      if (isIOSDevice || isAndroidDevice) {
        setShowPrompt(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('addToHomeDismissed', new Date().toISOString());
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-50 animate-in slide-in-from-bottom duration-300">
      <button 
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
        aria-label="Fechar"
      >
        <X className="w-5 h-5" />
      </button>
      
      <div className="flex items-start gap-3 pr-6">
        <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <Share className="w-5 h-5 text-purple-600" />
        </div>
        
        <div className="flex-1">
          <p className="font-semibold text-gray-900 text-sm">
            Adicione à tela inicial
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {isIOS ? (
              <>
                Toque em <span className="inline-flex items-center"><Share className="w-3 h-3 mx-1" /></span> e depois em <strong>&quot;Adicionar à Tela de Início&quot;</strong>
              </>
            ) : isAndroid ? (
              <>
                Toque no menu <strong>⋮</strong> e depois em <strong>&quot;Adicionar à tela inicial&quot;</strong>
              </>
            ) : (
              'Adicione este site à sua tela inicial para acesso rápido'
            )}
          </p>
        </div>
      </div>

      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleDismiss}
        className="w-full mt-3 text-xs"
      >
        Entendi
      </Button>
    </div>
  );
}
