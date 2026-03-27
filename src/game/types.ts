export type Rect = { x: number, y: number, w: number, h: number };
export type Platform = Rect & { type: 'solid' | 'fake', hidden?: boolean, id?: string };
export type Spike = Rect & { hidden?: boolean, id?: string, vy?: number };
export type Trigger = Rect & {
    fired?: boolean,
    action: (state: GameState, engine: GameEngine) => void
};
export type GameState = {
    player: Rect & { vx: number, vy: number, grounded: boolean },
    goal: Rect,
    fakeGoals?: Rect[],
    platforms: Platform[],
    spikes: Spike[],
    triggers: Trigger[],
    text?: string
};
export type GameEngine = {
    die: () => void,
    win: () => void
};
