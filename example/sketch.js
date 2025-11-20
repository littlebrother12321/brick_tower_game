let myColor;
let connected = false;

let colour;


let sprite_sheet;

function preload() {
    sprite_sheet = loadAni("./stoof.png", { width: 32, height: 32, frames: 2 });
}

function setup() {
    createCanvas(windowWidth,windowHeight);
    background(255);

    // connect to an instance of github.com/abachman/p5-websocket-server locally
    // connectWebsocket("ws://localhost:4004/p5.websocket-dev");
    // or the current reference server at wss://chat.reasonable.systems
    connectWebsocket("wss://chat.reasonable.systems/p5.websocket-dev");

    noStroke();
    fill(255);
    myColor = color(random(255), 128, random(255));
}

let x = 0;
let y = 0;
function draw() {
    push();
    clear();
    animation(sprite_sheet, x, y);
     if (keyIsDown(UP_ARROW) === true || keyIsDown(87)) {
	// sendMessage({ dir: 'up', state: 'pressed' });
            y -= 1;
    }  if (keyIsDown(DOWN_ARROW) === true || keyIsDown(83)) {
	// sendMessage({ dir: 'down', state: 'pressed' });
            y += 1;
    }  if (keyIsDown(LEFT_ARROW) === true || keyIsDown(65)) {
	// sendMessage({ dir: 'left', state: 'pressed'});
            x -= 1;
    }  if (keyIsDown(RIGHT_ARROW) === true || keyIsDown(68)) {
	// sendMessage({ dir: 'right', state: 'pressed'});
            x += 1;
    }
    if (keyIsDown(UP_ARROW) === true || keyIsDown(87) && keyIsDown(16)) {
        // sendMessage({ dir: 'up', state: 'pressed' });
        y -= 2;
    }  if (keyIsDown(DOWN_ARROW) === true || keyIsDown(83) && keyIsDown(16)) {
        // sendMessage({ dir: 'down', state: 'pressed' });
        y += 2;
    }  if (keyIsDown(LEFT_ARROW) === true || keyIsDown(65) && keyIsDown(16)) {
        // sendMessage({ dir: 'left', state: 'pressed'});
        x -= 2;
    }  if (keyIsDown(RIGHT_ARROW) === true || keyIsDown(68) && keyIsDown(16)) {
        // sendMessage({ dir: 'right', state: 'pressed'});
        x += 2;
    }
    pop();
}

// onConnection
function onConnection(uid) {
    console.log("i am connected as", uid);
}

function onDisconnection() {
    console.log("i am disconnected :(");
}

function connectReceived(otherId) {
    console.log("another sketch connected", otherId);
}

function disconnectReceived(otherId) {
    console.log("another sketch disconnected", otherId);
}

function messageReceived(data, uid) {
    console.log("messageReceived", data, uid);
    if (typeof data === "object") {
	let localColor = data.color || color(100);
	push();
	fill(localColor);


	clear();
	background(255);
	fill(myColor);
	draw();
	pop();
    }
}



function mousePressed() {
    sendMessage({
	x: mouseX,
	y: mouseY,
	color: myColor.toString(),
    });
}
