/* ========= HEADLESS BRICK PHYSICS ========= */
/* Requires Matter.js loaded beforehand */

const { Engine, World, Bodies, Body } = Matter;

/* ---------- INTERNAL STATE ---------- */

let engine = null;
let world = null;
let groundBody = null;

/* ---------- EXPOSED STATE ---------- */

const bricks = []; // freely mutable
let groundAtX = null; // user-defined function

/* ---------- SETUP ---------- */

function physicsSetup(groundFunc, options = {}) {
  groundAtX = groundFunc;

  engine = Engine.create();
  world = engine.world;

  engine.gravity.y = options.gravity ?? 1;

  engine.positionIterations = 8;
  engine.velocityIterations = 6;
  engine.constraintIterations = 4;
  engine.enableSleeping = true;

  buildGround();
}

/* ---------- GROUND ---------- */

function buildGround() {
  if (groundBody) {
    World.remove(world, groundBody);
    groundBody = null;
  }

  const bodies = [];
  const step = 10;
  const span = 8000;
  const thickness = 50;

  for (let x = -span / 2; x < span / 2; x += step) {
    const y1 = groundAtX(x);
    const y2 = groundAtX(x + step);

    const cx = x + step / 2;
    const cy = (y1 + y2) / 2;

    const dx = step;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx);

    const segment = Bodies.rectangle(cx, cy, step, thickness, {
      isStatic: true,
      friction: 0.8,
    });

    Body.setAngle(segment, angle);
    bodies.push(segment);
  }

  groundBody = Body.create({
    isStatic: true,
    parts: bodies,
  });

  World.add(world, groundBody);
}

/* ---------- BRICK ---------- */

class Brick {
  constructor(x, y, size = 40) {
    this.size = size;

    this.body = Bodies.rectangle(x, y, size, size, {
      friction: 0.6,
      frictionStatic: 0.9,
      restitution: 0,
    });

    World.add(world, this.body);
    bricks.push(this);
  }

  /* --- kinematics --- */
  get x() {
    return this.body.position.x;
  }
  get y() {
    return this.body.position.y;
  }
  get vx() {
    return this.body.velocity.x;
  }
  get vy() {
    return this.body.velocity.y;
  }
  get angle() {
    return this.body.angle;
  }
  get angularVelocity() {
    return this.body.angularVelocity;
  }

  setVelocity(vx, vy) {
    Body.setVelocity(this.body, { x: vx, y: vy });
  }

  setAngularVelocity(w) {
    Body.setAngularVelocity(this.body, w);
  }

  /* --- geometry --- */
  getCorners() {
    // World-space, rotated, exact
    return this.body.vertices.map((v) => ({ x: v.x, y: v.y }));
  }

  destroy() {
    World.remove(world, this.body);
    const i = bricks.indexOf(this);
    if (i !== -1) bricks.splice(i, 1);
  }
}

/* ---------- TICK ---------- */

function physicsTick(dt = 1 / 60) {
  if (!engine) return;
  Engine.update(engine, dt * 1000);
}

/* ---------- EXPORT ---------- */

window.physicsSetup = physicsSetup;
window.physicsTick = physicsTick;
window.Brick = Brick;
window.bricks = bricks;
//thing
physicsSetup((x) => 300 + Math.sin(x * 0.01) * 40);

//new Brick(0, 0);
//new Brick(20, 0);
let time = 0;
setInterval(() => {
  physicsTick();

  // for (const b of bricks) {
  //   if (time < 100 || Matter.Query.collides(b.body, [groundBody]).length > 0) {
  //     console.log(b.getCorners());
  //   }
  //   if (Matter.Query.collides(b.body, [groundBody]).length > 0) {
  //     console.log("ground collision!");
  //   }
  //}
  time++;
}, 16);
