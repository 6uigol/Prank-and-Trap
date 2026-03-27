import { GameState } from './types';

export const NUM_LEVELS = 104;

function generateProceduralLevel(index: number): GameState {
    const type = index % 10;
    const diff = Math.floor(index / 10);
    const text = `Level ${index + 1}: ${['Watch your head', 'Watch your step', 'Invisible maze', 'Catch me if you can', 'Trust issues', 'Leap of faith', 'Incoming!', 'The Box', 'Crusher', 'Falling Goal'][type]}`;

    let state: GameState = {
        player: { x: 50, y: 450, w: 30, h: 30, vx: 0, vy: 0, grounded: false },
        goal: { x: 700, y: 450, w: 50, h: 50 },
        platforms: [{ x: 0, y: 500, w: 800, h: 100, type: 'solid' }],
        spikes: [],
        triggers: [],
        fakeGoals: [],
        text
    };

    switch (type) {
        case 0: // Ceiling spikes
            const numCeilSpikes = Math.min(3 + diff, 10);
            for (let i = 0; i < numCeilSpikes; i++) {
                const sx = 200 + i * (400 / numCeilSpikes);
                state.spikes.push({ x: sx, y: -50, w: 40, h: 40, hidden: false, id: `s${i}`, vy: 0 });
                state.triggers.push({
                    x: sx - 50, y: 0, w: 20, h: 600, fired: false,
                    action: (s) => { const sp = s.spikes.find(x => x.id === `s${i}`); if (sp) sp.vy = 500 + diff * 50; }
                });
            }
            break;
        case 1: // Floor spikes
            const numFloorSpikes = Math.min(3 + diff, 10);
            for (let i = 0; i < numFloorSpikes; i++) {
                const sx = 250 + i * (350 / numFloorSpikes);
                state.spikes.push({ x: sx, y: 470, w: 30, h: 30, hidden: true, id: `s${i}` });
                state.triggers.push({
                    x: sx - 60, y: 0, w: 20, h: 600, fired: false,
                    action: (s) => { const sp = s.spikes.find(x => x.id === `s${i}`); if (sp) sp.hidden = false; }
                });
            }
            break;
        case 2: // Invisible walls
            const numWalls = Math.min(2 + diff, 6);
            for (let i = 0; i < numWalls; i++) {
                const wx = 300 + i * (400 / numWalls);
                state.platforms.push({ x: wx, y: 350, w: 20, h: 150, type: 'solid', hidden: true, id: `w${i}` });
                state.triggers.push({
                    x: wx - 40, y: 0, w: 20, h: 600, fired: false,
                    action: (s) => { const w = s.platforms.find(x => x.id === `w${i}`); if (w) w.hidden = false; }
                });
            }
            break;
        case 3: // Teleporting goal
            state.triggers.push({
                x: 600, y: 0, w: 20, h: 600, fired: false,
                action: (s) => { s.goal.x = 50; s.goal.y = 100; }
            });
            state.platforms.push(
                { x: 0, y: 380, w: 100, h: 20, type: 'solid', hidden: true, id: 'p1' },
                { x: 150, y: 260, w: 100, h: 20, type: 'solid', hidden: true, id: 'p2' },
                { x: 0, y: 150, w: 100, h: 20, type: 'solid', hidden: true, id: 'p3' }
            );
            state.triggers.push({
                x: 100, y: 0, w: 20, h: 600, fired: false,
                action: (s) => { 
                    const p1 = s.platforms.find(x => x.id === 'p1'); if (p1) p1.hidden = false; 
                    const p2 = s.platforms.find(x => x.id === 'p2'); if (p2) p2.hidden = false; 
                    const p3 = s.platforms.find(x => x.id === 'p3'); if (p3) p3.hidden = false; 
                }
            });
            break;
        case 4: // Fake goals
            state.fakeGoals = [];
            const numGoals = Math.min(4 + diff, 8);
            for (let i = 0; i < numGoals; i++) {
                const gx = 150 + i * (500 / numGoals);
                state.fakeGoals.push({ x: gx, y: 450, w: 50, h: 50 });
                state.triggers.push({
                    x: gx, y: 450, w: 50, h: 50, fired: false,
                    action: (s, e) => e.die()
                });
            }
            state.goal.x = 700;
            break;
        case 5: // Leap of faith
            state.platforms = [
                { x: 0, y: 500, w: 200, h: 100, type: 'solid' },
                { x: 200, y: 500, w: 400, h: 100, type: 'solid', id: 'f1' },
                { x: 600, y: 500, w: 200, h: 100, type: 'solid' },
                { x: 200, y: 580, w: 400, h: 20, type: 'solid', hidden: true, id: 'f2' }
            ];
            state.triggers.push({
                x: 200, y: 0, w: 20, h: 600, fired: false,
                action: (s) => {
                    const f1 = s.platforms.find(x => x.id === 'f1'); if (f1) f1.hidden = true;
                    const f2 = s.platforms.find(x => x.id === 'f2'); if (f2) f2.hidden = false;
                }
            });
            break;
        case 6: // Wave of spikes
            const numSpikes = Math.min(4 + diff, 10);
            for(let i=0; i<numSpikes; i++) {
                const sx = 200 + i * (400 / numSpikes);
                state.spikes.push({ x: sx, y: 470, w: 30, h: 30, hidden: true, id: `sw${i}` });
                state.triggers.push({
                    x: sx - 100, y: 0, w: 20, h: 600, fired: false,
                    action: (s) => {
                        const sp = s.spikes.find(x => x.id === `sw${i}`);
                        if (sp) sp.hidden = false;
                    }
                });
            }
            break;
        case 7: // The Box
            state.platforms.push(
                { x: 450, y: 350, w: 20, h: 150, type: 'solid', hidden: true, id: 'b1' },
                { x: 550, y: 350, w: 20, h: 150, type: 'solid', hidden: true, id: 'b2' },
                { x: 450, y: 350, w: 120, h: 20, type: 'solid', hidden: true, id: 'b3' }
            );
            state.spikes.push({ x: 495, y: 370, w: 30, h: 30, hidden: true, id: 'bspike', vy: 0 });
            state.triggers.push({
                x: 400, y: 0, w: 20, h: 600, fired: false,
                action: (s) => {
                    const b1 = s.platforms.find(x => x.id === 'b1'); if (b1) b1.hidden = false;
                    const b2 = s.platforms.find(x => x.id === 'b2'); if (b2) b2.hidden = false;
                    const b3 = s.platforms.find(x => x.id === 'b3'); if (b3) b3.hidden = false;
                    const sp = s.spikes.find(x => x.id === 'bspike'); 
                    if (sp) { sp.hidden = false; sp.vy = 300 + diff * 50; }
                }
            });
            break;
        case 8: // Crusher
            state.spikes.push({ x: 200, y: -200, w: 400, h: 50, hidden: false, id: 'crush', vy: 0 });
            state.triggers.push({
                x: 150, y: 0, w: 20, h: 600, fired: false,
                action: (s) => {
                    const c = s.spikes.find(x => x.id === 'crush'); if (c) c.vy = 300 + diff * 50;
                }
            });
            break;
        case 9: // Falling Goal
            state.goal = { x: 700, y: 100, w: 50, h: 50 };
            state.platforms.push({ x: 650, y: 150, w: 150, h: 20, type: 'solid', id: 'gplat' });
            state.triggers.push({
                x: 400, y: 0, w: 20, h: 600, fired: false,
                action: (s) => {
                    const gp = s.platforms.find(x => x.id === 'gplat'); if (gp) gp.hidden = true;
                    s.goal.y = 450;
                    const sp = s.spikes.find(x => x.id === 'gspike'); if (sp) sp.hidden = false;
                }
            });
            state.spikes.push({ x: 720, y: 470, w: 30, h: 30, hidden: true, id: 'gspike' });
            break;
    }

    return state;
}

