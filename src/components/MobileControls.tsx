import { ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import { inputState } from '../game/input';

export default function MobileControls() {
    // Only show on touch devices
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isTouch) return null;

    return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-end p-6 md:p-12 z-40">
            <div className="flex justify-between w-full">
                <div className="flex gap-4 pointer-events-auto">
                    <button
                        className="w-16 h-16 md:w-20 md:h-20 bg-yellow-400/20 active:bg-yellow-400/50 border-2 border-yellow-400 rounded-full flex items-center justify-center text-yellow-400 transition-colors"
                        onPointerDown={(e) => { e.preventDefault(); inputState.left = true; }}
                        onPointerUp={(e) => { e.preventDefault(); inputState.left = false; }}
                        onPointerCancel={(e) => { e.preventDefault(); inputState.left = false; }}
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        <ArrowLeft size={32} />
                    </button>
                    <button
                        className="w-16 h-16 md:w-20 md:h-20 bg-yellow-400/20 active:bg-yellow-400/50 border-2 border-yellow-400 rounded-full flex items-center justify-center text-yellow-400 transition-colors"
                        onPointerDown={(e) => { e.preventDefault(); inputState.right = true; }}
                        onPointerUp={(e) => { e.preventDefault(); inputState.right = false; }}
                        onPointerCancel={(e) => { e.preventDefault(); inputState.right = false; }}
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        <ArrowRight size={32} />
                    </button>
                </div>
                <div className="pointer-events-auto">
                    <button
                        className="w-16 h-16 md:w-20 md:h-20 bg-yellow-400/20 active:bg-yellow-400/50 border-2 border-yellow-400 rounded-full flex items-center justify-center text-yellow-400 transition-colors"
                        onPointerDown={(e) => { e.preventDefault(); inputState.up = true; }}
                        onPointerUp={(e) => { e.preventDefault(); inputState.up = false; }}
                        onPointerCancel={(e) => { e.preventDefault(); inputState.up = false; }}
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        <ArrowUp size={32} />
                    </button>
                </div>
            </div>
        </div>
    );
}
