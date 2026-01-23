//play's colour'
let myColor;
// yes or no for if the playr is connected
let connected = false;
// the sprite sheet
let sprite_sheet;
// The camera
let camera;
// The gravity
const g = 0.1;
// The x-equivalent of gravity
const FRICTION = 0.5


// Visual stuff
const halfScreenX = window.innerWidth/2;
const halfScreenY = window.innerHeight/2;
let floorY = 0;

//The player Pos using X and Y
//let x = -64;
//let y = -5000;

// fysics
//let vx = 0;
///let vy = 0;
let grounded = false;

// Player AABB coordinates
//const PLAYER_W = 32;
//const PLAYER_H = 32;

// BOx collisions

const player = {
    x: -64,
    y: -500,
    vx: 0,
    vy: 0,
    grounded: false,
    w: 32,
    h: 32
}

const cube = {
    x: 0,
    y: -5000,
    w: 50,
    h: 50,
    vx: 0,
    vy: 0,
    grounded: false
};

const cube2 = {
    x: 0,
    y: -5050,
    w: 50,
    h: 50,
    vx: 0,
    vy: 0,
    grounded: false
};

const CUBE_FRICTION = 0.2;
const CUBE_AIR_FRICTION = 0.05;

// Buttons to connect to local websocket
let connectButton;
let disconnectButton;

// WebSocket stuff

let socket;
let myId = null;
let players = {};


function preload() {
    sprite_sheet = loadAni("./stoof.png", { width: 32, height: 32, frames: 2 });
    font = loadFont("./WeThePeople.ttf");
}

function setup() {
    createCanvas(windowWidth,windowHeight, WEBGL);
    background(255);

    frameRate(60);
    
    camera = createCamera();

    //drawingContext.disable(drawingContext.DEPTH_TEST);

    // Using normal websocket, no p5 websocket now.
    
    // connect to an instance of github.com/abachman/p5-websocket-server locally
    //connectWebsocket("wss://172.22.1.96:4004/p5.websocket-dev");
    //connectWebsocket("wss://127.0.0.1:4004/p5.websocket-dev");
    // or the current reference server at wss://chat.reasonable.systems
    //connectWebsocket("wss:chat.reasonable.systems/p5.websocket-dev");

    // Testing localhost websocket
    //connectWebsocket("ws://localhost:8080/p5.websocket-dev")

    noiseDetail(4, 8);
    noiseSeed(1337);

    // Create buttons
    connectButton = createButton("Connect");
    connectButton.position(20,50);
    connectButton.mousePressed(connectSocket);

    disconnectButton = createButton("Disconnect");
    disconnectButton.position(20, 80);
    disconnectButton.mousePressed(disconnectSocket);
    
    noStroke();
    fill(0,200,0);
   //myColor = color(random(255), 128, random(255));
}

// we gonna do stoof.

//The draw function draws things
function draw() {


    clear();

    // Runs updatephysics, look below for details
    updatePhysics();

    
    // Camera codes
    camera.setPosition(player.x, player.y, 500);
    camera.lookAt(player.x, player.y, 0);
    orbitControl(); // fixed camera, now constrained a bit
    frustum(-halfScreenX / 13, halfScreenX / 13, -halfScreenY / 13, halfScreenY / 13); // Optimize a bit by adding a frustrum (it's upside down, yeah.)

    
    push();


    if (frameCount % 1 === 0) {
	// Draw floor
	drawWavyFloor();
	// Grid for reference
	drawFloorGrid();
    };
    
    // Set text font
    textFont(font)    

    push();
    translate(cube.x, cube.y + 16, 0);
    stroke(2);
    box(cube.w,cube.h,sqrt(pow(cube.vx, 2) + pow(cube.vy, 2)) * 16); // Box for physics testing
    pop();

    push();
    translate(cube2.x, cube2.y + 16, 0);
    stroke(2);
    box(cube2.w,cube2.h,sqrt(pow(cube2.vx, 2) + pow(cube2.vy, 2)) * 16); // Box for physics testing
    pop();
    
    // animation(sprite_sheet, x, y); This line got comented out
    //console.log("x: " + player.x + " y: " + player.y + " vx: " + player.vx + " vy: " + player.vy);
    //console.log("camX: " + camera.eyeX, "camY: " + camera.eyeY);

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
	    animation(sprite_sheet, 0, 0);
            pop();
        };
    }
    
    // play animation at location of camera x y.
    push();
    translate(max(player.x), max(player.y), 1);
    animation(sprite_sheet, 0, 0);
    // Set text color
    fill(0,0,0)
    // Show text coordinates on player
    text(player.x + "\n" + player.y, 10, -20); // Round Y because floating point errors are annoying
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
} // end of draw function

