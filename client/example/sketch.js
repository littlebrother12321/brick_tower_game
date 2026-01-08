//play's colour'
let myColor;
// yes or no for if the playr is connected
let connected = false;
// the sprite sheet
let sprite_sheet;

const g = 0.1;

function preload() {
    sprite_sheet = loadAni("./stoof.png", { width: 32, height: 32, frames: 2 });
}

function setup() {
    createCanvas(windowWidth,windowHeight);
    background(255);

    // connect to an instance of github.com/abachman/p5-websocket-server locally
    //connectWebsocket("wss://172.22.1.96:4004/p5.websocket-dev");
    //connectWebsocket("wss://127.0.0.1:4004/p5.websocket-dev");
    // or the current reference server at wss://chat.reasonable.systems
    connectWebsocket("wss:chat.reasonable.systems/p5.websocket-dev");

    noStroke();
    fill(0,200,0);
    myColor = color(random(255), 128, random(255));
}
// we gonna do stoof.

const halfScreenX = window.innerWidth/2;
const halfScreenY = window.innerHeight/2;
//The player Pos using X and Y
let x = halfScreenX;
let y = halfScreenY;
let floor = halfScreenY;

let vx = 0;
let vy = 0;

// All the list of the players
let players = {};
let myId = null;
//The draw function draws things
function draw() {

    push();
    clear();

    rect(0,floor,window.innerWidth,halfScreenY);
    
    // cool gravity equations
    if (y << floor) {
	y += vy;	
    }
    if (y >= floor) {
	vy = 0
	y = floor
    }
    if (vx > 0){
	vx -= .5;
    } else if (vx < 0){
	vx += .5;
    }
    x += vx;
    // animation(sprite_sheet, x, y); This line got comented out

    vy += g;
    // moving around code
    if (keyIsDown(UP_ARROW) || keyIsDown(87) && !(y < floor)) vy -= 2;
    if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) y += 1;
    if (keyIsDown(LEFT_ARROW) || keyIsDown(65) && (Math.abs(vx) <=5)) vx -= 1;
    if (keyIsDown(RIGHT_ARROW) || keyIsDown(68) && (Math.abs(vx) <=5)) vx += 1;
     //Sprinting \/
    if (keyIsDown(16)) { // shift speed boost
        if (keyIsDown(UP_ARROW) || keyIsDown(87) && !(y < floor)) vy -= 2;
        if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) y += 1;
        if (keyIsDown(LEFT_ARROW) || keyIsDown(65) && (Math.abs(vx) <=7)) vx -= 1;
        if (keyIsDown(RIGHT_ARROW) || keyIsDown(68) && (Math.abs(vx) <=7)) vx += 1;
    };

        //loop though players and draws them
    for (let id in players) {
	if (id !== myId) {
            push();
            fill(players[id].color);
            animation(sprite_sheet, players[id].x, players[id].y);
            pop();
        };
    }
// play animation at location of player x y.
    animation(sprite_sheet, x, y-16);
// send over your player data to server
    sendMessage({x, y, color: myColor.toString()  });

} // end of draw function


// onConnection, when connected to server, server wants your uid
function onConnection(uid) {
    myId = uid;
    console.log("i am connected as", uid); // says who I am
}

//when you disconnected say so
function onDisconnection() {
    console.log("i am disconnected :(");
}
//when other goofers say hi and connect/send data to you
function connectReceived(otherId) {
    console.log("another sketch connected", otherId);
}
// when your buddies leave
function disconnectReceived(otherId) {
    console.log("another sketch disconnected", otherId);
    delete players[otherId];
}
// when you get a data, parse and like set up a new not you player
function messageReceived(data, uid) {
    console.log("messageReceived", data, uid);
    if (!players[uid]) {
        players[uid] = {
	    x: data.x,
	    y: data.y,
	    color: color(data.color)
        };
    } else {
        players[uid].x = data.x;
        players[uid].y = data.y;
        players[uid].color = color(data.color);
    }
}
