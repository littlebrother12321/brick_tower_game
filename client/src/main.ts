import Matter from 'matter-js';

import p5 from 'p5';

;(window as any).p5 = p5;

import { physicsSetup, physicsTick, addGroundSpan, bricks, Brick } from "./depends/bricks.js";

//const sketch = (p: p5) => {

//play's colour'
let myColor;
// yes or no for if the playr is connected
let connected = false;
// Sended initial state?
let sendInitialState = false;
// The camera
//let cam: p5.camera;
// The gravity
const g = 0.1;
// The x-equivalent of gravity
const FRICTION = 0.5

// offline mode
let offline = true;
// noise function (must match server) (loaded from index.html)

import { createNoise2D } from 'simplex-noise';
import seedrandom from 'seedrandom';

const SEED = "brick-tower-world";

// initialize the noise function & seed
const rng = seedrandom(SEED);
const noise2D = createNoise2D(rng);

//import { create, all } from 'mathjs';
//const math = create(all);

function terrainNoise(x) {
    return noise2D(x, 0);
    //return math.random();
    //return createNoise2D(rng);
}

// Visual stuff
const halfScreenX = window.innerWidth/2;
const halfScreenY = window.innerHeight/2;
let floorY = 0;

// fysics
//let vx = 0;
///let vy = 0;
let grounded = false;

// Player sprite frame coordinates
let sprite_sheet: p5.Image;
const FRAME_W = 32;
const FRAME_H = 32;
const FRAMES = 2;
const ANIM_SPEED = 3;
let currentFrame = 0;

const player = {
     x: -0,
     y: 0,
     vx: 0,
     vy: 0,
     grounded: false,
     w: 32,
     h: 32
}
// Make the player matter (get it? pun intendid?)
let engine = Matter.Engine.create();
const playerBody = Matter.Bodies.rectangle(player.x, player.y, player.w, player.h, {
    inertia: Infinity, // Don't need rotating player (for now...)
    friction: 0.1,
    frictionAir: 0.02,
    frictionStatic: 0,
    restitution: 0,
    slop: 0.01,
    label: 'player'
});

Matter.World.add(engine.world, playerBody);


//const cubes = []

const CUBE_FRICTION = 0.2;
const CUBE_AIR_FRICTION = 0.05;

let LowestLoadedX=0;
let HighestLoadedX=0;

// Buttons to connect to local websocket
let connectButton;
let disconnectButton;

// WebSocket stuff

let socket;
let myId = null;
let players = {};

let peopleFont;

window.setup = async function() {

    createCanvas(windowWidth,windowHeight, WEBGL);
    
    background(200);
    frameRate(60);

    //cam = createCamera();

    // Preloads
    peopleFont = await loadFont("./WeThePeople.ttf");
    sprite_sheet = await loadImage("/stoof.png");
    //drawingContext.disable(drawingContext.DEPTH_TEST);

    // noiseDetail(4, 8);
    // noiseSeed(1337);

    // Create buttons
    connectButton = createButton("Connect");
    connectButton.position(20,50);
    connectButton.mousePressed(connectSocket);

    disconnectButton = createButton("Disconnect");
    disconnectButton.position(20, 80);
    disconnectButton.mousePressed(disconnectSocket);

    // spawnCube(-100, -5000);
    // spawnCube(0, -5050);

    physicsSetup((x) => floorHeight(x), {
	gravity: g * 10
    });
    addGroundSpan(-1000,1000);
    LowestLoadedX=-1000;
    HighestLoadedX=1000;

    noStroke();
    fill(0,200,0);
    //myColor = color(random(255), 128, random(255));
    describe("A very fun game where you build a tower with bricks.");

    console.log("Setup is yes!, starting draw.");
}

// we gonna do stoof.

