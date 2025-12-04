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

function playPing() {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    // Subtle "ping" sound (high pitch, quick decay)
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
}

// --- Tool Definition ---
const updateFiltersTool: FunctionDeclaration = {
  name: 'updateSearchFilters',
  description: 'Update the apartment search filters based on user request and return the number of listings found.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      city: { type: Type.STRING, description: 'City name (e.g. Ieper, Ghent, Antwerp, Brussels, Leuven)' },
      minPrice: { type: Type.NUMBER, description: 'Minimum price in Euros' },
      maxPrice: { type: Type.NUMBER, description: 'Maximum price in Euros' },
      minSize: { type: Type.NUMBER, description: 'Minimum size in square meters' },
      bedrooms: { type: Type.NUMBER, description: 'Number of bedrooms' },
      petsAllowed: { type: Type.BOOLEAN, description: 'Whether pets are required' },
      type: { type: Type.STRING, enum: ['apartment', 'house', 'studio', 'villa', 'loft', 'kot', 'penthouse', 'duplex'], description: 'Type of property' },
      sortBy: { type: Type.STRING, enum: ["price_asc", "price_desc", "size", "default", "energy_asc", "energy_desc"] }
    },
  },
};

type PortalMode = 'public' | 'tenant' | 'management';

// Bottom Nav Icon Component
const NavIcon: React.FC<{ 
    icon: React.ReactNode; 
    label: string; 
    active?: boolean;
    onClick?: () => void;
}> = ({ icon, label, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center justify-center gap-1 w-full ${active ? 'text-rose-600' : 'text-slate-500 hover:text-slate-800'}`}
    >
        {icon}
        <span className="text-[10px] font-medium">{label}</span>
    </button>
);

const PROPERTY_TYPES = [
    { id: 'apartment', label: 'Apartment', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" /></svg> },
    { id: 'house', label: 'House', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg> },
    { id: 'studio', label: 'Studio', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg> },
    { id: 'villa', label: 'Villa', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1m1.5.5-1.5-.5M6.75 7.364V3h-3v18m3-13.636 10.5-3.819" /></svg> },
    { id: 'loft', label: 'Loft', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg> },
    { id: 'kot', label: 'Kot', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg> },
    { id: 'penthouse', label: 'Penthouse', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" /></svg> },
    { id: 'duplex', label: 'Duplex', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1m1.5.5-1.5-.5M6.75 7.364V3h-3v18m3-13.636 10.5-3.819" /></svg> },
];

const App: React.FC = () => {
  // --- Auth & Routing State ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentMode, setCurrentMode] = useState<PortalMode>('public');

  // --- Public Search State ---
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(false);
  const [filters, setFilters] = useState<ApartmentSearchFilters>({ sortBy: 'default' });
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [userTranscript, setUserTranscript] = useState(''); 
  const [assistantReply, setAssistantReply] = useState('Tap the orb to start.');
  
  // Live API State
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [volume, setVolume] = useState(0);

  // --- Draggable Orb State ---
  // Initial position: Bottom Right
  const [orbPosition, setOrbPosition] = useState({ x: window.innerWidth - 100, y: window.innerHeight - 150 });
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

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

  const handleFilterChange = (updates: Partial<ApartmentSearchFilters>) => {
      const newFilters = { ...filters, ...updates };
      setFilters(newFilters);
      loadListings(newFilters);
  };

  // --- Auth Logic ---
  const handleLogin = () => {
     window.location.href = 'https://property.eburon.ai/admin';
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

  // --- Drag Handlers ---
  const handlePointerDown = (e: React.PointerEvent) => {
      isDragging.current = false;
      e.currentTarget.setPointerCapture(e.pointerId);
      dragOffset.current = {
          x: e.clientX - orbPosition.x,
          y: e.clientY - orbPosition.y
      };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
      if (e.buttons === 0) return; // Only track when pressed
      const newX = e.clientX - dragOffset.current.x;
      const newY = e.clientY - dragOffset.current.y;
      
      if (Math.abs(newX - orbPosition.x) > 5 || Math.abs(newY - orbPosition.y) > 5) {
          isDragging.current = true;
      }
      setOrbPosition({ x: newX, y: newY });
  };
  
  const handleOrbTap = () => {
      if (!isDragging.current) {
          playPing();
          handleMicClick();
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
                onClick={handleLogin}
                className="text-sm font-semibold text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-full transition-colors"
            >
                {currentUser ? currentUser.name : 'Log in'}
            </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col pt-8 pb-32 md:pb-10 relative max-w-[1800px] mx-auto w-full mb-16 md:mb-0">
            <>
                {/* Filters Row - Functional */}
                <div className="flex gap-4 overflow-x-auto px-6 mb-6 pb-2 scrollbar-hide items-center">
                    {PROPERTY_TYPES.map((pt) => {
                        const isActive = filters.type === pt.id;
                        return (
                             <button 
                                key={pt.id}
                                onClick={() => handleFilterChange({ type: isActive ? null : pt.id })}
                                className={`
                                    whitespace-nowrap px-4 py-3 rounded-xl border flex flex-col items-center gap-2 min-w-[70px] transition-all
                                    ${isActive 
                                        ? 'border-black bg-slate-50 opacity-100 shadow-sm' 
                                        : 'border-transparent opacity-60 hover:opacity-100 hover:bg-white'
                                    }
                                `}
                             >
                                 <div className={isActive ? 'text-black' : 'text-slate-500'}>
                                    {pt.icon}
                                 </div>
                                 <span className={`text-xs font-medium ${isActive ? 'text-black font-bold' : 'text-slate-500'}`}>
                                    {pt.label}
                                 </span>
                             </button>
                        );
                    })}
                    
                    <div className="border-l border-gray-300 mx-2 h-8"></div>
                    
                    {/* Pets Allowed Toggle */}
                    <button 
                        onClick={() => handleFilterChange({ petsAllowed: !filters.petsAllowed })}
                        className={`
                            whitespace-nowrap px-4 py-2 rounded-full border text-sm font-medium transition-colors flex items-center gap-2
                            ${filters.petsAllowed 
                                ? 'border-black bg-slate-900 text-white' 
                                : 'border-gray-300 bg-white text-slate-700 hover:border-black'
                            }
                        `}
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
                        </svg>
                        Pets Allowed
                    </button>

                    <select
                        value={filters.sortBy || 'default'}
                        onChange={(e) => handleFilterChange({ sortBy: e.target.value as any })}
                        className="text-sm font-medium text-slate-700 bg-transparent py-2 rounded-lg transition-colors border-none outline-none cursor-pointer hover:text-rose-600 ml-auto"
                    >
                        <option value="default">Sort By</option>
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                        <option value="size">Size: Large to Small</option>
                        <option value="energy_asc">Energy: Efficient First</option>
                        <option value="energy_desc">Energy: Least Efficient</option>
                    </select>
                </div>

                {/* Listings Grid - Airbnb Style (2-col mobile, 4-col desktop) */}
                <div className="px-6 w-full">
                    {isLoadingListings ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6 md:gap-x-6 md:gap-y-10">
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
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6 md:gap-x-6 md:gap-y-10">
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

      {/* Draggable Floating Orb Visualizer */}
      <div 
          className="fixed z-50 touch-none cursor-grab active:cursor-grabbing group"
          style={{ 
              left: orbPosition.x, 
              top: orbPosition.y,
              transform: 'translate(-50%, -50%)'
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handleOrbTap}
      >
          {/* Tooltip */}
          {isLiveActive && (
             <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl opacity-90 pointer-events-none animate-in fade-in slide-in-from-bottom-2">
                 {assistantReply}
                 <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
             </div>
          )}

          <div className="relative flex items-center justify-center w-[60px] h-[60px]">
              
              {/* Connecting Ring */}
              {connectionStatus === 'connecting' && (
                  <div className="absolute inset-[-4px] rounded-full border-2 border-cyan-400 border-dashed animate-spin"></div>
              )}

              {/* Image Orb */}
              <img 
                  src="https://cdnb.artstation.com/p/assets/images/images/044/950/613/original/cas-mysterious-orb.gif?1641561498"
                  alt="Homie Orb"
                  className={`
                     w-full h-full rounded-full object-cover shadow-2xl transition-transform duration-100 ease-out
                     ${!isLiveActive ? 'hover:scale-105' : ''}
                  `}
                  style={{
                      transform: isLiveActive ? `scale(${1 + volume * 0.5})` : 'scale(1)'
                  }}
                  draggable={false} // Prevent native drag of image
              />
          </div>
      </div>

      {/* Mobile Bottom Navigation (5 Icons) */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 z-40 md:hidden flex justify-around items-center py-2 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)] h-[65px]">
            <NavIcon 
                active={true}
                icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>}
                label="Explore" 
            />
            <NavIcon 
                icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>}
                label="Wishlists" 
            />
             <NavIcon 
                icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>}
                label="Trips" 
            />
            <NavIcon 
                icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" /></svg>}
                label="Inbox" 
            />
            <NavIcon 
                icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>}
                label="Profile" 
                onClick={handleLogin}
            />
      </div>

      {selectedListing && (
          <ListingDetails 
              listing={selectedListing} 
              currentUser={currentUser}
              onLoginRequest={handleLogin}
              onClose={() => setSelectedListing(null)} 
          />
      )}
      
      {/* Live Interview Logic can be hidden but kept for future ref or repurposed */}
      {isLiveActive && currentMode === 'public' && <div className="hidden"><LiveInterview onClose={() => setIsLiveActive(false)} /></div>}

    </div>
  );
};

export default App;