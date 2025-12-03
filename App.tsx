import React, { useState, useRef, useEffect, useCallback } from 'react';
import ListingCard from './components/ListingCard';
import ListingDetails from './components/ListingDetails';
import LiveInterview from './components/LiveInterview';
import ManagementPortal from './components/ManagementPortal';
import TenantPortal from './components/TenantPortal';
import { searchListings, authenticateUser } from './services/mockDb';
import { parseUserUtterance, createAudioContext } from './services/gemini';
import { ApartmentSearchFilters, Listing, User } from './types';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from '@google/genai';

// --- Helpers ---
function base64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const length = binaryString.length;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// --- Tool Definition ---
const updateFiltersTool: FunctionDeclaration = {
  name: 'updateSearchFilters',
  description: 'Update the apartment search filters based on user request and return the number of listings found.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      city: { type: Type.STRING, description: 'City name (e.g. Ieper)' },
      minPrice: { type: Type.NUMBER, description: 'Minimum price in Euros' },
      maxPrice: { type: Type.NUMBER, description: 'Maximum price in Euros' },
      minSize: { type: Type.NUMBER, description: 'Minimum size in square meters' },
      bedrooms: { type: Type.NUMBER, description: 'Number of bedrooms' },
      petsAllowed: { type: Type.BOOLEAN, description: 'Whether pets are required' },
      type: { type: Type.STRING, enum: ['apartment', 'house', 'studio'], description: 'Type of property' },
      sortBy: { type: Type.STRING, enum: ["price_asc", "price_desc", "size", "default", "energy_asc", "energy_desc"] }
    },
  },
};

type PortalMode = 'public' | 'tenant' | 'management';

