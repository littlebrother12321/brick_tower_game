// Server index.js

// Set server constants
const TICK_RATE = 60;
const DT = 1 / TICK_RATE;


// Initialize websockets
const WebSocket = require("ws");
const wss = new WebSocket.Server({
    port: 8080,
    perMessageDeflate: false
});

// Init matter.js
const Matter = require("matter-js");
global.Matter = Matter;

// Set noise function (must match client)
const { createNoise2D } = require("simplex-noise");
const seedrandom = require("seedrandom");

const SEED = "brick-tower-world"; // ← must match client

// initialize noise function & seed
const rng = seedrandom(SEED);
const noise2D = createNoise2D(rng);

function terrainNoise(x) {
    //return math.random(rng)
    return noise2D(x, 0);
    //return createNoise2D(rng);
}

const {
    physicsSetup,
    physicsTick,
    Brick,
    bricks,
    addGroundSpan
} = require("./bricks_server.js");

function floorHeight(worldX) {
    const BASE = 0;
    const AMP = 60;
    const SCALE = 0.005;

    if (worldX > 0) {
	return BASE + terrainNoise(worldX * SCALE) * AMP;
    } else if (worldX <= 0) {
	return BASE + terrainNoise(worldX * SCALE) * AMP / 10;
    }
}

physicsSetup(floorHeight, { gravity: 1 });


// physicsSetup((x) => floorHeight(x), {
//     gravity: 1
// });

// Init UUID libraries
const crypto = require('crypto');

// Create map to store connections
const players = new Map();

function spawnPlayer(id) {
    players.set(id, {
	x: 0,
	y: 0,
	vx: 0,
	vy: 0,
	grounded: false,
	input: {}
    });
}

function simulatePlayer(p, dt) {
    const input = p.input;

    let vmod = 1;

    if (input.sprint) {
	switch (vmod) {
	case 1:
	    vmod = 2;
	    break;
	case 2:
	    vmod = 1;
	    break;
	}
    }
    
    if (input.left) p.vx -= 1 * vmod;
    if (input.right) p.vx += 1 * vmod;

    if (input.jump && p.grounded) {
	p.vy = -4 * vmod;
	p.grounded = false;
    }
    
    p.vy += 0.1; // gravity

    p.x += p.vx;
    p.y += p.vy;

    p.vx *= 0.8; // friction

    const floor = floorHeight(p.x);
    if (p.y > floor) {
	p.y = floor;
	p.vy = 0;
	p.grounded = true;
    }
}

function broadcastWorldState() {
    const snapshot = {
	type: "world",
	players: {},
	bricks: bricks.map(b => ({
	    x: b.body.position.x,
	    y: b.body.position.y,
	    angle: b.body.angle
	}))
    };

    for (const [id, p] of players) {
	snapshot.players[id] = {
	    x: p.x,
	    y: p.y
	};
    }

    broadcast(snapshot);
}

setInterval(() => {
    physicsTick(DT);

    for (const [id, p] of players) {
	simulatePlayer(p, DT);

	for (const brick of bricks) {
	    if (playerVsBrickServer(p, brick)) {
		Matter.Body.applyForce(
		    brick.body,
		    brick.body.position,
		    { x: p.vx * 0.0005, y: 0 }
		);

		p.vx = 0;
	    }
	}
    }
    broadcastWorldState();
}, 1000 / TICK_RATE);

function playerVsBrickServer(p, brick) {
    const b = brick.body.bounds;
    return (
	p.x - 16 < b.max.x &&
	    p.x + 16 > b.min.x &&
	    p.y - 32 < b.max.y &&
	    p.y > b.min.y
    );
}


wss.on("connection", (ws) => {
    const id = crypto.randomUUID();

    // Store UUID
    spawnPlayer(id);
    
    // Tell the new client its id
    ws.send(JSON.stringify({
	type: "welcome",
	id
    }));
    console.log("connected:", id);
    console.log("active:", players.size);
    
    // Tell the new client about all existing clients
    wss.clients.forEach(client => {
	if (client !== ws && client.readyState === WebSocket.OPEN) {
	    ws.send(JSON.stringify({
		type: "join",
		id: client.id
	    }));
	}
    });
    
    // Tell everyone else about the new client
    broadcast({
	type: "join",
	id
    }, ws);

    ws.on("message", (msg) => {
	let data;
	try {
	    data = JSON.parse(msg.toString());
	} catch {
	    return;
	}

	if (data.type === "input") {
	    const p = players.get(id);
	    if (p) {
		p.input = data.input;
	    }
	}

	if (data.type === "spawn_brick") {
	    new Brick(data.x, data.y, 50);
	}
	
    });

    // Delete unused UUIDs on close
    ws.on("close", () => {
	broadcast({
	    type: "leave",
	    id
	});
	// Removes UUID from map
	console.log("deleting... ", id)
	players.delete(id);
	// Show current active connections
	console.log("active:", players.size);
    });
    // Handle errors
    ws.on('error', (err) => {
	console.error("WS error for ", id, err);
	players.delete(id); // Clean up ID from map
    });
});

function broadcast(packet, except = null) {
    const text = JSON.stringify(packet);
    wss.clients.forEach(client => {
	if (client.readyState === WebSocket.OPEN && client !== except) {
	    client.send(text);
	}
    });
}

console.log("server on ws://localhost:8080");