//The draw function draws things
window.draw = function() {

    clear();
    // Runs updatephysics, look below for details

    if (offline) {
	updatePhysics();
	physicsTick(1 / 60);
    }

    // Camera codes
    //Wavy camera
    //camera(player.x, 0, 500, player.x, player.y, 10, sin(player.x / 200), cos(player.x / 200) ** -1, 0);

    //Mirror dimension
    /*if (player.x >= 0) {
      camera(player.x, player.y, 500, player.x, player.y, 10, 0, 1, 0);
      } else {
      camera(player.x, player.y, -500, player.x, player.y, 10, 0, 1, 0);
      }*/
    
    //Normal camera
    //camera(player.x, player.y, 500, player.x, player.y, 10, 0, 1, 0);
    camera(playerBody.position.x, playerBody.position.y, 500, playerBody.position.x, playerBody.position.y, 10, 0, 1, 0);
    
    //cam.setPosition(player.x, player.y, 500);
    //cam.lookAt(player.x, player.y, 0);
    orbitControl(); // fixed camera, now constrained a bit
    //frustum(-halfScreenX / 13, halfScreenX / 13, -halfScreenY / 13, halfScreenY / 13); // Optimize a bit by adding a frustrum (it's upside down, yeah.)
    
    push();

    if (frameCount % 1 === 0) {
	// Draw floor
	drawWavyFloor();
	// Grid for reference
	drawFloorGrid();
    };

    // Set text font
    textFont(peopleFont);
    
    // Draw n amount of cubes
    for( const b of bricks ) {
	const verts = b.getCorners();

	push();
	beginShape();
	stroke(2);
	for (const v of verts) {
	    vertex(v.x, v.y + 41);
	    if(v.x>HighestLoadedX){
		addGroundSpan(HighestLoadedX,HighestLoadedX+1000);
		HighestLoadedX=HighestLoadedX+1000;
	    } else if(v.x<LowestLoadedX){
		addGroundSpan(LowestLoadedX-1000,LowestLoadedX);
		LowestLoadedX=LowestLoadedX-1000;
	    }
	};
	endShape(CLOSE);
	pop();
    }
    
    // animation(sprite_sheet, x, y); This line got comented out
    //console.log("x: " + player.x + " y: " + player.y + " vx: " + player.vx + " vy: " + player.vy);
    //console.log("camX: " + camera1.eyeX, "camY: " + camera1.eyeY);
    //console.log(grounded);

    // setup animation
    // advance frame
    if (frameCount % ANIM_SPEED === 0) {
	currentFrame = (currentFrame + 1) % FRAMES
    }

    const sx = currentFrame * FRAME_W

    //loop though players and draws them
    for (let id in players) {
	if (id !== myId) {
	    push();
	    //  fill(players[id].color);
	    translate(
		players[id].x,
		players[id].y,
		0
	    );
	    // substitute box until i get an animation working
	    //animation(sprite_sheet, 0, 0, width, height);
	    // Using p5js animation now.
	    image(
		sprite_sheet,
		    -16, -16,                // destination
		FRAME_W, FRAME_H,
		sx, 0,                   // source x/y in sprite sheet
		FRAME_W, FRAME_H
	    )
	    
	    box();
	    pop();
	};
    }

    // play animation at location of camera x y.
    push();
    //translate(max([player.x]), max([player.y]), 1);
    translate(playerBody.position.x, playerBody.position.y, 1);
    // same here
    //animation(sprite_sheet, 0, 0, width, height);
    image(
	sprite_sheet,
	    -16, -16,                // destination
	FRAME_W, FRAME_H,
	sx, 0,                   // source x/y in sprite sheet
	FRAME_W, FRAME_H
    )
    //box(player.width, player.height);
    // Set text color
    fill(0,0,0)
    // Show text coordinates on player
    text("vmod/sprint:" + vmod + "\n" + round(playerBody.position.x) + "\n" + round(playerBody.position.y), 10, -20); // Round X & Y because floating point errors are annoying
    pop();


    // send over your player data to server
    sendState();

    // Handle socket errors and closes
    // socket.onerror = (err) => {
    // 	console.error("socket error", err);
    // };

    // socket.onclose = () => {
    // 	console.log("socket closed");
    // };
    pop();
    //console.log("HI sketch js working!!!");
} // end of draw function

// Physics stuff

