export class Vec2d {
    readonly x: number;
    readonly y: number;
    
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    equals(o: Vec2d): boolean {
        return this.x == o.x && this.y == o.y;
    }

    magnitude(): number {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }

    translate(x: number, y: number): Vec2d {
        return new Vec2d(this.x + x, this.y + y);
    }

    mult(s: number): Vec2d {
        return new Vec2d(this.x * s, this.y * s);
    }

    norm(): Vec2d {
        return this.mult(1 / this.magnitude());
    }

    negate(): Vec2d {
        return new Vec2d(-this.x, -this.y);
    }

    add(o: Vec2d): Vec2d {
        return new Vec2d(this.x + o.x, this.y + o.y);
    }

    sub(o: Vec2d): Vec2d {
        return this.add(o.negate());
    }

    dot(o: Vec2d): number {
        return this.x * o.x + this.y * o.y;
    }

    cross(o: Vec2d): number {
        return this.x * o.y - this.y * o.x;
    }

    static readonly zero: Vec2d = new Vec2d(0, 0);
    static readonly i: Vec2d = new Vec2d(1, 0);
    static readonly j: Vec2d = new Vec2d(0, 1);
    static readonly dirs: readonly [Vec2d, Vec2d, Vec2d, Vec2d] = [Vec2d.i.mult(-1), Vec2d.j.mult(-1), Vec2d.i, Vec2d.j] as const;
}