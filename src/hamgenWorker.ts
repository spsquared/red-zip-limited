import { Vec2d } from "./common";

/*
Algorithm adapted from https://clisby.net/projects/hamiltonian_path/
*/
const quality = 1;
async function hamGen(w: number, h: number): Promise<Vec2d[]> {
    const area = w * h;
    const path: Vec2d[] = [new Vec2d(Math.floor(Math.random() * w), Math.floor(Math.random() * h))];
    let n = 1;
    const attempts = 1 + (quality * 10 * area * (Math.log(2 + area) ** 2));
    while (n < area) {
        for (let i = 0; i < attempts; i++) {
            const dir = Vec2d.dirs[Math.floor(Math.random() * 4)];
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

onmessage = async (e) => postMessage(await hamGen(e.data[0], e.data[1]));