let vmod = 1; // Velocity modifier
window.keyPressed = function() {
    if (keyCode == 8) {
	spawnCube(playerBody.position.x, playerBody.position.y - 200);
    }
    if (keyCode == 16 && vmod == 1) {
	vmod = 2;
    } else if ( keyCode == 16 && vmod != 1) {
	vmod = 1;
    }
    //console.log(keyCode);
}

function updatePhysics() {

    // input

    //player x velocity
    let velX = 0;
    if ((keyIsDown(LEFT_ARROW) || keyIsDown("a")) && playerBody.velocity.x >= (-8 * vmod)) velX -= (8 * vmod);
    if ((keyIsDown(RIGHT_ARROW) || keyIsDown("d")) && playerBody.velocity.x <= (8 * vmod)) velX += (8 * vmod);
    
    //preserve vertical velocity but move player X
    Matter.Body.setVelocity(playerBody, {x: velX, y: playerBody.velocity.y});

    //jumping
    if ((keyIsDown(UP_ARROW) || keyIsDown("w") || keyIsDown(" ")) && grounded) {
	// player.vy = (-2 * vmod);
	Matter.Body.setVelocity(playerBody, {x: playerBody.velocity.x, y: -8 * vmod});
    }

    // gravity
    if (!grounded) playerBody.velocity.y += g;

    // friction
    if (playerBody.velocity.x > 0) playerBody.velocity.x = max(0, playerBody.velocity.x - FRICTION);
    else if (playerBody.velocity.x < 0) playerBody.velocity.x = min(0, playerBody.velocity.x + FRICTION);

    // ---- X AXIS ----
    playerBody.position.x += round(playerBody.velocity.x);
    for(const b of bricks) {
	if (!playerVsBrick(b)) continue;

	// Player → brick impulse
	if (offline) {
	    if (playerBody.velocity.x !== 0) {
		Matter.Body.applyForce(
		    b.body,
		    b.body.position,
		    { x: playerBody.velocity.x * 0.0005, y: 0 }
		);
	    }
	}

	// Player stops, brick reacts
	if (playerBody.velocity.x > 0) {
	    playerBody.velocity.x = b.body.bounds.min.x - (playerBody.bounds.max.x - playerBody.bounds.min.x) / 2;
	} else if (playerBody.velocity.x < 0) {
	    playerBody.position.x = b.body.bounds.max.x + (playerBody.bounds.max.x - playerBody.bounds.min.x) / 2;
	}

	playerBody.velocity.x = 0;
    }


    // for (const cube of cubes) {
    // 	resolveXCollision(boxAABB(cube), cube);
    // }


    // ---- Y AXIS ----
    const prevY = round(playerBody.position.y);
    playerBody.position.y += playerBody.velocity.y;

    for (const b of bricks) {
	const bounds = b.body.bounds;

	if (
	    playerBody.velocity.y >= 0 &&
		playerBody.position.y <= bounds.min.y &&
		playerBody.position.y + playerBody.velocity.y >= bounds.min.y &&
		playerBody.position.x > bounds.min.x &&
		playerBody.position.x < bounds.max.x
	) {
	    playerBody.position.y = bounds.min.y;
	    playerBody.velocity.y = 0;
	    grounded = true;
	}
    }


    // floor
    const footY = floorHeight(playerBody.position.x);

    if (playerBody.position.y > footY) {
	playerBody.position.y = footY;
	grounded = true;
    } else {
	grounded = false;
    }

    // Terminal velocity
    if (playerBody.velocity.y > 130) playerBody.velocity.y = 130;

    // box
    // for (const cube of cubes) {
    // 	resolveYCollision(boxAABB(cube), prevY, cube);
    // }
    //updateCubePhysics();

}

// Player collisions (made with love + chat)
function playerAABB(px = playerBody.position.x, py = playerBody.position.y) {
    return {
	minX: px - (playerBody.bounds.max.x - playerBody.bounds.min.x) / 2,
	maxX: px + (playerBody.bounds.max.x - playerBody.bounds.min.x) / 2,
	minY: py - (playerBody.bounds.max.y - playerBody.bounds.min.y),
	maxY: py
    }
}