// Visuals stuff
function updatePhysics() {
    
    // input
    if ((keyIsDown(LEFT_ARROW) || keyIsDown(65)) && player.vx >= -4) player.vx -= 1;
    if ((keyIsDown(RIGHT_ARROW) || keyIsDown(68)) && player.vx <= 4) player.vx += 1;

    if ((keyIsDown(UP_ARROW) || keyIsDown(87)) && grounded) {
	player.vy = -2;
    }

    if (keyIsDown(16)) {
	if ((keyIsDown(LEFT_ARROW) || keyIsDown(65)) && player.vx >= -7) player.vx -= 2;
	if ((keyIsDown(RIGHT_ARROW) || keyIsDown(68)) && player.vx <= 7) player.vx += 2;

	if ((keyIsDown(UP_ARROW) || keyIsDown(87)) && grounded) {
	    player.vy = -4;
	}
    }
    
    // gravity
    if (!grounded)  player.vy += g;

    // friction
    if (player.vx > 0) player.vx = max(0, player.vx - FRICTION);
    else if (player.vx < 0) player.vx = min(0, player.vx + FRICTION);

    // ---- X AXIS ----
    player.x += player.vx;
    resolveXCollision(boxAABB());

    // ---- Y AXIS ----
    const prevY = player.y;
    player.y += player.vy;

    // floor
    const footY = floorHeight(player.x);
    
    if (player.y > footY) {
	player.y = footY;
	grounded = true;
    } else {
	grounded = false;
    }

    // Terminal velocity
    if (player.vy > 130) player.vy = 130;
    
    // box
    resolveYCollision(boxAABB(), prevY);
    updateCubePhysics();
}

function updateCubePhysics() {
    // Gravity
    cube.vy += g;

    // integrate
    cube.x += cube.vx;
    cube.y += cube.vy;

    const flootY = floorHeight(cube.x);

    // Cube gravity
    if (cube.y + cube.h / 2 > flootY) {
	cube.y = flootY - cube.h / 2;
	cube.vy = 0;
	cube.grounded = true;

	// Ground friction
	if (cube.vx > 0) cube.vx = max(0, cube.vx - CUBE_FRICTION); // Cube friction
	else if (cube.vx < 0) cube.vx = min(0, cube.vx + CUBE_FRICTION);
    } else {
	cube.grounded = false;

	cube.vx *= (1 - CUBE_AIR_FRICTION); // air resistance
    }

    // Cube non-jitter-inator
    if (abs(cube.vx) < 0.01) cube.vx = 0;

    // Cube terminal velocity
    if (cube.vy > 130) cube.vy = 130;
}

// Player collisions (made with love + chat)
function playerAABB(px = player.x, py = player.y) {
    return {
	minX: px - player.w / 2,
	maxX: px + player.w / 2,
	minY: py - player.h,
	maxY: py
    }
}

function boxAABB() {
    return {
	minX: cube.x - cube.w / 2,
	maxX: cube.x + cube.w / 2,
	minY: cube.y - cube.h / 2,
	maxY: cube.y + cube.h / 2
    };
}

function resolveXCollision(collider) {
    const p = playerAABB();

    if (!aabbIntersect(p, collider)) return;

    if (player.vx !== 0) {
	cube.vx += player.vx * 0.2;
    }
    
    if (player.vx > 0) {
	player.x = collider.minX - player.w / 2;
    } else if (player.vx < 0) {
	player.x = collider.maxX + player.w / 2;
    }

    // player thing
    player.vx = 0;

}

function resolveYCollision(collider, prevY) {
    const p = playerAABB();

    if (!aabbIntersect(p, collider)) return;

    // Landing on top
    if (player.vy > 0 && prevY <= collider.minY) {
	player.y = collider.minY;
	player.vy = 0;
	player.grounded = true;

	// pushing the cueb down
	cube.vy += g * 2;
    }

    // Hitting head
    else if (player.vy < 0 && prevY >= collider.maxY) {
	player.y = collider.maxY + player.h;
	player.vy = 0;
	cube.vy -= 0.5;
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
	minX: player.x - viewW,
	maxX: player.x + viewW,
	minY: player.y - viewH,
	maxY: player.y + viewH
    };
}

function floorHeight(worldX) {
    let SCALE;
    let AMP;
    let BASE
    //return floorY + cos(worldX * 1 + 45) * 25;
    if (worldX < 0) {
	SCALE = 0.00000002;
	AMP = -0.5;
	BASE = -floorY;
    } else {
	SCALE = 0.0002;
	AMP = 1;
	BASE = floorY;
    }

    const n = noise(worldX * SCALE);
    const h = (n - 229) * 2;

    return BASE + h * AMP;
    //return pow(1.02, worldX) / 50000;
    //return pow(worldX, 1/6) / 500000
}

function drawWavyFloor() {
    // Get view plane
    const view = getViewBounds();

    const step = 3;
    const startX = floor(view.minX / step) * step;
    const endX = ceil(view.maxX / step) * step;
    
    //drawing the floor
    push();
    stroke(100);
    fill(100, 200, 100);
    
    beginShape(TRIANGLE_STRIP);
    for (let x = startX; x <= endX; x += step) {
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
    textFont(font); // Sets the text font (I only had the coolest one close by at the time)
    
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
	sendState();
	sendInitialState = true;
    };

    // do stuff when message is recieved
    socket.onmessage = (event) => {
	const msg = JSON.parse(event.data);

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
    x: player.x, y: player.y, vx: player.vx, vy: player.vy
}));
}

// close socket before refreshing page
window.addEventListener("beforeunload", () => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.close();
  }
});
