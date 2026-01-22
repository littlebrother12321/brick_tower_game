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
let x = -64;
let y = -5000;

// fysics
let vx = 0;
let vy = 0;
let grounded = false;

// Player AABB coordinates
const PLAYER_W = 32;
const PLAYER_H = 32;

// BOx collisions

const cube = {
    x: 0,
    y: -5000,
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
    
    // Camera codes
    camera.setPosition(x, y - 50, 500);
    camera.lookAt(x, y, 0);
    orbitControl(); // fixed camera, now constrained a bit
    
    push();
    drawWavyFloor();
    
    // Set text font
    textFont(font)    

    push();
    translate(cube.x, cube.y + 16, 0);
    stroke(2);
    box(cube.w,cube.h,sqrt(pow(cube.vx, 2) + pow(cube.vy, 2)) * 16); // Box for physics testing
    pop();
    
    // Grid for reference
    drawFloorGrid();

    // Runs updatephysics, look below for details
    updatePhysics();
    
    // animation(sprite_sheet, x, y); This line got comented out
    //console.log("x: " + x + " y: " + y + " vx: " + vx + " vy: " + vy);
    //console.log("camX: " + camera.eyeX, "camY: " + camera.eyeY);

    //loop though players and draws them
    for (let id in players) {
	if (id !== myId) {
            push();
            //  fill(players[id].color);
	    translate(
		players[id].x,
		players[id].y,
		1
	    );
	    animation(sprite_sheet, 0, 0);
            pop();
        };
    }
    
    // play animation at location of camera x y.
    push();
    translate(x, y, 0);
    animation(sprite_sheet, 0, 0);
    // Set text color
    fill(0,0,0)
    // Show text coordinates on player
    text(round(x) + "\n" + round(y), 10, -20); // Round Y because floating point errors are annoying
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
    if ((keyIsDown(LEFT_ARROW) || keyIsDown(65)) && vx >= -4) vx -= 1;
    if ((keyIsDown(RIGHT_ARROW) || keyIsDown(68)) && vx <= 4) vx += 1;

    if ((keyIsDown(UP_ARROW) || keyIsDown(87)) && grounded) {
	vy = -2;
    }

    if (keyIsDown(16)) {
	if ((keyIsDown(LEFT_ARROW) || keyIsDown(65)) && vx >= -7) vx -= 2;
	if ((keyIsDown(RIGHT_ARROW) || keyIsDown(68)) && vx <= 7) vx += 2;

	if ((keyIsDown(UP_ARROW) || keyIsDown(87)) && grounded) {
	    vy = -4;
	}
    }
    
    // gravity
    vy += g;

    // friction
    if (vx > 0) vx = max(0, vx - FRICTION);
    else if (vx < 0) vx = min(0, vx + FRICTION);

    // ---- X AXIS ----
    x += vx;
    resolveXCollision(boxAABB());

    // ---- Y AXIS ----
    const prevY = y;
    y += vy;

    // floor
    const footY = floorHeight(x);
    
    if (y > footY) {
	y = footY;
	//vy = 0;
	grounded = true;
    } else {
	grounded = false;
    }

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
}

// Player collisions (made with love + chat)
function playerAABB(px = x, py = y) {
    return {
	minX: px - PLAYER_W / 2,
	maxX: px + PLAYER_W / 2,
	minY: py - PLAYER_H,
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

    if (vx !== 0) {
	cube.vx += vx * 0.2;
    }
    
    if (vx > 0) {
	x = collider.minX - PLAYER_W / 2;
    } else if (vx < 0) {
	x = collider.maxX + PLAYER_W / 2;
    }

    // player thing
    vx = 0;

}

function resolveYCollision(collider, prevY) {
    const p = playerAABB();

    if (!aabbIntersect(p, collider)) return;

    // Landing on top
    if (vy > 0 && prevY <= collider.minY) {
	y = collider.minY;
	vy = 0;
	grounded = true;

	// pushing the cueb down
	cube.vy += g * 2;
    }

    // Hitting head
    else if (vy < 0 && prevY >= collider.maxY) {
	y = collider.maxY + PLAYER_H;
	vy = 0;
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

function floorHeight(worldX) {
    //return floorY + cos(worldX * 1 + 45) * 25;
    //return pow(1.01, worldX) / 50000;
    return pow(worldX, 1/6) / 500000
}

function drawWavyFloor() {
    //drawing the floor
    push();
    stroke(100);
    fill(100, 200, 100);
    
    beginShape(TRIANGLE_STRIP);
    for (let i = -2500; i <= 2500; i += 20) {
	const j = floorHeight(i);
	vertex(i, j + 16, -1);
	vertex(i, j + 5000, -1);
    }
    endShape();

    pop();
}

function drawFloorGrid() {
    push();
    translate(0, floorY + 16, 0); //move to floor
    strokeWeight(1); // Set line thickness
    textFont(font); // Sets the text font (I only had the coolest one close by at the time)
    
    const size = 50; // Spaces between lines
    const extent = 2000; // How far lines go
    // Draw the lines
    for(let i = -extent; i <= extent; i += size) {
	//stroke(255,0,0);
	// line(i, 0, -extent, i, 0, extent); // XZ plane vertical lines
	// line(-extent, 0, i, extent, 0, i); // XZ plane horizontal lines
	// stroke(0,0,255)
	// line(0, -extent, i, 0, extent, i); // YZ plane vertical lines
	// line(0, i, -extent, 0, i, extent); // YZ plane horizontal lines
	stroke(200,200,200);
	fill(0,0,0);
	text(i, i, 0); // X coordinate text
	text(i, 0, i); // Y coordinate text
	line(i, -extent, 0, i, extent, 0); // XY plane vertical lines (the only meaningful ones)
	line(-extent, i, 0, extent, i, 0); // Ditto but horizontal
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
    x, y, vx, vy
  }));
}

// close socket before refreshing page
window.addEventListener("beforeunload", () => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.close();
  }
});