function boxAABB(cube) {
    return {
	minX: cube.x - cube.w / 2,
	maxX: cube.x + cube.w / 2,
	minY: cube.y - cube.h / 2,
	maxY: cube.y + cube.h / 2
    };
}

function resolveXCollision(collider, cube) {
    const p = playerAABB();

    if (!aabbIntersect(p, collider)) return;

    if (playerBody.velocity.x !== 0) {
	cube.vx += playerBody.velocity.x * 0.2;
    }

    if (playerBody.velocity.x > 0) {
	playerBody.position.x = collider.minX - (playerBody.bounds.max.x - playerBody.bounds.min.x) / 2;
    } else if (playerBody.velocity.x < 0) {
	playerBody.position.x = collider.maxX + (playerBody.bounds.max.x - playerBody.bounds.min.x) / 2;
    }

    // player thing
    playerBody.velocity.x = 0;

}

function resolveYCollision(collider, prevY, cube) {
    const p = playerAABB();

    if (!aabbIntersect(p, collider)) return;

    // Landing on top
    if (playerBody.velocity.y > 0 && prevY <= collider.minY) {
	playerBody.position.y = collider.minY;
	playerBody.velocity.y = 0;
	player.grounded = true;

	// pushing the cueb down
	cube.vy += g * 2;
    }

    // Hitting head
    else if (playerBody.velocity.y < 0 && prevY >= collider.maxY) {
	playerBody.position.y = collider.maxY + (playerBody.bounds.max.y - playerBody.bounds.min.y);
	playerBody.velocity.y = 0;
	cube.vy -= 0.5;
	player.grounded = true;
    }
}

function aabbIntersect(a, b) {
    return (
	a.minX < b.maxX &&
	    a.maxX > b.minX &&
	    a.minY < b.maxY &&
	    a.maxY > b.minY
    );
}

function getViewBounds() {
    const viewW = width * 0.6;
    const viewH = height * 0.6;

    return {
	minX: playerBody.position.x - viewW,
	maxX: playerBody.position.x + viewW,
	minY: playerBody.position.y - viewH,
	maxY: playerBody.position.y + viewH
    };
}

function playerVsBrick(brick) {
    const p = playerAABB();
    const b = brick.body.bounds;

    return (
	p.minX < b.max.x &&
	    p.maxX > b.min.x &&
	    p.minY < b.max.y &&
	    p.maxY > b.min.y
    );
}

// Drawing stuff

function floorHeight(worldX) {
    const BASE = 0;
    const AMP = 60;
    const SCALE = 0.005;

    if (worldX > 0) {
	return BASE + terrainNoise(worldX * SCALE) * AMP;
    } else if (worldX <= 0) {
	return BASE + terrainNoise(worldX * SCALE) * AMP / 10;
    }
    
    // let SCALE; //legacy noise gen
    // let AMP;
    // let BASE
    // //return floorY + cos(worldX * 1 + 45) * 25;
    // if (worldX < 0) {
    // 	SCALE = 0.00000002;
    //  	AMP = -0.5;
    //  	BASE = -floorY;
    // } else {
    //  	SCALE = 0.0002;
    //  	AMP = 2.75;
    //  	BASE = floorY;
    // }

    // const n = noise(worldX * SCALE);
    // const h = (n - 229) * 2;

    // return BASE + h * AMP;

    // if (worldX < 0) {
    //  	return pow(5, worldX);
    // } else {
    //  	return worldX * 2;
    // }

    //return pow(1.02, worldX) / 50000;
    //return pow(worldX, 1/6) / 500000
}

function drawWavyFloor() {
    // Get view plane
    const view = getViewBounds();

    const floorStep = 5;
    const startX = floor(view.minX / floorStep) * floorStep;
    const endX = ceil(view.maxX / floorStep) * floorStep;

    //drawing the floor
    push();
    //stroke(100); //enable/disable wireframe
    fill(100, 200, 100);

    beginShape(TRIANGLE_STRIP);
    for (let x = startX; x <= endX; x += floorStep) {
	const y = floorHeight(x);
	vertex(x, y + 16, -1);
	vertex(x, y + 5000, -1);
    }
    endShape();

    pop();
}

