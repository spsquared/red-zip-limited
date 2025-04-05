import { Vec2d } from "./common";
import { hamGen } from "./hamgen";

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const timer = document.getElementById('timer') as HTMLDivElement;
const canvasShimmer = document.getElementById('canvasShimmer') as HTMLDivElement;

const resolution = 800;
canvas.width = resolution;
canvas.height = resolution;

const grid: number[][] = [];
const wallGrid: number[][] = [];
const g = {
    w: 20,
    h: 20
};
const c = {
    x: 0,
    y: 0,
    s: 1
};
function setGridSize(w: number, h: number): void {
    g.w = w;
    g.h = h;
    grid.length = 0;
    grid.push(...Array(g.h).fill(0).map(() => Array(g.w).fill(0)));
    wallGrid.length = 0;
    wallGrid.push(...Array(g.h).fill(0).map(() => Array(g.w).fill(0)));
    c.s = resolution / Math.max(g.w, g.h);
    c.x = (resolution - c.s * g.w) / 2 / c.s;
    c.y = (resolution - c.s * g.h) / 2 / c.s;
    queueDraw();
}

const game = {
    solution: [] as Vec2d[],
    numbers: [] as Vec2d[],
    path: [] as Vec2d[],
    pathVisited: new Set<number>(),
    pathHead: new Vec2d(0, 0),
    pathCurrNum: 0,
    pathEndNum: 0,
    startTime: 0,
    endTime: 0,
    undoStack: [] as Vec2d[],
    redoStack: [] as Vec2d[],
    showSolutionIndex: 0,
    showingSolution: false,
    showSolutionStart: 0,
    solved: false
};

export async function generateGame(w: number, h: number, walls: boolean = true): Promise<void> {
    game.showingSolution = false;
    game.solution = await hamGen(w, h);
    setGridSize(w, h);
    game.startTime = performance.now();
    game.endTime = -1;
    timer.style.color = '';
    // first & last positions are fixed, other numbers generated at roughly even intervals
    const first = game.solution[0];
    grid[first.y][first.x] = 1;
    let j = 2;
    for (let i = 1, last = 0; i < game.solution.length - 1; i++) {
        if ((Math.random() < 0.05 || i - last > 10)) {
            const pos = game.solution[i];
            grid[pos.y][pos.x] = j++;
            last = i;
        }
    }
    const last = game.solution[game.solution.length - 1];
    grid[last.y][last.x] = j;
    // generate walls using a bitmask (first/last don't get any this method)
    if (walls) {
        for (let i = 2; i < game.solution.length; i++) {
            if (Math.random() < 0.5) {
                // don't generate walls in the path
                const curr = game.solution[i - 1];
                const dirIndex = Math.floor(Math.random() * 4);
                const dir = Vec2d.dirs[dirIndex];
                if (!dir.equals(game.solution[i - 2].sub(curr)) && !dir.equals(game.solution[i].sub(curr))) {
                    // add to self and the neighbor (2-directional), don't put any off the map
                    const opp = curr.add(dir);
                    if (opp.x >= 0 && opp.x < g.w && opp.y >= 0 && opp.y < g.h) {
                        wallGrid[curr.y][curr.x] |= 1 << dirIndex;
                        wallGrid[opp.y][opp.x] |= 1 << ((dirIndex + 2) % 4);
                    }
                }
            }
        }
    }
    game.pathEndNum = j;
    resetGame();
    queueDraw();
}
export function resetGame(): void {
    game.showingSolution = false;
    game.solved = false;
    canvasShimmer.style.display = '';
    // start at first
    const first = game.solution[0];
    game.path = [first];
    game.pathVisited = new Set([first.y * g.w + first.x]);
    game.pathHead = first;
    game.pathCurrNum = 1;
    game.undoStack = [];
    game.redoStack = [];
    queueDraw();
    updateTimer();
}
export function showSolution(): void {
    if (game.showingSolution) {
        // skip to end
        game.showSolutionStart = -Infinity;
    } else {
        game.showSolutionIndex = 0;
        game.showSolutionStart = performance.now();
        game.showingSolution = true;
    }
}
function checkSolution(): void {
    // if the grid is filled, it must be the right order
    if (game.path.length == game.solution.length) {
        game.solved = true;
        if (game.endTime == -1) game.endTime = performance.now();
        canvasShimmer.style.display = 'block';
        timer.style.color = '#0A0';
    }
}

