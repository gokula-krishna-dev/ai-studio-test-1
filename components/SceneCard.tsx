import React, { useState } from 'react';
import { RefreshCw, Download, Maximize2, X, Image as ImageIcon } from 'lucide-react';
import { Scene } from '../types';

interface Props {
  scene: Scene;
  index: number;
  onRegenerate: (id: string) => void;
}

const SceneCard: React.FC<Props> = ({ scene, index, onRegenerate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (scene.imageUrl) {
      const link = document.createElement('a');
      link.href = scene.imageUrl;
      link.download = `storyboard-scene-${index + 1}.png`;
      link.click();
    }
  };

  return (
    <>
      <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-indigo-500/50 transition-all group flex flex-col h-full">
        {/* Header */}
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-700 flex justify-between items-center">
          <span className="text-xs font-bold text-indigo-400 tracking-wider uppercase">Scene {index + 1}</span>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {scene.imageUrl && (
              <button 
                onClick={handleDownload}
                className="p-1.5 hover:bg-slate-700 rounded-md text-slate-400 hover:text-white" 
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            <button 
              onClick={() => onRegenerate(scene.id)}
              disabled={scene.isLoading}
              className="p-1.5 hover:bg-slate-700 rounded-md text-slate-400 hover:text-white disabled:opacity-50"
              title="Regenerate"
            >
              <RefreshCw className={`w-4 h-4 ${scene.isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Image Area */}
        <div 
          className="relative aspect-video bg-slate-950 flex items-center justify-center cursor-pointer group/image overflow-hidden"
          onClick={() => scene.imageUrl && setIsModalOpen(true)}
        >
          {scene.isLoading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-indigo-400 animate-pulse">Rendering...</span>
            </div>
          ) : scene.imageUrl ? (
            <>
              <img 
                src={scene.imageUrl} 
                alt={`Scene ${index + 1}`} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover/image:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover/image:opacity-100">
                <Maximize2 className="text-white drop-shadow-lg w-8 h-8" />
              </div>
            </>
          ) : scene.error ? (
            <div className="p-4 text-center">
              <p className="text-red-400 text-sm mb-2">Generation Failed</p>
              <p className="text-xs text-slate-500">{scene.error}</p>
            </div>
          ) : (
            <div className="text-slate-600 flex flex-col items-center gap-2">
              <ImageIcon className="w-8 h-8 opacity-50" />
              <span className="text-xs">Waiting to generate</span>
            </div>
          )}
        </div>

        {/* Text Content */}
        <div className="p-4 flex-1 flex flex-col gap-3">
          <div>
            <h4 className="text-xs font-semibold text-slate-500 mb-1">SCRIPT</h4>
            <p className="text-sm text-slate-200 line-clamp-3">{scene.scriptText}</p>
          </div>
          <div className="mt-auto pt-3 border-t border-slate-700/50">
            <h4 className="text-[10px] font-semibold text-slate-600 mb-1 uppercase tracking-wide">Visual Prompt</h4>
            <p className="text-xs text-slate-400 line-clamp-2 italic group-hover:line-clamp-none transition-all duration-300">
              {scene.visualPrompt}
            </p>
          </div>
        </div>
      </div>

      {/* Full Screen Modal */}
      {isModalOpen && scene.imageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4" onClick={() => setIsModalOpen(false)}>
          <button 
            className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition-colors"
            onClick={() => setIsModalOpen(false)}
          >
            <X className="w-8 h-8" />
          </button>
          <img 
            src={scene.imageUrl} 
            alt={`Scene ${index + 1} Full`} 
            className="max-w-full max-h-full rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

export default SceneCard;