const App: React.FC = () => {
  // --- Auth & Routing State ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentMode, setCurrentMode] = useState<PortalMode>('public');
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // --- Public Search State ---
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(false);
  const [filters, setFilters] = useState<ApartmentSearchFilters>({ sortBy: 'default' });
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [userTranscript, setUserTranscript] = useState(''); 
  const [assistantReply, setAssistantReply] = useState('Tap the mic to start your search.');
  
  // Live API State
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [volume, setVolume] = useState(0);

  // --- Refs ---
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const activeSessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const filtersRef = useRef(filters); 

  // --- Effects ---
  useEffect(() => {
    loadListings(filters);
  }, []);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const loadListings = async (currentFilters: ApartmentSearchFilters) => {
    setIsLoadingListings(true);
    try {
        const results = await searchListings(currentFilters);
        setListings(results);
        return results;
    } finally {
        setIsLoadingListings(false);
    }
  };

  // --- Auth Logic ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
        const user = await authenticateUser(loginEmail);
        if (user) {
            setCurrentUser(user);
            setShowLogin(false);
            if (user.role === 'tenant') {
                setCurrentMode('tenant');
            } else {
                setCurrentMode('management');
            }
        } else {
            alert('User not found. Try admin@eburon.ai, fixit@eburon.ai, owner@eburon.ai, or tenant@eburon.ai');
        }
    } finally {
        setLoginLoading(false);
    }
  };

  const handleLogout = () => {
      setCurrentUser(null);
      setCurrentMode('public');
  };

  // --- Live API Logic ---
  const startLiveSession = async () => {
    try {
      setConnectionStatus('connecting');
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key missing");

      // 1. Setup Audio Contexts
      inputAudioContextRef.current = createAudioContext(16000);
      outputAudioContextRef.current = createAudioContext(24000);
      
      await inputAudioContextRef.current.resume();
      await outputAudioContextRef.current.resume();

      const ai = new GoogleGenAI({ apiKey });

      const config = {
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log('Live Session Socket Opened');
          },
          onmessage: async (message: LiveServerMessage) => {
             // 1. Handle Tools
             if (message.toolCall) {
                const functionResponses: any[] = [];
                for (const fc of message.toolCall.functionCalls) {
                   if (fc.name === 'updateSearchFilters') {
                      const args = fc.args as any;
                      const newFilters = { ...filtersRef.current, ...args };
                      setFilters(newFilters);
                      const results = await loadListings(newFilters);
                      
                      functionResponses.push({
                        id: fc.id,
                        name: fc.name,
                        response: { result: `Filters updated. Found ${results.length} listings.` }
                      });
                   }
                }
                
                if (functionResponses.length > 0 && activeSessionRef.current) {
                    activeSessionRef.current.sendToolResponse({ functionResponses });
                }
             }

             // 2. Handle Audio Output
             const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (base64Audio && outputAudioContextRef.current) {
                const ctx = outputAudioContextRef.current;
                
                const bytes = base64ToBytes(base64Audio);
                const dataInt16 = new Int16Array(bytes.buffer);
                
                const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
                const channelData = buffer.getChannelData(0);
                for(let i=0; i<dataInt16.length; i++) {
                    channelData[i] = dataInt16[i] / 32768.0;
                }

                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                
                const currentTime = ctx.currentTime;
                if (nextStartTimeRef.current < currentTime) {
                    nextStartTimeRef.current = currentTime;
                }
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                
                sourcesRef.current.add(source);
                source.addEventListener('ended', () => sourcesRef.current.delete(source));
                
                setAssistantReply("Homie is speaking...");
             }

             // 3. Handle Interruption
             if (message.serverContent?.interrupted) {
                 sourcesRef.current.forEach(s => s.stop());
                 sourcesRef.current.clear();
                 nextStartTimeRef.current = 0;
             }
          },
          onclose: () => {
             cleanupAudio();
             setIsLiveActive(false);
             setConnectionStatus('idle');
             setAssistantReply("Session ended.");
          },
          onerror: (err: any) => {
             cleanupAudio();
             setIsLiveActive(false);
             setConnectionStatus('error');
             setAssistantReply("Connection error.");
          }
        },
        config: {
            responseModalities: [Modality.AUDIO],
            tools: [{ functionDeclarations: [updateFiltersTool] }],
            systemInstruction: `
              You are 'Homie', a dynamic, funny, and helpful real estate agent.
              
              YOUR GOAL:
              - Help the user find an apartment by asking questions about location, price, and needs.
              - When the user gives criteria, you MUST use the 'updateSearchFilters' tool.
              - After using the tool, I will give you the number of listings found. You MUST report this number to the user verbally (e.g., "I found 3 apartments!").
              
              PERSONA:
              - Friendly, slightly chaotic but competent.
              - Use Flemish/Dutch flair in English (e.g., "Allez," "Right?", "Zeg").
              - Occasional *cough* "sorry" in your speech.
              - Introduce yourself immediately upon connection.
            `,
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
            }
        }
      };

      const session = await ai.live.connect(config);
      activeSessionRef.current = session;
      setConnectionStatus('connected');
      setIsLiveActive(true);
      setAssistantReply("Homie is listening...");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      if (!inputAudioContextRef.current) return;
      const source = inputAudioContextRef.current.createMediaStreamSource(stream);
      const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
      processorRef.current = scriptProcessor;

      scriptProcessor.onaudioprocess = (e) => {
          const inputData = e.inputBuffer.getChannelData(0);
          
          let sum = 0;
          for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
          const rms = Math.sqrt(sum / inputData.length);
          setVolume(prev => prev * 0.8 + rms * 10 * 0.2);

          const l = inputData.length;
          const int16 = new Int16Array(l);
          for (let i = 0; i < l; i++) {
            int16[i] = inputData[i] * 32768;
          }
          
          if (activeSessionRef.current) {
              const base64Data = bytesToBase64(new Uint8Array(int16.buffer));
              activeSessionRef.current.sendRealtimeInput({
                media: { mimeType: 'audio/pcm;rate=16000', data: base64Data }
              });
          }
      };

      source.connect(scriptProcessor);
      scriptProcessor.connect(inputAudioContextRef.current.destination);

    } catch (e) {
      console.error(e);
      setConnectionStatus('error');
      setAssistantReply("Could not connect.");
    }
  };

  const cleanupAudio = () => {
    if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current.onaudioprocess = null;
        processorRef.current = null;
    }
    if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
    }
    if (inputAudioContextRef.current) {
        inputAudioContextRef.current.close();
        inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
        outputAudioContextRef.current.close();
        outputAudioContextRef.current = null;
    }
    activeSessionRef.current = null;
  };

  const stopLiveSession = useCallback(() => {
    cleanupAudio();
    setIsLiveActive(false);
    setConnectionStatus('idle');
    setVolume(0);
    setAssistantReply("Session ended.");
  }, []);

  const handleMicClick = () => {
     if (isLiveActive) {
        stopLiveSession();
     } else {
        startLiveSession();
     }
  };

  const handleTextSearch = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!userTranscript.trim()) return;
      try {
         const nluResult = await parseUserUtterance(userTranscript, filters, listings);
         if (nluResult.intent === 'ASK_DETAILS' && nluResult.targetListingId) {
            const target = listings.find(l => l.id === nluResult.targetListingId);
            if (target) setSelectedListing(target);
         } else {
             const newFilters = { ...filters, ...nluResult.filters };
             setFilters(newFilters);
             await loadListings(newFilters);
         }
         setAssistantReply(nluResult.assistantReply);
         setUserTranscript('');
      } catch(err) {
          console.error(err);
      }
  };

  // --- RENDER ---

  if (currentMode === 'management' && currentUser) {
      return <ManagementPortal user={currentUser} onLogout={handleLogout} />;
  }

  if (currentMode === 'tenant' && currentUser) {
      return <TenantPortal user={currentUser} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans relative">
      
      {/* Top Bar (Public) */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center transition-all shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => {}}>
            <div className="bg-rose-500 p-2 rounded-full text-white">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
            </div>
            <h1 className="text-xl font-bold text-rose-500 tracking-tight hidden sm:block">Homie<span className="text-slate-900">Search</span></h1>
        </div>

        {/* Search Bar (Mock functionality for now in header, real action in footer) */}
        <div className="hidden md:flex items-center border border-gray-300 rounded-full shadow-sm hover:shadow-md transition-shadow px-4 py-2 gap-4 divide-x divide-gray-300 cursor-pointer">
             <span className="text-sm font-medium text-slate-900 pl-2">Anywhere</span>
             <span className="text-sm font-medium text-slate-900 pl-4">Any week</span>
             <span className="text-sm text-slate-500 pl-4 pr-2">Add guests</span>
             <div className="bg-rose-500 rounded-full p-2 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
             </div>
        </div>

        <div className="flex items-center gap-4">
            <button 
                onClick={() => setShowLogin(true)}
                className="text-sm font-semibold text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-full transition-colors"
            >
                Log in
            </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col pt-8 pb-32 relative max-w-[1800px] mx-auto w-full">
            <>
                {/* Assistant Bubble */}
                <div className="max-w-xl mx-auto mb-8 px-6 text-center sticky top-24 z-20 pointer-events-none">
                    <div className={`
                        inline-block bg-white/95 backdrop-blur-md border shadow-lg rounded-full px-8 py-3 text-slate-700 text-lg font-medium animate-fade-in relative overflow-hidden transition-all duration-300 pointer-events-auto
                        ${isLiveActive ? 'border-rose-400 shadow-rose-100 scale-105 ring-4 ring-rose-50' : 'border-slate-200'}
                    `}>
                        {isLiveActive ? (
                        <div className="flex items-center gap-3">
                             <div className="flex items-center justify-center gap-1 h-6">
                                {[...Array(4)].map((_, i) => (
                                    <div 
                                        key={i} 
                                        className="w-1 bg-rose-500 rounded-full transition-all duration-75"
                                        style={{ 
                                            height: `${Math.max(10, Math.min(100, Math.random() * 60 + volume * 200))}%`,
                                        }}
                                    ></div>
                                ))}
                            </div>
                            <p className="text-rose-600 font-medium text-sm animate-pulse whitespace-nowrap">{assistantReply}</p>
                        </div>
                        ) : (
                            assistantReply
                        )}
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex gap-3 overflow-x-auto px-6 mb-6 pb-2 scrollbar-hide">
                    {['Price', 'Type of place', 'Energy Class', 'Bedrooms', 'Amenities'].map((f, i) => (
                         <button key={i} className="whitespace-nowrap px-4 py-2 rounded-full border border-gray-300 text-sm font-medium hover:border-black transition-colors bg-white">
                             {f}
                         </button>
                    ))}
                    <div className="border-l border-gray-300 mx-2 h-8 self-center"></div>
                    <select
                        value={filters.sortBy || 'default'}
                        onChange={(e) => {
                            const newFilters = { ...filters, sortBy: e.target.value as any };
                            setFilters(newFilters);
                            loadListings(newFilters);
                        }}
                        className="text-sm font-medium text-slate-700 bg-transparent py-2 rounded-lg transition-colors border-none outline-none cursor-pointer hover:text-rose-600"
                    >
                        <option value="default">Sort By</option>
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                        <option value="size">Size: Large to Small</option>
                        <option value="energy_asc">Energy: Efficient First</option>
                        <option value="energy_desc">Energy: Least Efficient</option>
                    </select>
                </div>

                {/* Listings Grid - Airbnb Style */}
                <div className="px-6 w-full">
                    {isLoadingListings ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                <div key={i} className="flex flex-col gap-3 animate-pulse">
                                    <div className="aspect-square bg-slate-200 rounded-xl w-full"></div>
                                    <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                                </div>
                            ))}
                        </div>
                    ) : listings.length === 0 ? (
                        <div className="text-center text-slate-400 py-12">
                            <p className="text-lg">No homes found in this area.</p>
                            <p className="text-sm">Try changing your search filters.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
                            {listings.map(listing => (
                                <ListingCard 
                                    key={listing.id} 
                                    listing={listing} 
                                    onClick={(l) => setSelectedListing(l)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </>
      </main>

      {/* Floating Action Button for Mic */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2">
            <button 
                onClick={handleMicClick}
                className={`
                    relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl
                    ${isLiveActive 
                        ? 'bg-slate-900 scale-110' 
                        : 'bg-rose-500 hover:bg-rose-600 hover:scale-105'
                    }
                `}
            >
                {isLiveActive ? (
                    <div className="flex gap-1 items-end h-6">
                         {[...Array(3)].map((_, i) => (
                            <div 
                                key={i} 
                                className="w-1 bg-white rounded-full animate-bounce" 
                                style={{ animationDelay: `${i * 0.1}s`, height: '100%' }}
                            ></div>
                        ))}
                    </div>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                    </svg>
                )}
            </button>
            <span className="bg-slate-900 text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg opacity-90">
                 {isLiveActive ? 'Tap to Stop' : 'Ask Homie'}
            </span>
      </div>

      {/* Login Modal */}
      {showLogin && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
                  <div className="bg-rose-500 p-6 text-white text-center">
                      <h2 className="text-xl font-bold">Portal Login</h2>
                      <p className="text-rose-100 text-sm">Access your Eburon account</p>
                  </div>
                  <form onSubmit={handleLogin} className="p-6 space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                          <input 
                              type="email" 
                              required 
                              className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-rose-500" 
                              placeholder="name@eburon.ai"
                              value={loginEmail}
                              onChange={e => setLoginEmail(e.target.value)}
                          />
                      </div>
                      <button 
                          type="submit" 
                          disabled={loginLoading}
                          className="w-full bg-rose-600 text-white py-3 rounded-lg font-bold hover:bg-rose-700 transition-colors disabled:opacity-50"
                      >
                          {loginLoading ? 'Checking...' : 'Enter Portal'}
                      </button>
                      <button type="button" onClick={() => setShowLogin(false)} className="w-full text-slate-500 text-sm py-2">Cancel</button>
                  </form>
                  <div className="bg-slate-50 p-4 text-xs text-slate-400 text-center">
                      Try: <strong>admin@eburon.ai</strong>, <strong>fixit@eburon.ai</strong>, <strong>tenant@eburon.ai</strong>
                  </div>
              </div>
          </div>
      )}
      
      {selectedListing && (
          <ListingDetails 
              listing={selectedListing} 
              onClose={() => setSelectedListing(null)} 
          />
      )}
      
      {/* Live Interview Logic can be hidden but kept for future ref or repurposed */}
      {isLiveActive && currentMode === 'public' && <div className="hidden"><LiveInterview onClose={() => setIsLiveActive(false)} /></div>}

    </div>
  );
};

export default App;