let drawQueued = false;
export function queueDraw(): void {
    drawQueued = true;
};
function updateFrame(): void {
    // lerp animated head to real head
    const path = game.showingSolution ? game.solution.slice(0, game.showSolutionIndex) : game.path;
    if (path.length > 0) {
        const t = 0.4;
        const head = path[path.length - 1];
        game.pathHead = game.pathHead.mult(1 - t).add(head.mult(t));
        if (game.pathHead.sub(head).magnitude() < 0.01) game.pathHead = head;
        else queueDraw();
    }
    // show solution by time
    if (game.showingSolution) game.showSolutionIndex = Math.min(game.solution.length, Math.floor((performance.now() - game.showSolutionStart) / 100));
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
    const path = game.showingSolution ? game.solution.slice(0, game.showSolutionIndex) : game.path;
    drawPath('#0F03', 1, path, 'miter', 'square');
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
    // path (+ solution path)
    const pathColor = game.showingSolution || game.solved ? '#0D0C' : '#F55C';
    if (path.length > 1) {
        // real path head isn't drawn if it's ahead of the animated head
        // need directions, so 2 spots are needed
        const a = path[path.length - 1], b = path[path.length - 2];
        const offset = b.sub(a).dot(a.sub(game.pathHead)) < 0 ? 1 : 0;
        drawPath(pathColor, 0.4, [...path.slice(0, path.length - offset), game.pathHead]);
    } else if (path.length > 0) {
        // edge case moment
        drawPath(pathColor, 0.4, [path[0], game.pathHead]);
    }
    // trnaslate to center onto the grid cells
    ctx.translate(0.5, 0.5);
    // path head
    ctx.strokeStyle = game.showingSolution || game.solved ? '#0F0' : '#F00';
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
    const r = 0.35;
    const numberLocs: [number, number, string][] = [];
    for (let y = 0; y < g.h; y++) {
        for (let x = 0; x < g.w; x++) {
            if (grid[y][x] > 0) {
                ctx.moveTo(x + r, y);
                ctx.arc(x, y, r, 0, 2 * Math.PI);
                numberLocs.push([x, y, grid[y][x].toString()]);
            }
        }
    }
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#DDD';
    ctx.fillStyle = '#000';
    ctx.beginPath();
    const outlineDashAngle = dashLength / r;
    const outLineDashOffset = [r * Math.cos(outlineDashAngle), r * Math.sin(outlineDashAngle)]
    for (const [x, y, num] of numberLocs) {
        ctx.moveTo(x + outLineDashOffset[0], y + outLineDashOffset[1]);
        ctx.arc(x, y, r, outlineDashAngle, outlineDashAngle + 2 * Math.PI);
        ctx.fillText(num, x, y);
    }
    ctx.stroke();
    // if the path goes through a number, highlight it
    ctx.setLineDash([]);
    ctx.strokeStyle = '#05F';
    ctx.lineWidth = 0.1;
    ctx.beginPath();
    for (const p of path) {
        if (grid[p.y][p.x] > 0) {
            ctx.moveTo(p.x + r, p.y);
            ctx.arc(p.x, p.y, r, 0, 2 * Math.PI);
        }
    }
    ctx.stroke();
    // remove the transform from earlier
    ctx.translate(-0.5, -0.5);
    // draw walls
    ctx.strokeStyle = '#000';
    ctx.lineCap = 'square';
    ctx.beginPath();
    for (let y = 0; y < g.h; y++) {
        for (let x = 0; x < g.w; x++) {
            // microoptimization #1
            if (wallGrid[y][x] == 0) continue;
            // #2: only draw top/left walls since bottom/right will be drawn by adjacent squares
            if (wallGrid[y][x] & 0b0001) {
                ctx.moveTo(x, y);
                ctx.lineTo(x, y + 1);
            }
            if (wallGrid[y][x] & 0b0010) {
                ctx.moveTo(x, y);
                ctx.lineTo(x + 1, y);
            }
            // if (wallGrid[y][x] & 0b0100) {
            //     ctx.moveTo(x + 1, y);
            //     ctx.lineTo(x + 1, y + 1);
            // }
            // if (wallGrid[y][x] & 0b1000) {
            //     ctx.moveTo(x, y + 1);
            //     ctx.lineTo(x + 1, y + 1);
            // }
        }
    }
    ctx.stroke();
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

function updateTimer() {
    const t = (game.endTime > 0 ? game.endTime : performance.now()) - game.startTime;
    const h = (t / 3600000).toFixed(0);
    const m = (t / 60000).toFixed(0).padStart(2, '0');
    const s = (t / 1000).toFixed(0).padStart(2, '0');
    timer.innerHTML = [...`${h != '0' ? h + ':' : ''}${m}:${s}`].reduce((html, char) => html + `<span>${char}</span>`, '');
}
(() => setInterval(() => updateTimer(), 100))();

window.addEventListener('load', () => setGridSize(10, 10));
window.addEventListener('resize', () => queueDraw());

export function move(dir: Vec2d, isUndo = false) {
    const head = game.path[game.path.length - 1];
    if (head !== undefined && !game.showingSolution && !game.solved) {
        const pos = head.add(dir);
        if (pos.x >= 0 && pos.x < g.w && pos.y >= 0 && pos.y < g.h) {
            // can only move if neighbor
            if (pos.sub(head).magnitude() == 1) {
                if (game.path.length > 1 && pos.equals(game.path[game.path.length - 2])) {
                    // go back
                    const rem = game.path.pop()!;
                    game.pathVisited.delete(rem.y * g.w + rem.x);
                    if (grid[rem.y][rem.x] != 0) game.pathCurrNum = grid[rem.y][rem.x] - 1;
                    checkSolution();
                    queueDraw();
                    if (!isUndo) {
                        game.undoStack.push(dir.negate());
                        game.redoStack.length = 0;
                    }
                } else if (!game.pathVisited.has(pos.y * g.w + pos.x)
                    && (grid[pos.y][pos.x] == 0 || grid[pos.y][pos.x] == game.pathCurrNum + 1)
                    && game.pathCurrNum != game.pathEndNum
                    && ((wallGrid[head.y][head.x] >> Vec2d.dirs.findIndex((v) => v.equals(dir))) & 1) == 0) {
                    // go forward
                    game.path.push(pos);
                    game.pathVisited.add(pos.y * g.w + pos.x);
                    if (grid[pos.y][pos.x] != 0) game.pathCurrNum = grid[pos.y][pos.x];
                    checkSolution();
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
function updateMouseMove(e: MouseEvent | Touch) {
    mouse.pos = new Vec2d(e.clientX - canvasRect.left - 4, e.clientY - canvasRect.top - 4);
    const adjustedScale = c.s * (canvasRect.height - 8) / resolution;
    mouse.gridPos = new Vec2d(
        Math.floor((e.clientX - canvasRect.left - 4 - c.x * adjustedScale) / adjustedScale),
        Math.floor((e.clientY - canvasRect.top - 4 - c.y * adjustedScale) / adjustedScale)
    );
    updateMouse();
}
function updateKeypress(e: KeyboardEvent) {
    const key = e.key.toUpperCase();
    if ((e.target instanceof HTMLElement && e.target.matches('input'))
        || ((key == 'I' || key == 'C') && e.ctrlKey && e.shiftKey && !e.altKey)
        || ((key == '=' || key == '-') && e.ctrlKey && !e.shiftKey && !e.altKey)
        || key == 'F11' || key == 'F12') return;
    e.preventDefault();
    if (key == 'W' || key == 'ARROWUP') move(Vec2d.j.mult(-1));
    else if (key == 'S' || key == 'ARROWDOWN') move(Vec2d.j);
    else if (key == 'A' || key == 'ARROWLEFT') move(Vec2d.i.mult(-1));
    else if (key == 'D' || key == 'ARROWRIGHT') move(Vec2d.i);
    else if (key == 'Z') undo();
    else if (key == 'Y' || (key == 'Z' && e.shiftKey)) redo();
    else if (key == 'R' && e.shiftKey) resetGame();
}

let canvasRect: DOMRect = canvas.getBoundingClientRect();
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
    updateMouseMove(e);
});
document.addEventListener('mouseup', (e) => {
    mouse.buttons.delete(e.button);
});
document.addEventListener('mousemove', (e) => {
    updateMouseMove(e);
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
    updateMouseMove(e.touches[0]);
    e.preventDefault();
});
document.addEventListener('blur', () => {
    // don't let game think stuff is held down when it isn't
    keys.clear();
    mouse.buttons.clear();
});
window.addEventListener('load', () => canvasRect = canvas.getBoundingClientRect());
window.addEventListener('resize', () => canvasRect = canvas.getBoundingClientRect());