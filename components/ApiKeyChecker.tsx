import React, { useEffect, useState } from 'react';
import { checkApiKeySelection, promptApiKeySelection } from '../services/geminiService';
import { Lock } from 'lucide-react';

interface Props {
  onReady: () => void;
  isReady: boolean;
}

const ApiKeyChecker: React.FC<Props> = ({ onReady, isReady }) => {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const hasKey = await checkApiKeySelection();
        if (hasKey) {
          onReady();
        }
      } catch (e) {
        console.error("Error checking key", e);
      } finally {
        setChecking(false);
      }
    };
    check();
  }, [onReady]);

  const handleConnect = async () => {
    try {
      await promptApiKeySelection();
      // Assume success after dialog interaction as per race condition notes
      onReady(); 
    } catch (e) {
      console.error("Failed to select key", e);
    }
  };

  if (isReady) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-md w-full text-center shadow-2xl">
        <div className="mx-auto w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Required</h2>
        <p className="text-slate-600 mb-6">
          To generate high-quality 4K storyboards using Nano Banana Pro (Gemini 3 Pro), you must connect a paid GCP project API key.
        </p>
        
        <button
          onClick={handleConnect}
          disabled={checking}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {checking ? 'Checking...' : 'Select API Key'}
        </button>
        
        <div className="mt-4 text-xs text-slate-500">
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-slate-800">
            View billing documentation
          </a>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyChecker;