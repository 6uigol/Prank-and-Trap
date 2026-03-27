import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Search, X } from 'lucide-react';
import GameCanvas from './components/GameCanvas';
import MobileControls from './components/MobileControls';
import AdSense from './components/AdSense';
import { audio } from './game/audio';
import { NUM_LEVELS } from './game/levels';

type AppState = 'loading' | 'menu' | 'playing' | 'paused' | 'gameover' | 'levelcomplete' | 'gamecomplete' | 'levelselect';

export default function App() {
    const [state, setState] = useState<AppState>('loading');
    const [level, setLevel] = useState(0);
    const [muted, setMuted] = useState(false);
    const [maxLevel, setMaxLevel] = useState(() => {
        const saved = localStorage.getItem('prank_max_level');
        return saved ? parseInt(saved, 10) : 0;
    });

    useEffect(() => {
        if (state === 'loading') {
            const timer = setTimeout(() => setState('menu'), 2000);
            return () => clearTimeout(timer);
        }
    }, [state]);

    useEffect(() => {
        if (state === 'playing' && !muted) {
            audio.init();
            audio.startBGM();
        } else {
            audio.stopBGM();
        }
    }, [state, muted]);

    const startGame = () => {
        audio.init();
        setLevel(Math.min(maxLevel, NUM_LEVELS - 1));
        setState('playing');
    };

    const handleWin = () => {
        const next = level + 1;
        if (next > maxLevel && next < NUM_LEVELS) {
            setMaxLevel(next);
            localStorage.setItem('prank_max_level', next.toString());
        }
        setState('levelcomplete');
    };

    const handleDie = () => {
        setState('gameover');
    };

    const nextLevel = () => {
        if (level + 1 >= NUM_LEVELS) {
            setState('gamecomplete');
        } else {
            setLevel(l => l + 1);
            setState('playing');
        }
    };

    const retryLevel = () => {
        setState('playing');
    };

    const isGameplayState = state === 'playing' || state === 'paused';

    return (
        <div
            className={`w-full h-[100dvh] bg-slate-950 text-yellow-400 font-mono overflow-hidden select-none flex flex-col relative ${
                isGameplayState ? 'touch-none' : 'touch-auto'
            }`}
        >
            {/* Header / Top Bar */}
            {state !== 'loading' && (
                <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-50 pointer-events-none">
                    <div className="text-xl font-bold text-yellow-400 drop-shadow-md">
                        {(state === 'playing' || state === 'paused' || state === 'gameover' || state === 'levelcomplete') ? `LEVEL ${level + 1}` : ''}
                    </div>
                    <div className="flex gap-4 pointer-events-auto">
                        <button onClick={() => setMuted(!muted)} className="p-2 bg-neutral-900 border border-yellow-400 rounded text-yellow-400 hover:bg-neutral-800 transition-colors">
                            {muted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                        </button>
                        {(state === 'menu' || state === 'paused') && (
                            <button onClick={() => setState('levelselect')} className="p-2 bg-neutral-900 border border-yellow-400 rounded text-yellow-400 hover:bg-neutral-800 transition-colors" title="Level Select">
                                <Search size={24} />
                            </button>
                        )}
                        {state === 'playing' && (
                            <button onClick={() => setState('paused')} className="p-2 bg-neutral-900 border border-yellow-400 rounded text-yellow-400 hover:bg-neutral-800 transition-colors">
                                <Pause size={24} />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Screens */}
            {state === 'loading' && (
                <div className="flex-1 flex flex-col items-center justify-center">
                    <h1 className="text-4xl md:text-6xl font-black mb-8 tracking-tighter text-red-600">PRANK<span className="text-yellow-400">AND</span>TRAP</h1>
                    <div className="w-64 h-4 border-2 border-yellow-400 p-0.5">
                        <div className="h-full bg-yellow-400 animate-fill"></div>
                    </div>
                    <p className="mt-4 text-sm animate-pulse">Loading pranks...</p>
                </div>
            )}

            {state === 'menu' && (
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                    <div className="flex flex-col items-center mb-12">
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-red-600 drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]">PRANK</h1>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]">AND TRAP</h1>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button onClick={startGame} className="group relative px-8 py-4 bg-yellow-400 text-black font-bold text-2xl uppercase tracking-widest hover:bg-yellow-300 transition-colors flex items-center justify-center gap-4">
                            <Play fill="currentColor" /> Play Now
                            <div className="absolute inset-0 border-2 border-yellow-400 scale-110 opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all"></div>
                        </button>
                        <button onClick={() => setState('levelselect')} className="px-8 py-4 border border-yellow-400 text-yellow-400 font-bold text-xl uppercase tracking-widest hover:bg-neutral-900 transition-colors flex items-center justify-center gap-4">
                            <Search size={24} /> Levels
                        </button>
                    </div>
                    <div className="mt-10 w-full max-w-2xl h-24 px-4">
                        <AdSense slot={import.meta.env.VITE_ADSENSE_SLOT_ID || "1234567890"} />
                    </div>
                </div>
            )}

            {state === 'levelselect' && (
                <div className="flex-1 flex flex-col items-center bg-slate-950 absolute inset-0 z-50 p-4 overflow-y-auto pt-20">
                    <div className="w-full max-w-4xl flex justify-between items-center mb-8">
                        <h2 className="text-3xl font-bold text-yellow-400 flex items-center gap-3">
                            <Search size={32} /> SELECT LEVEL
                        </h2>
                        <button onClick={() => setState('menu')} className="p-2 border border-yellow-400 text-yellow-400 hover:bg-neutral-900 transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                    <div className="w-full max-w-4xl grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 pb-20">
                        {Array.from({ length: NUM_LEVELS }).map((_, i) => (
                            <button
                                key={i}
                                disabled={i > maxLevel}
                                onClick={() => {
                                    audio.init();
                                    setLevel(i);
                                    setState('playing');
                                }}
                                className={`aspect-square flex items-center justify-center text-xl font-bold border ${
                                    i <= maxLevel 
                                        ? 'border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black cursor-pointer' 
                                        : 'border-neutral-800 text-neutral-800 cursor-not-allowed bg-neutral-900/50'
                                } transition-colors`}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {state === 'playing' && (
                <div className="flex-1 relative w-full h-full">
                    <GameCanvas levelIndex={level} onWin={handleWin} onDie={handleDie} />
                    <MobileControls />
                </div>
            )}

            {state === 'paused' && (
                <div className="flex-1 flex flex-col items-center justify-center bg-slate-950/90 absolute inset-0 z-50 p-4">
                    <h2 className="text-4xl font-bold mb-8 text-yellow-400">PAUSED</h2>
                    <div className="flex gap-4 mb-12 flex-wrap justify-center">
                        <button onClick={() => setState('playing')} className="px-6 py-3 bg-yellow-400 text-black font-bold flex items-center gap-2 hover:bg-yellow-300">
                            <Play fill="currentColor" size={20} /> Resume
                        </button>
                        <button onClick={() => setState('levelselect')} className="px-6 py-3 border border-yellow-400 text-yellow-400 font-bold hover:bg-neutral-900 flex items-center gap-2">
                            <Search size={20} /> Levels
                        </button>
                        <button onClick={() => { setState('menu'); }} className="px-6 py-3 border border-yellow-400 text-yellow-400 font-bold hover:bg-neutral-900">
                            Main Menu
                        </button>
                    </div>
                    <div className="w-full max-w-md h-64">
                        <AdSense slot={import.meta.env.VITE_ADSENSE_SLOT_ID || "1234567890"} />
                    </div>
                </div>
            )}

            {state === 'gameover' && (
                <div className="flex-1 flex flex-col items-center justify-center bg-red-950/90 absolute inset-0 z-50 p-4">
                    <h2 className="text-5xl font-black mb-4 text-red-500 tracking-widest text-center">YOU DIED</h2>
                    <p className="mb-8 text-red-300 text-center">Never trust the level.</p>
                    <button onClick={retryLevel} className="px-8 py-4 bg-red-600 text-white font-bold text-xl flex items-center gap-3 hover:bg-red-500 transition-colors">
                        <RotateCcw size={24} /> Try Again
                    </button>
                    <div className="mt-12 w-full max-w-md h-64">
                        <AdSense slot={import.meta.env.VITE_ADSENSE_SLOT_ID || "1234567890"} />
                    </div>
                </div>
            )}

            {state === 'levelcomplete' && (
                <div className="flex-1 flex flex-col items-center justify-center bg-slate-950/90 absolute inset-0 z-50 p-4">
                    <h2 className="text-5xl font-black mb-8 text-green-500 tracking-widest text-center">LEVEL CLEARED</h2>
                    <button onClick={nextLevel} className="px-8 py-4 bg-green-500 text-black font-bold text-xl flex items-center gap-3 hover:bg-green-400 transition-colors">
                        <Play fill="currentColor" size={24} /> Next Level
                    </button>
                    <div className="mt-12 w-full max-w-md h-64">
                        <AdSense slot={import.meta.env.VITE_ADSENSE_SLOT_ID || "1234567890"} />
                    </div>
                </div>
            )}

            {state === 'gamecomplete' && (
                <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 absolute inset-0 z-50 p-4">
                    <h2 className="text-5xl font-black mb-4 text-yellow-400 tracking-widest text-center">YOU SURVIVED<br/>THE PRANKS!</h2>
                    <p className="mb-8 text-neutral-400 text-center">Thanks for playing.</p>
                    <button onClick={() => setState('menu')} className="px-8 py-4 bg-yellow-400 text-black font-bold text-xl hover:bg-yellow-300 transition-colors">
                        Back to Menu
                    </button>
                </div>
            )}
        </div>
    );
}
