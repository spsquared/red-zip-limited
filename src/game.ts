import { Vec2d } from "./common";
import { hamGen } from "./hamgen";

export const canvas: HTMLCanvasElement = document.getElementById('canvas') as HTMLCanvasElement;
export const ctx = canvas.getContext('2d')!;

const resolution = 800;
canvas.width = resolution;
canvas.height = resolution;

export const grid: number[][] = [];
export const g = {
    w: 20,
    h: 20
};
export const c = {
    x: 0,
    y: 0,
    s: 1
};
export function setGridSize(w: number, h: number): void {
    g.w = w;
    g.h = h;
    grid.length = 0;
    grid.push(...Array(g.h).fill(0).map(() => Array(g.w).fill(0)));
    c.s = resolution / Math.max(g.w, g.h);
    c.x = (resolution - c.s * g.w) / 2 / c.s;
    c.y = (resolution - c.s * g.h) / 2 / c.s;
}
setGridSize(10, 8);

const game: {
    solution: Vec2d[]
    numbers: Vec2d[]
    path: Vec2d[]
    pathVisited: Set<number>
    pathHead: Vec2d
    pathCurrNum: number
    pathEndNum: number
    undoStack: Vec2d[]
    redoStack: Vec2d[]
} = {
    solution: [],
    numbers: [],
    path: [],
    pathVisited: new Set(),
    pathHead: new Vec2d(0, 0),
    pathCurrNum: 0,
    pathEndNum: 0,
    undoStack: [],
    redoStack: []
};

export async function generateGame(): Promise<void> {
    setGridSize(g.w, g.h);
    game.solution = await hamGen(g.w, g.h);
    // console.log(game.solution)
    const first = game.solution[0];
    grid[first.y][first.x] = 1;
    let j = 2;
    for (let i = 1, last = 0; i < game.solution.length - 1; i++) {
        if (Math.random() < 0.1 || i - last > 10) {
            const pos = game.solution[i];
            grid[pos.y][pos.x] = j++;
            last = i;
        }
    }
    const last = game.solution[game.solution.length - 1];
    grid[last.y][last.x] = j;
    game.path = [first];
    game.pathVisited = new Set([first.y * g.w + first.x]);
    game.pathHead = first;
    game.pathCurrNum = 1;
    game.pathEndNum = j;
    game.undoStack = [];
    game.redoStack = [];
    queueDraw();
}

