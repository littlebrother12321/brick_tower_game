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
let floorY = -16;

//The player Pos using X and Y
let x = 0;
let y = floorY;

let vx = 0;
let vy = 0;

let sentInitialState = false;


// WebSocket stuff

let socket;
let myId = null;
let players = {};


function preload() {
    sprite_sheet = loadAni("./stoof.png", { width: 32, height: 32, frames: 2 });
}

function setup() {
    createCanvas(windowWidth,windowHeight, WEBGL);
    background(255);

    camera = createCamera();

    drawingContext.disable(drawingContext.DEPTH_TEST);

    // connect to websocket and set update interval
    socket = new WebSocket("ws://localhost:8080");
    setInterval(sendState, 50); // 20 Hz
    
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

    // Using normal websocket, no p5 websocket now.
    
    // connect to an instance of github.com/abachman/p5-websocket-server locally
    //connectWebsocket("wss://172.22.1.96:4004/p5.websocket-dev");
    //connectWebsocket("wss://127.0.0.1:4004/p5.websocket-dev");
    // or the current reference server at wss://chat.reasonable.systems
    //connectWebsocket("wss:chat.reasonable.systems/p5.websocket-dev");

    // Testing localhost websocket
    //connectWebsocket("ws://localhost:8080/p5.websocket-dev")
    
    noStroke();
    fill(0,200,0);
   //myColor = color(random(255), 128, random(255));
}

// close socket before refreshing page
window.addEventListener("beforeunload", () => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.close();
  }
});

// we gonna do stoof.

// All the list of the players (now at the top of file
//The draw function draws things
function draw() {

    //drawing the floor
    push();
    clear();
    //rect(0,floor,window.innerWidth,halfScreenY);
    push();
    translate(0, halfScreenY, 0);
    plane(window.innerWidth, window.innerHeight);
    pop();

    // Camera codes
    camera.setPosition(x, y - 100, 500);
    camera.lookAt(x, y, 0);
    //orbitControl();

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
    pop();

    
    // send over your player data to server
    sendState();
    
    // Handle socket errors and closes
    socket.onerror = (err) => {
	console.error("socket error", err);
    };

    socket.onclose = () => {
	console.log("socket closed");
    };
    pop();
} // end of draw function

function updatePhysics() {
    // cool gravity equations (Yeah.)
    vy += g;
    y += vy;

    // Hit floor
    if (y > floorY) {
	y = floorY;
	vy = 0;
    }
    
    // Friction equations
    if (vx > 0)	vx = max(0, vx - FRICTION);
    else if (vx < 0) vx = min(0, vx + FRICTION);
    x += vx;

    // moving around code
    if ((keyIsDown(UP_ARROW) || keyIsDown(87)) && y === floorY) vy = -2;
    if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) y += 1;
    if ((keyIsDown(LEFT_ARROW) || keyIsDown(65)) && (Math.abs(vx) <= 5)) vx -= 1;
    if ((keyIsDown(RIGHT_ARROW) || keyIsDown(68)) && (Math.abs(vx) <= 5)) vx += 1;
     //Sprinting
    if (keyIsDown(16)) { // shift speed boost
        if ((keyIsDown(UP_ARROW) || keyIsDown(87)) && y === floorY) vy = -4;
        if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) y += 1;
        if ((keyIsDown(LEFT_ARROW) || keyIsDown(65)) && (Math.abs(vx) <= 7)) vx -= 1;
        if ((keyIsDown(RIGHT_ARROW) || keyIsDown(68)) && (Math.abs(vx) <= 7)) vx += 1;
    };
}

function drawFloorGrid() {
    push();
    translate(0, floorY + 16, 0); //move to floor
    stroke(0, 255, 0);
    strokeWeight(1);

    const size = 50; // Spaces between lines
    const extent = 2000; // How far lines go
    for(let i = -extent; i <= extent; i += size) {
	line(i, 0, -extent, i, 0, extent); // Vertical lines
	line(-extent, 0, i, extent, 0, i); // Horizontal lines
    }
    pop();
}

function sendState() {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;

  socket.send(JSON.stringify({
    x, y, vx, vy
  }));
}




//  // onConnection, when connected to server, server wants your uid
//  function onConnection(uid) {
//     myId = uid;
//     console.log("i am connected as", uid); // says who I am
// }

// //when you disconnected say so
// function onDisconnection() {
//     console.log("i am disconnected :(");
// }
// //when other goofers say hi and connect/send data to you
// function connectReceived(otherId) {
//     console.log("another sketch connected", otherId);
//     players[otherId] = {
// 	x: 0,
// 	y: 0
//     };
// }
// // when your buddies leave
// function disconnectReceived(otherId) {
//     console.log("another sketch disconnected", otherId);
//     delete players[otherId];
// }
// // when you get a data, parse and like set up a new not you player
// function messageReceived(data, uid) {
//     console.log("RX from", uid, data);
//     if (!players[uid]) {
//         players[uid] = {
// 	    x: data.x,
// 	    y: data.y
// 	   // color: color(data.color)
//         };
//     } else {
//         players[uid].x = data.x;
//         players[uid].y = data.y;
//        // players[uid].color = color(data.color);
//     }
// }
