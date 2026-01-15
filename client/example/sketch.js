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

    socket = new WebSocket("ws://localhost:8080");

    socket.onopen = () => {
	console.log("socket connected");
    };

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
// we gonna do stoof.

const halfScreenX = window.innerWidth/2;
const halfScreenY = window.innerHeight/2;
//The player Pos using X and Y
let x = 0;
let y = 0;
let floor = 0;

let vx = 0;
let vy = 0;

let sentInitialState = false;

// All the list of the players (now at the top of file
//The draw function draws things
function draw() {

    push();
    clear();
    //rect(0,floor,window.innerWidth,halfScreenY);
    push();
    translate(0, halfScreenY + 16, 0);
    plane(window.innerWidth, window.innerHeight);
    pop();
  
    // cool gravity equations (Yeah.)

    if (y < floor) {
	vy += g;
    } else {
	y = floor;
	vy = 0;
    }
    //if (y >= floor) {
	//vy = 0;
	//y = floor;
    //}
    // Friction equations
    if (vx > 0){
	vx -= .5;
    } else if (vx < 0){
	vx += .5;
    }
    x += vx;
    y += vy;
    // animation(sprite_sheet, x, y); This line got comented out
    //console.log("x: " + x + " y: " + y + " vx: " + vx + " vy: " + vy);
    //console.log("camX: " + camera.eyeX, "camY: " + camera.eyeY);
    // moving around code
    if ((keyIsDown(UP_ARROW) || keyIsDown(87)) && ( y >= floor)) vy -= 2;
    if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) y += 1;
    if ((keyIsDown(LEFT_ARROW) || keyIsDown(65)) && (Math.abs(vx) <= 5)) vx -= 1;
    if ((keyIsDown(RIGHT_ARROW) || keyIsDown(68)) && (Math.abs(vx) <= 5)) vx += 1;
     //Sprinting
    if (keyIsDown(16)) { // shift speed boost
        if ((keyIsDown(UP_ARROW) || keyIsDown(87)) && (y >= floor)) vy -= 2;
        if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) y += 1;
        if ((keyIsDown(LEFT_ARROW) || keyIsDown(65)) && (Math.abs(vx) <= 7)) vx -= 1;
        if ((keyIsDown(RIGHT_ARROW) || keyIsDown(68)) && (Math.abs(vx) <= 7)) vx += 1;
    };

    camera.setPosition(x, y, -300);
    camera.lookAt(x, y, 0);
    //orbitControl();
        //loop though players and draws them
    for (let id in players) {
	if (id !== myId) {
            push();
            //  fill(players[id].color);
	    translate(
		players[id].x - x,
		players[id].y - y,
		1
	    );
	    animation(sprite_sheet, 0, 0);
            pop();
        };
    }
    // play animation at location of camera x y.
    push();
    //translate(x, y, 0);
    animation(sprite_sheet, 0, 0);
    pop();
// send over your player data to server
    if (!sentInitialState == false || vx !== 0 && vy !== 0) {
	sendState();
	sentInitialState = true;
    }
} // end of draw function


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