let drawQueued = false;
export function queueDraw(): void {
    drawQueued = true;
};
function updateFrame(): void {
    // lerp animated head to real head
    if (game.path.length > 0) {
        const t = 0.4;
        const head = game.path[game.path.length - 1];
        game.pathHead = game.pathHead.mult(1 - t).add(head.mult(t));
        if (game.pathHead.sub(head).magnitude() < 0.01) game.pathHead = head;
        else queueDraw();
    }
}
function draw(): void {
    drawQueued = false;
    ctx.reset();
    // background
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, resolution, resolution);
    // transform to grid
    ctx.scale(c.s, c.s);
    ctx.translate(c.x, c.y);
    // grid background
    ctx.fillStyle = '#FFF';
    ctx.fillRect(0, 0, g.w, g.h);
    // path changes background color of grid
    drawPath('#0F03', 1, game.path, 'miter', 'square');
    // grid lines
    ctx.strokeStyle = '#AAA';
    ctx.lineWidth = 0.04;
    ctx.strokeRect(0, 0, g.w, g.h);
    ctx.lineWidth = 0.02;
    ctx.beginPath();
    for (let i = 1; i < g.w; i++) {
        ctx.moveTo(i, 0);
        ctx.lineTo(i, g.h);
    }
    for (let i = 1; i < g.h; i++) {
        ctx.moveTo(0, i);
        ctx.lineTo(g.w, i);
    }
    ctx.stroke();
    // path
    if (game.path.length > 1) {
        // real path head isn't drawn if it's ahead of the animated head
        // need directions, so 2 spots are needed
        const a = game.path[game.path.length - 1], b = game.path[game.path.length - 2];
        const offset = b.sub(a).dot(a.sub(game.pathHead)) < 0 ? 1 : 0;
        drawPath('#DAFC', 0.4, [...game.path.slice(0, game.path.length - offset), game.pathHead]);
    } else if (game.path.length > 0) {
        // edge case moment
        drawPath('#DAFC', 0.4, [game.path[0], game.pathHead]);
    }
    // trnaslate to center onto the grid cells
    ctx.save();
    ctx.translate(0.5, 0.5);
    // path head
    ctx.strokeStyle = '#D7F';
    ctx.lineWidth = 0.1;
    ctx.beginPath();
    ctx.moveTo(game.pathHead.x + 0.25, game.pathHead.y);
    ctx.arc(game.pathHead.x, game.pathHead.y, 0.25, 0, 2 * Math.PI);
    ctx.stroke();
    // numbers (have two colors in dashed outline)
    ctx.fillStyle = '#0BF';
    ctx.strokeStyle = '#AAA';
    const dashLength = 0.05 * Math.PI;
    ctx.setLineDash([dashLength, dashLength]);
    ctx.lineCap = 'butt';
    ctx.lineWidth = 0.05;
    ctx.font = '0.5px \'Apex Mk2\'';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.beginPath();
    const numberLocs: [number, number, string][] = [];
    for (let y = 0; y < g.h; y++) {
        for (let x = 0; x < g.w; x++) {
            if (grid[y][x] > 0) {
                ctx.moveTo(x + 0.4, y);
                ctx.arc(x, y, 0.4, 0, 2 * Math.PI);
                numberLocs.push([x, y, grid[y][x].toString()]);
            }
        }
    }
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#DDD';
    ctx.fillStyle = '#000';
    ctx.beginPath();
    const outlineDashAngle = dashLength / 0.4;
    const outLineDashOffset = [0.4 * Math.cos(outlineDashAngle), 0.4 * Math.sin(outlineDashAngle)]
    for (const [x, y, num] of numberLocs) {
        ctx.moveTo(x + outLineDashOffset[0], y + outLineDashOffset[1]);
        ctx.arc(x, y, 0.4, outlineDashAngle, outlineDashAngle + 2 * Math.PI);
        ctx.fillText(num, x, y);
    }
    ctx.stroke();
    // remove the transform from earlier
    ctx.restore();
    const pathOutlineLocs: Vec2d[] = [];
    // if path goes through a number, add an extra outline to the number
}
function drawPath(color: string, size: number, path: Vec2d[], lineJoin: CanvasLineJoin = 'round', lineCap: CanvasLineCap = 'round'): void {
    if (path.length == 0) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineJoin = lineJoin;
    ctx.lineCap = lineCap;
    ctx.setLineDash([]);
    ctx.save();
    ctx.translate(0.5, 0.5);
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (const p of path) {
        ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.restore();
}
window.addEventListener('load', () => queueDraw());
window.addEventListener('resize', () => queueDraw());
(async () => {
    while (true) {
        await new Promise<void>((resolve) => {
            window.requestAnimationFrame(() => {
                updateFrame();
                if (drawQueued) draw();
                resolve();
            });
        });
    }
})();

function move(dir: Vec2d, isUndo = false) {
    const head = game.path[game.path.length - 1];
    if (head !== undefined) {
        const pos = head.add(dir);
        if (pos.x >= 0 && pos.x < g.w && pos.y >= 0 && pos.y < g.h) {
            // can only move if neighbor
            if (pos.sub(head).magnitude() == 1) {
                if (game.path.length > 1 && pos.equals(game.path[game.path.length - 2])) {
                    // go back
                    const rem = game.path.pop()!;
                    game.pathVisited.delete(rem.y * g.w + rem.x);
                    if (grid[rem.y][rem.x] != 0) game.pathCurrNum = grid[rem.y][rem.x] - 1;
                    queueDraw();
                    if (!isUndo) {
                        game.undoStack.push(dir.negate());
                        game.redoStack.length = 0;
                    }
                } else if (!game.pathVisited.has(pos.y * g.w + pos.x) && (grid[pos.y][pos.x] == 0 || grid[pos.y][pos.x] == game.pathCurrNum + 1) && game.pathCurrNum != game.pathEndNum) {
                    game.path.push(pos);
                    game.pathVisited.add(pos.y * g.w + pos.x);
                    if (grid[pos.y][pos.x] != 0) game.pathCurrNum = grid[pos.y][pos.x];
                    queueDraw();
                    if (!isUndo) {
                        game.undoStack.push(dir.negate());
                        game.redoStack.length = 0;
                    }
                }
            }
        }
    }
}
function undo() {
    if (game.undoStack.length > 0) {
        const dir = game.undoStack.pop()!;
        move(dir, true);
        game.redoStack.push(dir.negate());
    }
}
function redo() {
    if (game.redoStack.length > 0) {
        const dir = game.redoStack.pop()!;
        move(dir, true);
        game.undoStack.push(dir.negate());
    }
}
function updateMouse() {
    if (mouse.buttons.has(0) || mouse.touchActive) {
        const pos = mouse.gridPos;
        const head = game.path[game.path.length - 1];
        if (head !== undefined) move(pos.sub(head));
    }
}
function updateKeyboard() {

}
function updateKeypress(e: KeyboardEvent) {
    const key = e.key.toUpperCase();
    if ((e.target instanceof HTMLElement && e.target.matches('input'))
        || ((key == 'I' || key == 'C') && e.ctrlKey && e.shiftKey && !e.altKey)
        || ((key == '=' || key == '-') && e.ctrlKey && !e.shiftKey && !e.altKey)) return;
    e.preventDefault();
    if (key == 'W' || key == 'ARROWUP') move(Vec2d.j.mult(-1));
    else if (key == 'S' || key == 'ARROWDOWN') move(Vec2d.j);
    else if (key == 'A' || key == 'ARROWLEFT') move(Vec2d.i.mult(-1));
    else if (key == 'D' || key == 'ARROWRIGHT') move(Vec2d.i);
    else if (key == 'Z') undo();
    else if (key == 'Y' || (key == 'Z' && e.shiftKey)) redo();
    else if (key == 'R' && e.shiftKey) generateGame();
}

let canvasRect: DOMRect;
const keys: Set<string> = new Set();
const mouse: {
    pos: Vec2d
    gridPos: Vec2d
    readonly buttons: Set<number>
    touchActive: boolean
} = {
    pos: new Vec2d(0, 0),
    gridPos: new Vec2d(0, 0),
    buttons: new Set(),
    touchActive: false
};
function onMouseMove(e: MouseEvent | Touch) {
    mouse.pos = new Vec2d(e.clientX - canvasRect.left - 4, e.clientY - canvasRect.top - 4);
    const adjustedScale = c.s * (canvasRect.height - 8) / resolution;
    mouse.gridPos = new Vec2d(
        Math.floor((e.clientX - canvasRect.left - 4 - c.x * adjustedScale) / adjustedScale),
        Math.floor((e.clientY - canvasRect.top - 4 - c.y * adjustedScale) / adjustedScale)
    );
    console.log(mouse.pos, mouse.gridPos);
    updateMouse();
}
document.addEventListener('keydown', (e) => {
    keys.add(e.key);
    updateKeypress(e);
    updateKeyboard();
});
document.addEventListener('keyup', (e) => {
    keys.delete(e.key);
});
document.addEventListener('mousedown', (e) => {
    mouse.buttons.add(e.button);
    onMouseMove(e);
});
document.addEventListener('mouseup', (e) => {
    mouse.buttons.delete(e.button);
});
document.addEventListener('mousemove', (e) => {
    onMouseMove(e);
});
document.addEventListener('touchstart', () => {
    mouse.touchActive = true;
});
document.addEventListener('touchend', () => {
    mouse.touchActive = false;
});
document.addEventListener('touchend', () => {
    mouse.touchActive = false;
});
canvas.addEventListener('touchmove', (e) => {
    onMouseMove(e.touches[0]);
    e.preventDefault();
});
document.addEventListener('blur', () => {
    // don't let game think stuff is held down when it isn't
    keys.clear();
    mouse.buttons.clear();
});
window.addEventListener('load', () => canvasRect = canvas.getBoundingClientRect());
window.addEventListener('resize', () => canvasRect = canvas.getBoundingClientRect());