function drawFloorGrid() {

    const view = getViewBounds();
    const size = 50;

    const startX = floor(view.minX / size) * size;
    const endX   = ceil(view.maxX / size) * size;
    const startY = floor(view.minY / size) * size;
    const endY   = ceil(view.maxY / size) * size;

    push();
    stroke(200);
    fill(0);
    textFont(peopleFont); // Sets the text font (I only had the coolest one close by at the time)

    // Draw the lines
    for (let x = startX; x <= endX; x += size) {
	line(x, startY, 0, x, endY, 0);
	text(x, x, 0);
    }

    for (let y = startY; y <= endY; y += size) {
	line(startX, y, 0, endX, y, 0);
	text(y, 0, y);
    }

    pop();
}

function spawnCube(x, y) {
    if (offline) {
	new Brick(x, y, 50);
    } else {
	socket.send(JSON.stringify({
	    type: "spawn_brick",
	    x, y
	}));
    }
}


// WebSocket stuff
function connectSocket() {
    // connect to websocket and set update interval
    clear();
    console.log("Starting connection");
    if (!socket || socket.readyState == 3) {
	socket = new WebSocket("ws://localhost:8080"); // TODO: add absolute IP when delployeld
	setInterval(sendState, 50); // 20 Hz
    } else if (socket.readyState == 1) {
	console.log("Already connected!");
    } else if (socket.readyState == 0) {
	console.log("Connecting...");
    } else {
	console.log("Unable to connect", socket.readyState);
    }
    // do stuff when socket is opened
    socket.onopen = () => {
	console.log("socket connected");
	offline = false;

	// delete all local bricks
	bricks.length = 0;
	
	sendState();
	sendInitialState = true;
    };

    socket.onclose = () => {
	offline = true;
    }

    // do stuff when message is recieved
    socket.onmessage = (event) => {
	const msg = JSON.parse(event.data);

	if (msg.type === "world") {
	    for (const id in msg.players) {
		if (id !== myId) {
		    players[id] = msg.players[id];
		} else {
		    playerBody.position.x = lerp(playerBody.position.x, msg.players[id].x, 0.3)
		    playerBody.position.y = lerp(playerBody.position.y, msg.players[id].y, 0.3)
		}
	    }

	    //rebuild bricks to match server
	    if(bricks.length !== msg.bricks.length) {
		bricks.length = 0;

		for (const b of msg.bricks) {
		    new Brick(b.x, b.y, 50);
		}
	    } else {
		//bricks
		for (let i = 0; i < bricks.length; i++) {
		    Matter.Body.setPosition(
			bricks[i].body,
			msg.bricks[i]
		    );
		    Matter.Body.setAngle(
			bricks[i].body,
			msg.bricks[i].angle
		    );
		}
	    }
	}

	switch (msg.type) {
	    case "welcome":
		myId = msg.id;
		players[myId] = { x: 0, y: 0 };
		console.log("I am", myId);
		break;

	    case "join":
		players[msg.id] = { x: 0, y: 0 };
		console.log("player joined", msg.id);
		delete players["undefined"];
		break;

	    case "leave":
		delete players[msg.id];
		console.log("player left", msg.id);
		break;

	    case "state":
		if (msg.id !== myId) {
		    players[msg.id] = msg.state;
		}
		break;
	}
    };
}

function disconnectSocket() {
    if (socket && socket.readyState == 1) {
	socket.close();
	console.log("Disconnected from websocket");
	for (let id in players) {
	    delete players[id];
	}
    } else {
	console.log("Socket not connected");
    };
}

function sendState() {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify({
	type: "input",
	input: getInput()
    }));
}

function getInput() {
    return {
	left: keyIsDown(LEFT_ARROW) || keyIsDown('a'),
	right: keyIsDown(RIGHT_ARROW) || keyIsDown('d'),
	jump: (keyIsDown(UP_ARROW) || keyIsDown('w')),
	sprint: keyIsDown('Shift')
    };
}

// close socket before refreshing page
window.addEventListener("beforeunload", () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
	socket.close();
    }
});

//};
//new p5();
