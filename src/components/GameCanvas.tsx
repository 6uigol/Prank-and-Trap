import { useEffect, useRef } from 'react';
import { getLevel } from '../game/levels';
import { audio } from '../game/audio';
import { inputState } from '../game/input';
import { GameState, GameEngine, Rect } from '../game/types';

interface Props {
    levelIndex: number;
    onWin: () => void;
    onDie: () => void;
}

function intersect(r1: Rect, r2: Rect) {
    return !(r2.x >= r1.x + r1.w ||
             r2.x + r2.w <= r1.x ||
             r2.y >= r1.y + r1.h ||
             r2.y + r2.h <= r1.y);
}

export default function GameCanvas({ levelIndex, onWin, onDie }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>();
    const stateRef = useRef<GameState>(getLevel(levelIndex));

    useEffect(() => {
        stateRef.current = getLevel(levelIndex);
    }, [levelIndex]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') inputState.left = true;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') inputState.right = true;
            if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') inputState.up = true;
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') inputState.left = false;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') inputState.right = false;
            if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') inputState.up = false;
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            inputState.left = false;
            inputState.right = false;
            inputState.up = false;
        };
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let lastTime = performance.now();
        let isGameOver = false;

        const engine: GameEngine = {
            die: () => {
                if (isGameOver) return;
                isGameOver = true;
                audio.playDeath();
                onDie();
            },
            win: () => {
                if (isGameOver) return;
                isGameOver = true;
                audio.playWin();
                onWin();
            }
        };

        const loop = (time: number) => {
            if (isGameOver) return;
            const dt = Math.min((time - lastTime) / 1000, 0.1); // Cap dt to prevent huge jumps
            lastTime = time;
            
            const state = stateRef.current;
            const p = state.player;

            // Physics constants
            const speed = 300;
            const gravity = 1500;
            const jumpPower = -650;

            // Input
            if (inputState.left) p.vx = -speed;
            else if (inputState.right) p.vx = speed;
            else p.vx = 0;

            if (inputState.up && p.grounded) {
                p.vy = jumpPower;
                p.grounded = false;
                audio.playJump();
            }

            // Apply gravity
            p.vy += gravity * dt;

            // Move X
            p.x += p.vx * dt;

            // Collisions X
            for (let plat of state.platforms) {
                if (plat.hidden || plat.type === 'fake') continue;
                if (intersect(p, plat)) {
                    if (p.vx > 0) p.x = plat.x - p.w;
                    else if (p.vx < 0) p.x = plat.x + plat.w;
                    p.vx = 0;
                }
            }

            // Move Y
            p.y += p.vy * dt;
            p.grounded = false;

            // Collisions Y
            for (let plat of state.platforms) {
                if (plat.hidden || plat.type === 'fake') continue;
                if (intersect(p, plat)) {
                    if (p.vy > 0) {
                        p.y = plat.y - p.h;
                        p.grounded = true;
                    } else if (p.vy < 0) {
                        p.y = plat.y + plat.h;
                    }
                    p.vy = 0;
                }
            }

            // Update moving spikes
            for (let s of state.spikes) {
                if (s.vy && !s.hidden) {
                    s.y += s.vy * dt;
                }
            }

            // Triggers
            for (let t of state.triggers) {
                if (!t.fired && intersect(p, t)) {
                    t.fired = true;
                    t.action(state, engine);
                }
            }

            // Death by spikes
            for (let s of state.spikes) {
                if (s.hidden) continue;
                const hitbox = { x: s.x + 4, y: s.y + 4, w: s.w - 8, h: s.h - 8 };
                if (intersect(p, hitbox)) {
                    engine.die();
                    return;
                }
            }

            // Death by falling
            if (p.y > 800) {
                engine.die();
                return;
            }

            // Win
            if (intersect(p, state.goal)) {
                engine.win();
                return;
            }

            // Draw Background
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#0f172a'); // slate-900
            gradient.addColorStop(1, '#020617'); // slate-950
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw Grid
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.lineWidth = 1;
            for (let i = 0; i < canvas.width; i += 40) {
                ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
            }
            for (let i = 0; i < canvas.height; i += 40) {
                ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
            }

            // Draw Text
            if (state.text) {
                ctx.shadowColor = '#facc15';
                ctx.shadowBlur = 10;
                ctx.fillStyle = '#fef08a'; // text-yellow-200
                ctx.font = 'bold 28px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(state.text, canvas.width / 2, 80);
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
            }

            // Draw Platforms
            for (let plat of state.platforms) {
                if (plat.hidden) continue;
                
                // Shadow
                ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                ctx.shadowBlur = 10;
                ctx.shadowOffsetY = 5;
                
                const platGrad = ctx.createLinearGradient(plat.x, plat.y, plat.x, plat.y + plat.h);
                platGrad.addColorStop(0, '#334155'); // slate-700
                platGrad.addColorStop(1, '#0f172a'); // slate-900
                ctx.fillStyle = platGrad;
                ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
                
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
                ctx.shadowOffsetY = 0;

                ctx.strokeStyle = '#38bdf8'; // sky-400 neon border
                ctx.lineWidth = 2;
                ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
                
                // Inner glow / highlight
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.fillRect(plat.x, plat.y, plat.w, 4);
            }

            // Draw Fake Goals
            if (state.fakeGoals) {
                for (let fg of state.fakeGoals) {
                    ctx.shadowColor = '#22c55e';
                    ctx.shadowBlur = 15;
                    ctx.fillStyle = '#16a34a'; // green-600
                    ctx.fillRect(fg.x, fg.y, fg.w, fg.h);
                    ctx.shadowColor = 'transparent';
                    ctx.shadowBlur = 0;
                }
            }

            // Draw Goal
            ctx.shadowColor = '#4ade80';
            ctx.shadowBlur = 20;
            ctx.fillStyle = '#22c55e'; // green-500
            ctx.fillRect(state.goal.x, state.goal.y, state.goal.w, state.goal.h);
            
            // Goal pulse effect
            const pulse = Math.sin(time / 200) * 5 + 5;
            ctx.strokeStyle = `rgba(74, 222, 128, ${0.5 + Math.sin(time/200)*0.5})`;
            ctx.lineWidth = 2;
            ctx.strokeRect(state.goal.x - pulse, state.goal.y - pulse, state.goal.w + pulse*2, state.goal.h + pulse*2);
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;

            // Draw Spikes
            for (let s of state.spikes) {
                if (s.hidden) continue;
                ctx.shadowColor = '#ef4444';
                ctx.shadowBlur = 15;
                
                const spikeGrad = ctx.createLinearGradient(s.x, s.y, s.x, s.y + s.h);
                spikeGrad.addColorStop(0, '#f87171');
                spikeGrad.addColorStop(1, '#991b1b');
                ctx.fillStyle = spikeGrad;
                
                ctx.beginPath();
                ctx.moveTo(s.x + s.w / 2, s.y);
                ctx.lineTo(s.x + s.w, s.y + s.h);
                ctx.lineTo(s.x, s.y + s.h);
                ctx.fill();
                
                ctx.strokeStyle = '#fca5a5';
                ctx.lineWidth = 1;
                ctx.stroke();
                
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
            }

            // Draw Player
            ctx.shadowColor = '#facc15';
            ctx.shadowBlur = 20;
            
            const pGrad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
            pGrad.addColorStop(0, '#fef08a');
            pGrad.addColorStop(1, '#eab308');
            ctx.fillStyle = pGrad;
            ctx.fillRect(p.x, p.y, p.w, p.h);
            
            // Player eyes
            ctx.fillStyle = '#000';
            const eyeOffset = p.vx > 0 ? 4 : p.vx < 0 ? -4 : 0;
            ctx.fillRect(p.x + 6 + eyeOffset, p.y + 6, 4, 6);
            ctx.fillRect(p.x + 20 + eyeOffset, p.y + 6, 4, 6);
            
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;

            requestRef.current = requestAnimationFrame(loop);
        };

        requestRef.current = requestAnimationFrame(loop);

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [levelIndex, onWin, onDie]);

    return (
        <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="w-full h-full object-contain bg-slate-950"
        />
    );
}