export const getLevel = (index: number): GameState => {
    switch (index) {
        case 0:
            return {
                player: { x: 50, y: 450, w: 30, h: 30, vx: 0, vy: 0, grounded: false },
                goal: { x: 700, y: 150, w: 50, h: 50 },
                platforms: [
                    { x: 0, y: 500, w: 150, h: 100, type: 'solid' },
                    { x: 250, y: 400, w: 120, h: 20, type: 'solid' },
                    { x: 450, y: 300, w: 120, h: 20, type: 'solid' },
                    { x: 650, y: 200, w: 150, h: 20, type: 'solid' },
                    { x: 250, y: 150, w: 100, h: 20, type: 'solid', hidden: true, id: 'trap_plat' }
                ],
                spikes: [
                    { x: 295, y: 370, w: 30, h: 30, hidden: true, id: 'spike1' },
                    { x: 495, y: 270, w: 30, h: 30, hidden: true, id: 'spike2' },
                    { x: 680, y: -50, w: 40, h: 40, hidden: false, id: 'fallingspike', vy: 0 }
                ],
                triggers: [
                    {
                        x: 150, y: 0, w: 100, h: 600,
                        fired: false,
                        action: (state) => {
                            const s = state.spikes.find(s => s.id === 'spike1');
                            if (s) s.hidden = false;
                        }
                    },
                    {
                        x: 350, y: 0, w: 100, h: 600,
                        fired: false,
                        action: (state) => {
                            const s = state.spikes.find(s => s.id === 'spike2');
                            if (s) s.hidden = false;
                        }
                    },
                    {
                        x: 550, y: 0, w: 100, h: 600,
                        fired: false,
                        action: (state) => {
                            const s = state.spikes.find(s => s.id === 'fallingspike');
                            if (s) s.vy = 800;
                            const p = state.platforms.find(p => p.id === 'trap_plat');
                            if (p) p.hidden = false;
                        }
                    }
                ],
                text: "Level 1: Trust nothing."
            };
        case 1:
            return {
                player: { x: 50, y: 450, w: 30, h: 30, vx: 0, vy: 0, grounded: false },
                goal: { x: 700, y: 450, w: 50, h: 50 },
                platforms: [
                    { x: 0, y: 500, w: 200, h: 100, type: 'solid' },
                    { x: 300, y: 500, w: 200, h: 100, type: 'solid' },
                    { x: 600, y: 500, w: 200, h: 100, type: 'solid' },
                    { x: 350, y: 380, w: 100, h: 20, type: 'solid', hidden: true, id: 'saveplat' }
                ],
                spikes: [
                    { x: 385, y: 470, w: 30, h: 30, hidden: true, id: 'spike1' },
                    { x: 650, y: 470, w: 30, h: 30, hidden: true, id: 'spike2' }
                ],
                fakeGoals: [],
                triggers: [
                    {
                        x: 200, y: 0, w: 100, h: 600,
                        fired: false,
                        action: (state) => {
                            const s = state.spikes.find(s => s.id === 'spike1');
                            if (s) s.hidden = false;
                        }
                    },
                    {
                        x: 500, y: 0, w: 100, h: 600,
                        fired: false,
                        action: (state) => {
                            // Goal teleports but leaves a fake goal so player knows it moved
                            state.fakeGoals = [{ x: 700, y: 450, w: 50, h: 50 }];
                            state.goal.x = 375;
                            state.goal.y = 330;
                            const p = state.platforms.find(p => p.id === 'saveplat');
                            if (p) p.hidden = false;
                            const s = state.spikes.find(s => s.id === 'spike2');
                            if (s) s.hidden = false;
                        }
                    }
                ],
                text: "Level 2: The goal is a lie."
            };
        case 2:
            return {
                player: { x: 50, y: 450, w: 30, h: 30, vx: 0, vy: 0, grounded: false },
                goal: { x: 700, y: 100, w: 50, h: 50 },
                platforms: [
                    { x: 0, y: 500, w: 150, h: 100, type: 'solid' },
                    { x: 250, y: 400, w: 100, h: 20, type: 'solid' },
                    { x: 400, y: 300, w: 100, h: 20, type: 'solid' },
                    { x: 550, y: 200, w: 100, h: 20, type: 'solid' },
                    { x: 650, y: 150, w: 150, h: 20, type: 'solid', id: 'goalplat' },
                    { x: 400, y: 100, w: 20, h: 200, type: 'solid', hidden: true, id: 'inviswall' },
                    { x: 200, y: 550, w: 600, h: 50, type: 'solid', hidden: true, id: 'saveplat' }
                ],
                spikes: [
                    { x: 285, y: 370, w: 30, h: 30, hidden: true, id: 'spike1' },
                    { x: 585, y: 170, w: 30, h: 30, hidden: true, id: 'spike2' },
                    { x: 660, y: 120, w: 30, h: 30, hidden: true, id: 'spike3' }
                ],
                triggers: [
                    {
                        x: 150, y: 0, w: 100, h: 600,
                        fired: false,
                        action: (state) => {
                            const s = state.spikes.find(s => s.id === 'spike1');
                            if (s) s.hidden = false;
                        }
                    },
                    {
                        x: 300, y: 0, w: 100, h: 600,
                        fired: false,
                        action: (state) => {
                            const w = state.platforms.find(p => p.id === 'inviswall');
                            if (w) w.hidden = false;
                            const p = state.platforms.find(p => p.id === 'saveplat');
                            if (p) p.hidden = false;
                        }
                    },
                    {
                        x: 450, y: 0, w: 100, h: 600,
                        fired: false,
                        action: (state) => {
                            const s = state.spikes.find(s => s.id === 'spike2');
                            if (s) s.hidden = false;
                        }
                    },
                    {
                        x: 600, y: 0, w: 50, h: 600,
                        fired: false,
                        action: (state) => {
                            const s = state.spikes.find(s => s.id === 'spike3');
                            if (s) s.hidden = false;
                            state.goal.x = 400;
                            state.goal.y = 500;
                        }
                    }
                ],
                text: "Level 3: Precision and patience."
            };
        case 3:
            return {
                player: { x: 50, y: 450, w: 30, h: 30, vx: 0, vy: 0, grounded: false },
                goal: { x: 50, y: 100, w: 50, h: 50 }, 
                platforms: [
                    { x: 0, y: 500, w: 150, h: 100, type: 'solid' },
                    { x: 250, y: 500, w: 150, h: 100, type: 'solid' },
                    { x: 500, y: 500, w: 150, h: 100, type: 'solid' },
                    { x: 700, y: 400, w: 100, h: 20, type: 'solid' },
                    { x: 500, y: 300, w: 100, h: 20, type: 'solid' },
                    { x: 250, y: 200, w: 100, h: 20, type: 'solid' },
                    { x: 0, y: 150, w: 150, h: 20, type: 'solid' }
                ],
                spikes: [
                    { x: 710, y: 370, w: 80, h: 30, hidden: true, id: 'fakegoal_spike' },
                    { x: 280, y: 470, w: 30, h: 30, hidden: true, id: 'floor_spike1' },
                    { x: 530, y: 470, w: 30, h: 30, hidden: true, id: 'floor_spike2' },
                    { x: 280, y: 170, w: 30, h: 30, hidden: true, id: 'top_spike' }
                ],
                fakeGoals: [
                    { x: 725, y: 350, w: 50, h: 50 }
                ],
                triggers: [
                    {
                        x: 650, y: 0, w: 50, h: 600,
                        fired: false,
                        action: (state) => {
                            const s = state.spikes.find(s => s.id === 'fakegoal_spike');
                            if (s) s.hidden = false;
                        }
                    },
                    {
                        x: 725, y: 350, w: 50, h: 50,
                        fired: false,
                        action: (state, engine) => {
                            engine.die();
                        }
                    },
                    {
                        x: 150, y: 0, w: 100, h: 600,
                        fired: false,
                        action: (state) => {
                            const s = state.spikes.find(s => s.id === 'floor_spike1');
                            if (s) s.hidden = false;
                        }
                    },
                    {
                        x: 400, y: 0, w: 100, h: 600,
                        fired: false,
                        action: (state) => {
                            const s = state.spikes.find(s => s.id === 'floor_spike2');
                            if (s) s.hidden = false;
                        }
                    },
                    {
                        x: 350, y: 100, w: 150, h: 200,
                        fired: false,
                        action: (state) => {
                            const s = state.spikes.find(s => s.id === 'top_spike');
                            if (s) s.hidden = false;
                        }
                    }
                ],
                text: "Level 4: The long way around."
            };
        default:
            return generateProceduralLevel(index);
    }
};
