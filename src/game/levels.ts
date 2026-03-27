import { GameState, Rect } from './types';

export const NUM_LEVELS = 104;

const WORLD_WIDTH = 800;
const WORLD_HEIGHT = 600;

const intersects = (a: Rect, b: Rect) =>
    !(b.x >= a.x + a.w || b.x + b.w <= a.x || b.y >= a.y + a.h || b.y + b.h <= a.y);

function clampRect(rect: Rect): Rect {
    return {
        ...rect,
        x: Math.max(0, Math.min(rect.x, WORLD_WIDTH - rect.w)),
        y: Math.max(-200, Math.min(rect.y, WORLD_HEIGHT + 200))
    };
}

function dedupeRects<T extends Rect & { id?: string; type?: string; hidden?: boolean; fired?: boolean }>(items: T[]): T[] {
    const seen = new Set<string>();
    return items.filter((item) => {
        const key = `${item.id ?? ''}:${item.type ?? ''}:${item.hidden ? 1 : 0}:${item.fired ? 1 : 0}:${item.x}:${item.y}:${item.w}:${item.h}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function ensureGoalSupport(state: GameState) {
    const hasSupport = state.platforms.some((plat) => {
        if (plat.hidden || plat.type === 'fake') return false;
        const sameColumn = state.goal.x + state.goal.w > plat.x && state.goal.x < plat.x + plat.w;
        const nearGoalBottom = Math.abs(plat.y - (state.goal.y + state.goal.h)) <= 40;
        return sameColumn && nearGoalBottom;
    });

    if (!hasSupport) {
        state.platforms.push({
            x: Math.max(0, Math.min(state.goal.x - 20, WORLD_WIDTH - 110)),
            y: Math.min(560, state.goal.y + state.goal.h + 10),
            w: 110,
            h: 20,
            type: 'solid'
        });
    }
}

function sanitizeLevel(raw: GameState): GameState {
    const state: GameState = {
        ...raw,
        player: { ...raw.player, ...clampRect(raw.player) },
        goal: { ...clampRect(raw.goal) },
        platforms: dedupeRects(raw.platforms.map((p) => ({ ...p, ...clampRect(p) }))),
        spikes: dedupeRects(raw.spikes.map((s) => ({ ...s, ...clampRect(s) }))),
        triggers: dedupeRects(raw.triggers.map((t) => ({ ...t, ...clampRect(t) }))),
        fakeGoals: raw.fakeGoals?.map((fg) => clampRect(fg))
    };

    // Evita mortes inevitáveis no spawn.
    for (const spike of state.spikes) {
        if (!spike.hidden && intersects(state.player, spike)) {
            spike.hidden = true;
        }
    }

    ensureGoalSupport(state);
    return state;
}

function generateProceduralLevel(index: number): GameState {
    const type = index % 10;
    const diff = Math.floor(index / 10);
    const text = `Level ${index + 1}: ${['Watch your head', 'Watch your step', 'Invisible maze', 'Catch me if you can', 'Trust issues', 'Leap of faith', 'Incoming!', 'The Box', 'Crusher', 'Falling Goal'][type]}`;

    const state: GameState = {
        player: { x: 50, y: 450, w: 30, h: 30, vx: 0, vy: 0, grounded: false },
        goal: { x: 700, y: 450, w: 50, h: 50 },
        platforms: [{ x: 0, y: 500, w: 800, h: 100, type: 'solid' }],
        spikes: [],
        triggers: [],
        fakeGoals: [],
        text
    };

    switch (type) {
        case 0: {
            const numCeilSpikes = Math.min(4 + diff, 11);
            for (let i = 0; i < numCeilSpikes; i++) {
                const sx = 170 + i * (450 / numCeilSpikes);
                state.spikes.push({ x: sx, y: -50, w: 40, h: 40, hidden: false, id: `s${i}`, vy: 0 });
                state.triggers.push({
                    x: sx - 45,
                    y: 0,
                    w: 20,
                    h: 600,
                    fired: false,
                    action: (s) => {
                        const sp = s.spikes.find((x) => x.id === `s${i}`);
                        if (sp) sp.vy = 600 + diff * 60;
                    }
                });
            }
            break;
        }
        case 1: {
            const numFloorSpikes = Math.min(4 + diff, 11);
            for (let i = 0; i < numFloorSpikes; i++) {
                const sx = 220 + i * (420 / numFloorSpikes);
                state.spikes.push({ x: sx, y: 470, w: 30, h: 30, hidden: true, id: `s${i}` });
                state.triggers.push({
                    x: sx - 55,
                    y: 0,
                    w: 18,
                    h: 600,
                    fired: false,
                    action: (s) => {
                        const sp = s.spikes.find((x) => x.id === `s${i}`);
                        if (sp) sp.hidden = false;
                    }
                });
            }
            break;
        }
        case 2: {
            const numWalls = Math.min(2 + diff, 7);
            for (let i = 0; i < numWalls; i++) {
                const wx = 260 + i * (420 / numWalls);
                state.platforms.push({ x: wx, y: 320, w: 20, h: 180, type: 'solid', hidden: true, id: `w${i}` });
                state.triggers.push({
                    x: wx - 38,
                    y: 0,
                    w: 16,
                    h: 600,
                    fired: false,
                    action: (s) => {
                        const w = s.platforms.find((x) => x.id === `w${i}`);
                        if (w) w.hidden = false;
                    }
                });
            }
            break;
        }
        case 3:
            state.triggers.push({
                x: 590,
                y: 0,
                w: 25,
                h: 600,
                fired: false,
                action: (s) => {
                    s.goal.x = 50;
                    s.goal.y = 100;
                }
            });
            state.platforms.push(
                { x: 0, y: 390, w: 120, h: 20, type: 'solid', hidden: true, id: 'p1' },
                { x: 145, y: 270, w: 100, h: 20, type: 'solid', hidden: true, id: 'p2' },
                { x: 0, y: 150, w: 100, h: 20, type: 'solid', hidden: true, id: 'p3' }
            );
            state.triggers.push({
                x: 90,
                y: 0,
                w: 20,
                h: 600,
                fired: false,
                action: (s) => {
                    const p1 = s.platforms.find((x) => x.id === 'p1');
                    const p2 = s.platforms.find((x) => x.id === 'p2');
                    const p3 = s.platforms.find((x) => x.id === 'p3');
                    if (p1) p1.hidden = false;
                    if (p2) p2.hidden = false;
                    if (p3) p3.hidden = false;
                }
            });
            break;
        case 4: {
            const numGoals = Math.min(4 + diff, 9);
            for (let i = 0; i < numGoals; i++) {
                const gx = 130 + i * (530 / numGoals);
                state.fakeGoals?.push({ x: gx, y: 450, w: 50, h: 50 });
                state.triggers.push({
                    x: gx,
                    y: 450,
                    w: 50,
                    h: 50,
                    fired: false,
                    action: (_s, e) => e.die()
                });
            }
            state.goal.x = 700;
            break;
        }
        case 5:
            state.platforms = [
                { x: 0, y: 500, w: 170, h: 100, type: 'solid' },
                { x: 170, y: 500, w: 460, h: 100, type: 'solid', id: 'f1' },
                { x: 630, y: 500, w: 170, h: 100, type: 'solid' },
                { x: 170, y: 580, w: 460, h: 20, type: 'solid', hidden: true, id: 'f2' }
            ];
            state.triggers.push({
                x: 185,
                y: 0,
                w: 20,
                h: 600,
                fired: false,
                action: (s) => {
                    const f1 = s.platforms.find((x) => x.id === 'f1');
                    const f2 = s.platforms.find((x) => x.id === 'f2');
                    if (f1) f1.hidden = true;
                    if (f2) f2.hidden = false;
                }
            });
            break;
        case 6: {
            const numSpikes = Math.min(5 + diff, 12);
            for (let i = 0; i < numSpikes; i++) {
                const sx = 170 + i * (470 / numSpikes);
                state.spikes.push({ x: sx, y: 470, w: 30, h: 30, hidden: true, id: `sw${i}` });
                state.triggers.push({
                    x: sx - 95,
                    y: 0,
                    w: 20,
                    h: 600,
                    fired: false,
                    action: (s) => {
                        const sp = s.spikes.find((x) => x.id === `sw${i}`);
                        if (sp) sp.hidden = false;
                    }
                });
            }
            break;
        }
        case 7:
            state.platforms.push(
                { x: 440, y: 330, w: 20, h: 170, type: 'solid', hidden: true, id: 'b1' },
                { x: 560, y: 330, w: 20, h: 170, type: 'solid', hidden: true, id: 'b2' },
                { x: 440, y: 330, w: 140, h: 20, type: 'solid', hidden: true, id: 'b3' }
            );
            state.spikes.push({ x: 495, y: 350, w: 30, h: 30, hidden: true, id: 'bspike', vy: 0 });
            state.triggers.push({
                x: 390,
                y: 0,
                w: 20,
                h: 600,
                fired: false,
                action: (s) => {
                    const b1 = s.platforms.find((x) => x.id === 'b1');
                    const b2 = s.platforms.find((x) => x.id === 'b2');
                    const b3 = s.platforms.find((x) => x.id === 'b3');
                    const sp = s.spikes.find((x) => x.id === 'bspike');
                    if (b1) b1.hidden = false;
                    if (b2) b2.hidden = false;
                    if (b3) b3.hidden = false;
                    if (sp) {
                        sp.hidden = false;
                        sp.vy = 350 + diff * 60;
                    }
                }
            });
            break;
        case 8:
            state.spikes.push({ x: 190, y: -220, w: 420, h: 50, hidden: false, id: 'crush', vy: 0 });
            state.triggers.push({
                x: 145,
                y: 0,
                w: 20,
                h: 600,
                fired: false,
                action: (s) => {
                    const c = s.spikes.find((x) => x.id === 'crush');
                    if (c) c.vy = 330 + diff * 60;
                }
            });
            break;
        case 9:
            state.goal = { x: 700, y: 100, w: 50, h: 50 };
            state.platforms.push({ x: 650, y: 150, w: 150, h: 20, type: 'solid', id: 'gplat' });
            state.triggers.push({
                x: 390,
                y: 0,
                w: 20,
                h: 600,
                fired: false,
                action: (s) => {
                    const gp = s.platforms.find((x) => x.id === 'gplat');
                    if (gp) gp.hidden = true;
                    s.goal.y = 450;
                    const sp = s.spikes.find((x) => x.id === 'gspike');
                    if (sp) sp.hidden = false;
                }
            });
            state.spikes.push({ x: 720, y: 470, w: 30, h: 30, hidden: true, id: 'gspike' });
            break;
    }

    return sanitizeLevel(state);
}

export const getLevel = (index: number): GameState => {
    const handcrafted: Record<number, GameState> = {
        0: {
            player: { x: 50, y: 450, w: 30, h: 30, vx: 0, vy: 0, grounded: false },
            goal: { x: 700, y: 130, w: 50, h: 50 },
            platforms: [
                { x: 0, y: 500, w: 140, h: 100, type: 'solid' },
                { x: 240, y: 400, w: 110, h: 20, type: 'solid' },
                { x: 430, y: 300, w: 110, h: 20, type: 'solid' },
                { x: 620, y: 200, w: 180, h: 20, type: 'solid' },
                { x: 250, y: 150, w: 90, h: 20, type: 'solid', hidden: true, id: 'trap_plat' }
            ],
            spikes: [
                { x: 280, y: 370, w: 30, h: 30, hidden: true, id: 'spike1' },
                { x: 475, y: 270, w: 30, h: 30, hidden: true, id: 'spike2' },
                { x: 680, y: -50, w: 40, h: 40, hidden: false, id: 'fallingspike', vy: 0 }
            ],
            triggers: [
                {
                    x: 140,
                    y: 0,
                    w: 90,
                    h: 600,
                    fired: false,
                    action: (state) => {
                        const s = state.spikes.find((s) => s.id === 'spike1');
                        if (s) s.hidden = false;
                    }
                },
                {
                    x: 330,
                    y: 0,
                    w: 90,
                    h: 600,
                    fired: false,
                    action: (state) => {
                        const s = state.spikes.find((s) => s.id === 'spike2');
                        if (s) s.hidden = false;
                    }
                },
                {
                    x: 530,
                    y: 0,
                    w: 90,
                    h: 600,
                    fired: false,
                    action: (state) => {
                        const s = state.spikes.find((s) => s.id === 'fallingspike');
                        if (s) s.vy = 900;
                        const p = state.platforms.find((p) => p.id === 'trap_plat');
                        if (p) p.hidden = false;
                    }
                }
            ],
            text: 'Level 1: Trust nothing.'
        },
        1: {
            player: { x: 50, y: 450, w: 30, h: 30, vx: 0, vy: 0, grounded: false },
            goal: { x: 700, y: 450, w: 50, h: 50 },
            platforms: [
                { x: 0, y: 500, w: 180, h: 100, type: 'solid' },
                { x: 300, y: 500, w: 180, h: 100, type: 'solid' },
                { x: 620, y: 500, w: 180, h: 100, type: 'solid' },
                { x: 335, y: 370, w: 115, h: 20, type: 'solid', hidden: true, id: 'saveplat' }
            ],
            spikes: [
                { x: 365, y: 470, w: 30, h: 30, hidden: true, id: 'spike1' },
                { x: 660, y: 470, w: 30, h: 30, hidden: true, id: 'spike2' }
            ],
            fakeGoals: [],
            triggers: [
                {
                    x: 200,
                    y: 0,
                    w: 80,
                    h: 600,
                    fired: false,
                    action: (state) => {
                        const s = state.spikes.find((s) => s.id === 'spike1');
                        if (s) s.hidden = false;
                    }
                },
                {
                    x: 500,
                    y: 0,
                    w: 80,
                    h: 600,
                    fired: false,
                    action: (state) => {
                        state.fakeGoals = [{ x: 700, y: 450, w: 50, h: 50 }];
                        state.goal.x = 365;
                        state.goal.y = 320;
                        const p = state.platforms.find((p) => p.id === 'saveplat');
                        if (p) p.hidden = false;
                        const s = state.spikes.find((s) => s.id === 'spike2');
                        if (s) s.hidden = false;
                    }
                }
            ],
            text: 'Level 2: The goal is a lie.'
        },
        2: {
            player: { x: 50, y: 450, w: 30, h: 30, vx: 0, vy: 0, grounded: false },
            goal: { x: 700, y: 100, w: 50, h: 50 },
            platforms: [
                { x: 0, y: 500, w: 140, h: 100, type: 'solid' },
                { x: 230, y: 400, w: 100, h: 20, type: 'solid' },
                { x: 390, y: 300, w: 100, h: 20, type: 'solid' },
                { x: 550, y: 200, w: 100, h: 20, type: 'solid' },
                { x: 650, y: 150, w: 150, h: 20, type: 'solid', id: 'goalplat' },
                { x: 390, y: 100, w: 20, h: 200, type: 'solid', hidden: true, id: 'inviswall' },
                { x: 180, y: 550, w: 620, h: 50, type: 'solid', hidden: true, id: 'saveplat' }
            ],
            spikes: [
                { x: 260, y: 370, w: 30, h: 30, hidden: true, id: 'spike1' },
                { x: 575, y: 170, w: 30, h: 30, hidden: true, id: 'spike2' },
                { x: 665, y: 120, w: 30, h: 30, hidden: true, id: 'spike3' }
            ],
            triggers: [
                {
                    x: 140,
                    y: 0,
                    w: 90,
                    h: 600,
                    fired: false,
                    action: (state) => {
                        const s = state.spikes.find((s) => s.id === 'spike1');
                        if (s) s.hidden = false;
                    }
                },
                {
                    x: 290,
                    y: 0,
                    w: 90,
                    h: 600,
                    fired: false,
                    action: (state) => {
                        const w = state.platforms.find((p) => p.id === 'inviswall');
                        const p = state.platforms.find((p) => p.id === 'saveplat');
                        if (w) w.hidden = false;
                        if (p) p.hidden = false;
                    }
                },
                {
                    x: 440,
                    y: 0,
                    w: 90,
                    h: 600,
                    fired: false,
                    action: (state) => {
                        const s = state.spikes.find((s) => s.id === 'spike2');
                        if (s) s.hidden = false;
                    }
                },
                {
                    x: 590,
                    y: 0,
                    w: 50,
                    h: 600,
                    fired: false,
                    action: (state) => {
                        const s = state.spikes.find((s) => s.id === 'spike3');
                        if (s) s.hidden = false;
                        state.goal.x = 400;
                        state.goal.y = 500;
                    }
                }
            ],
            text: 'Level 3: Precision and patience.'
        },
        3: {
            player: { x: 50, y: 450, w: 30, h: 30, vx: 0, vy: 0, grounded: false },
            goal: { x: 50, y: 100, w: 50, h: 50 },
            platforms: [
                { x: 0, y: 500, w: 150, h: 100, type: 'solid' },
                { x: 250, y: 500, w: 130, h: 100, type: 'solid' },
                { x: 500, y: 500, w: 130, h: 100, type: 'solid' },
                { x: 700, y: 390, w: 100, h: 20, type: 'solid' },
                { x: 500, y: 290, w: 100, h: 20, type: 'solid' },
                { x: 250, y: 190, w: 100, h: 20, type: 'solid' },
                { x: 0, y: 150, w: 150, h: 20, type: 'solid' }
            ],
            spikes: [
                { x: 710, y: 360, w: 80, h: 30, hidden: true, id: 'fakegoal_spike' },
                { x: 270, y: 470, w: 30, h: 30, hidden: true, id: 'floor_spike1' },
                { x: 520, y: 470, w: 30, h: 30, hidden: true, id: 'floor_spike2' },
                { x: 270, y: 160, w: 30, h: 30, hidden: true, id: 'top_spike' }
            ],
            fakeGoals: [{ x: 725, y: 340, w: 50, h: 50 }],
            triggers: [
                {
                    x: 650,
                    y: 0,
                    w: 50,
                    h: 600,
                    fired: false,
                    action: (state) => {
                        const s = state.spikes.find((s) => s.id === 'fakegoal_spike');
                        if (s) s.hidden = false;
                    }
                },
                {
                    x: 725,
                    y: 340,
                    w: 50,
                    h: 50,
                    fired: false,
                    action: (_state, engine) => {
                        engine.die();
                    }
                },
                {
                    x: 150,
                    y: 0,
                    w: 90,
                    h: 600,
                    fired: false,
                    action: (state) => {
                        const s = state.spikes.find((s) => s.id === 'floor_spike1');
                        if (s) s.hidden = false;
                    }
                },
                {
                    x: 390,
                    y: 0,
                    w: 90,
                    h: 600,
                    fired: false,
                    action: (state) => {
                        const s = state.spikes.find((s) => s.id === 'floor_spike2');
                        if (s) s.hidden = false;
                    }
                },
                {
                    x: 340,
                    y: 100,
                    w: 150,
                    h: 200,
                    fired: false,
                    action: (state) => {
                        const s = state.spikes.find((s) => s.id === 'top_spike');
                        if (s) s.hidden = false;
                    }
                }
            ],
            text: 'Level 4: The long way around.'
        }
    };

    return sanitizeLevel(handcrafted[index] ?? generateProceduralLevel(index));
};
