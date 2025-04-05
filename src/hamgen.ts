import { Vec2d } from "./common";

const loadingCover = document.getElementById('canvasLoadingCover') as HTMLDivElement;

const worker = new Worker(new URL('./hamgenWorker', import.meta.url), { type: 'module' });

const queue = new Set<Promise<any>>();
export async function hamGen(w: number, h: number): Promise<Vec2d[]> {
    const wait = Promise.all(queue);
    const path = new Promise<Vec2d[]>(async (resolve) => {
        await wait;
        loadingCover.style.opacity = '1';
        worker.postMessage([w, h]);
        worker.onmessage = (e) => {
            resolve(e.data.map((p: Vec2d) => new Vec2d(p.x, p.y)));
            loadingCover.style.opacity = '0';
            queue.delete(path);
        }
    });
    queue.add(path);
    return await path;
}

export function* naive(w: number, h: number): Generator<Vec2d[], void> {
    const target = w * h;
    const start = new Vec2d(Math.floor(Math.random() * w), Math.floor(Math.random() * h));
    const visited: Set<number> = new Set([start.y * w + start.x]);
    type StackItem = [Vec2d, StackItem | null, number, number];
    const stack: StackItem[] = [[start, null, 1, 0]];
    // lol "optimization"
    const randomDirs = [
        [Vec2d.i.mult(-1), Vec2d.j.mult(-1), Vec2d.i, Vec2d.j],
        [Vec2d.i.mult(-1), Vec2d.j.mult(-1), Vec2d.j, Vec2d.i],
        [Vec2d.i.mult(-1), Vec2d.i, Vec2d.j.mult(-1), Vec2d.j],
        [Vec2d.i.mult(-1), Vec2d.i, Vec2d.j, Vec2d.j.mult(-1)],
        [Vec2d.i.mult(-1), Vec2d.j, Vec2d.j.mult(-1), Vec2d.i],
        [Vec2d.i.mult(-1), Vec2d.j, Vec2d.i, Vec2d.j.mult(-1)],
        [Vec2d.j.mult(-1), Vec2d.i.mult(-1), Vec2d.i, Vec2d.j],
        [Vec2d.j.mult(-1), Vec2d.i.mult(-1), Vec2d.j, Vec2d.i],
        [Vec2d.j.mult(-1), Vec2d.i, Vec2d.i.mult(-1), Vec2d.j],
        [Vec2d.j.mult(-1), Vec2d.i, Vec2d.j, Vec2d.i.mult(-1)],
        [Vec2d.j.mult(-1), Vec2d.j, Vec2d.i.mult(-1), Vec2d.i],
        [Vec2d.j.mult(-1), Vec2d.j, Vec2d.i, Vec2d.i.mult(-1)],
        [Vec2d.i, Vec2d.i.mult(-1), Vec2d.j.mult(-1), Vec2d.j],
        [Vec2d.i, Vec2d.i.mult(-1), Vec2d.j, Vec2d.j.mult(-1)],
        [Vec2d.i, Vec2d.j.mult(-1), Vec2d.i.mult(-1), Vec2d.j],
        [Vec2d.i, Vec2d.j.mult(-1), Vec2d.j, Vec2d.i.mult(-1)],
        [Vec2d.i, Vec2d.j, Vec2d.i.mult(-1), Vec2d.j.mult(-1)],
        [Vec2d.i, Vec2d.j, Vec2d.j.mult(-1), Vec2d.i.mult(-1)],
        [Vec2d.j, Vec2d.i.mult(-1), Vec2d.j.mult(-1), Vec2d.i],
        [Vec2d.j, Vec2d.i.mult(-1), Vec2d.i, Vec2d.j.mult(-1)],
        [Vec2d.j, Vec2d.j.mult(-1), Vec2d.i.mult(-1), Vec2d.i],
        [Vec2d.j, Vec2d.j.mult(-1), Vec2d.i, Vec2d.i.mult(-1)],
        [Vec2d.j, Vec2d.i, Vec2d.i.mult(-1), Vec2d.j.mult(-1)],
        [Vec2d.j, Vec2d.i, Vec2d.j.mult(-1), Vec2d.i.mult(-1)]
    ];
    while (stack.length > 0) {
        const item = stack.shift()!;
        const [curr, prev, step] = item;
        const i = curr.y * w + curr.x;
        visited.add(i);
        const path = [curr];
        for (let c = prev; c != null; c = c![1]) path.push(c[0]);
        yield path;
        if (step == target) return;
        let moved = false;
        const dirs = randomDirs[Math.floor(Math.random() * 24)];
        for (const dir of dirs) {
            const next = curr.add(dir);
            if (next.x < 0 || next.x >= w || next.y < 0 || next.y >= h) continue;
            const j = next.y * w + next.x;
            if (!visited.has(j)) {
                stack.unshift([next, item, step + 1, 0]);
                item[3]++;
                moved = true;
            }
        }
        if (!moved) {
            visited.delete(i);
            for (let c = prev; c != null; c = c[1]) {
                c[3]--;
                if (c[3] > 0) break;
                visited.delete(c[0].y * w + c[0].x);
            }
        }
    }
    return;
}