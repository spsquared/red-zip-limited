import { Vec2d } from "./common";

/*
    hamiltonian_paths.js implements a method for Monte Carlo sampling of Hamiltonian paths.

    Copyright (C) 2012, 2018, 2019 Nathan Clisby

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    See https://www.gnu.org/licenses/ for details of the GNU General
    Public License. 
*/
const quality = 1;
export async function hamGen(w: number, h: number): Promise<Vec2d[]> {
    const area = w * h;
    const dirs = [Vec2d.i.mult(-1), Vec2d.j.mult(-1), Vec2d.i, Vec2d.j];
    const path: Vec2d[] = [new Vec2d(Math.floor(Math.random() * w), Math.floor(Math.random() * h))];
    let n = 1;
    const attempts = 1 + (quality * 10 * area * (Math.log(2 + area) ** 2));
    while (n < area) {
        // extra promise to stop completely blocking thread when running
        await new Promise<void>((resolve) => setTimeout(() => resolve()));
        for(let i = 0; i < attempts; i++) {
            const dir = dirs[Math.floor(Math.random() * 4)];
            if (Math.random() < 0.5) {
                const neighbor = path[0].add(dir);
                if (neighbor.x >= 0 && neighbor.x < w && neighbor.y >= 0 && neighbor.y < h) {
                    let revLoc = -1;
                    for (let j = 1; j < n; j += 2) {
                        if (neighbor.equals(path[j])) {
                            revLoc = j;
                            break;
                        }
                    }
                    if (revLoc >= 0) {
                        path.splice(0, revLoc, ...path.slice(0, revLoc).reverse());
                    } else {
                        path.splice(0, n, ...path.slice(0, n).reverse());
                        n++;
                        path[n - 1] = neighbor;
                    }
                }
            } else {
                const neighbor = path[n - 1].add(dir);
                if (neighbor.x >= 0 && neighbor.x < w && neighbor.y >= 0 && neighbor.y < h) {
                    let revLoc = -1;
                    for (let j = n - 2; j >= 0; j -= 2) {
                        if (neighbor.equals(path[j])) {
                            revLoc = j;
                            break;
                        }
                    }
                    if (revLoc >= 0) {
                        path.splice(revLoc + 1, n - revLoc - 1, ...path.slice(revLoc + 1, n).reverse());
                    } else {
                        n++;
                        path[n - 1] = neighbor;
                    }
                }
            }
        }
    }
    return path;
}

export function* radio(w: number, h: number): Generator<Vec2d[], void> {
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