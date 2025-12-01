import React, { useState, useCallback } from 'react';
import { Clapperboard, Upload, Play, Trash2, Settings2, Image as ImageIcon } from 'lucide-react';
import { Scene, GenerationSettings, ImageSize, AspectRatio } from './types';
import { parseScriptToScenes, generateSceneImage } from './services/geminiService';
import { DEFAULT_SETTINGS } from './constants';
import SceneCard from './components/SceneCard';
import ChatWidget from './components/ChatWidget';
import ApiKeyChecker from './components/ApiKeyChecker';

// Mock script for easy testing
const DEMO_SCRIPT = `INT. COFFEE SHOP - DAY

A rain-streaked window overlooks a busy city street. 
JANE (30s, sharp blazer) sits alone at a corner table, staring at a cold cup of coffee.

She checks her watch. 
The door chime rings. She looks up sharply.

A mysterious FIGURE in a wet trench coat enters, carrying a silver briefcase.`;

function App() {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [script, setScript] = useState('');
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [settings, setSettings] = useState<GenerationSettings>(DEFAULT_SETTINGS);

  // Parse script into scenes
  const handleParseScript = async () => {
    if (!script.trim()) return;
    setIsParsing(true);
    setScenes([]); // Clear old scenes

    try {
      const parsedScenes = await parseScriptToScenes(script);
      const newScenes: Scene[] = parsedScenes.map((s, i) => ({
        ...s,
        id: Date.now().toString() + i,
        isLoading: false
      }));
      setScenes(newScenes);
    } catch (error) {
      console.error("Parsing failed", error);
      alert("Failed to parse script. Please try again.");
    } finally {
      setIsParsing(false);
    }
  };

  // Generate all images sequentially to avoid rate limits
  const handleGenerateAll = async () => {
    if (scenes.length === 0) return;

    // Mark all as loading initially if not already generated
    setScenes(prev => prev.map(s => s.imageUrl ? s : { ...s, isLoading: true, error: undefined }));

    // Process one by one
    for (let i = 0; i < scenes.length; i++) {
      if (scenes[i].imageUrl) continue; // Skip already generated

      try {
        await generateSingleImage(scenes[i].id, scenes[i].visualPrompt);
      } catch (e) {
        console.error(`Failed scene ${i}`, e);
      }
    }
  };

  const generateSingleImage = async (id: string, prompt: string) => {
    // Update specific scene to loading
    setScenes(prev => prev.map(s => s.id === id ? { ...s, isLoading: true, error: undefined } : s));

    try {
      const imageUrl = await generateSceneImage(prompt, settings.imageSize, settings.aspectRatio);
      setScenes(prev => prev.map(s => s.id === id ? { ...s, isLoading: false, imageUrl } : s));
    } catch (error: any) {
      setScenes(prev => prev.map(s => s.id === id ? { ...s, isLoading: false, error: error.message || "Failed" } : s));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === 'string') {
        setScript(ev.target.result);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-50">
      <ApiKeyChecker isReady={hasApiKey} onReady={() => setHasApiKey(true)} />
      
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Clapperboard className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-900 to-slate-700 bg-clip-text text-transparent">
              StoryBoard AI
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Settings Dropdowns */}
            <div className="hidden md:flex items-center gap-3 bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
              <div className="flex items-center px-2 gap-2 border-r border-slate-200">
                <Settings2 className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Config</span>
              </div>
              
              <select 
                value={settings.imageSize}
                onChange={(e) => setSettings(s => ({...s, imageSize: e.target.value as ImageSize}))}
                className="bg-transparent text-sm text-slate-700 focus:outline-none cursor-pointer py-1 px-2 hover:bg-slate-50 rounded transition-colors"
              >
                <option value="1K">1K Res</option>
                <option value="2K">2K Res (HQ)</option>
                <option value="4K">4K Res (Ultra)</option>
              </select>

              <select 
                value={settings.aspectRatio}
                onChange={(e) => setSettings(s => ({...s, aspectRatio: e.target.value as AspectRatio}))}
                className="bg-transparent text-sm text-slate-700 focus:outline-none cursor-pointer py-1 px-2 hover:bg-slate-50 rounded transition-colors"
              >
                <option value="16:9">16:9 Wide</option>
                <option value="4:3">4:3 Standard</option>
                <option value="1:1">1:1 Square</option>
                <option value="9:16">9:16 Mobile</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Input Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xl shadow-slate-200/50">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  SCRIPT INPUT
                </h2>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setScript(DEMO_SCRIPT)} 
                    className="text-xs text-indigo-600 hover:text-indigo-500 font-medium px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                  >
                    Load Demo
                  </button>
                  <label className="cursor-pointer text-xs text-slate-500 hover:text-slate-800 px-2 py-1 rounded hover:bg-slate-100 transition-colors flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    Upload
                    <input type="file" className="hidden" accept=".txt,.md" onChange={handleFileUpload} />
                  </label>
                </div>
              </div>
              
              <textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder="Paste your screenplay here..."
                className="w-full h-96 bg-slate-50 rounded-lg border border-slate-200 p-4 text-sm text-slate-800 font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
              />

              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleParseScript}
                  disabled={isParsing || !script.trim() || !hasApiKey}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-medium py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95"
                >
                  {isParsing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Analyzing Script...
                    </>
                  ) : (
                    <>
                      <Clapperboard className="w-4 h-4" />
                      Analyze Scenes
                    </>
                  )}
                </button>
                {scenes.length > 0 && (
                   <button
                   onClick={() => setScenes([])}
                   className="px-3 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 rounded-lg transition-colors border border-slate-200"
                   title="Clear Scenes"
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>
                )}
              </div>
            </div>

            {/* Mobile Settings (Visible only on small screens) */}
            <div className="md:hidden bg-white rounded-xl p-4 border border-slate-200 space-y-3 shadow-sm">
              <h3 className="text-xs font-semibold text-slate-500 uppercase">Generation Settings</h3>
              <div className="grid grid-cols-2 gap-3">
                <select 
                  value={settings.imageSize}
                  onChange={(e) => setSettings(s => ({...s, imageSize: e.target.value as ImageSize}))}
                  className="bg-slate-50 border border-slate-200 text-sm text-slate-900 rounded p-2"
                >
                   <option value="1K">1K</option>
                   <option value="2K">2K</option>
                   <option value="4K">4K</option>
                </select>
                <select 
                   value={settings.aspectRatio}
                   onChange={(e) => setSettings(s => ({...s, aspectRatio: e.target.value as AspectRatio}))}
                   className="bg-slate-50 border border-slate-200 text-sm text-slate-900 rounded p-2"
                >
                  <option value="16:9">16:9</option>
                  <option value="9:16">9:16</option>
                  <option value="1:1">1:1</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2">
            {scenes.length === 0 ? (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <div className="w-16 h-16 bg-white border border-slate-200 rounded-full flex items-center justify-center mb-4 shadow-sm">
                  <ImageIcon className="w-8 h-8 opacity-40 text-slate-500" />
                </div>
                <p className="text-lg font-medium text-slate-600">No scenes generated yet</p>
                <p className="text-sm">Enter a script and click "Analyze Scenes" to begin.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Storyboard</h2>
                    <p className="text-sm text-slate-500">{scenes.length} Scenes detected</p>
                  </div>
                  <button
                    onClick={handleGenerateAll}
                    disabled={!hasApiKey || scenes.every(s => s.imageUrl)}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-medium px-6 py-2.5 rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Generate All Images
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {scenes.map((scene, index) => (
                    <div key={scene.id} className="h-full">
                       <SceneCard 
                          scene={scene} 
                          index={index} 
                          onRegenerate={(id) => generateSingleImage(id, scene.visualPrompt)}
                        />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <ChatWidget />
    </div>
  );
}

export default App;