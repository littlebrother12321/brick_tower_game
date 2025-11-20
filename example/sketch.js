let myColor;
let connected = false;

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
let players = {};
let myId = null;

function draw() {
    push();
    clear();
    // animation(sprite_sheet, x, y);
    if (keyIsDown(UP_ARROW) || keyIsDown(87)) y -= 1;
    if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) y += 1;
    if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) x -= 1;
    if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) x += 1;

    if (keyIsDown(16)) { // shift speed boost
        if (keyIsDown(UP_ARROW) || keyIsDown(87)) y -= 1;
        if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) y += 1;
        if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) x -= 1;
        if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) x += 1;
    };

    for (let id in players) {
	if (id !== myId) {
            push();
            fill(players[id].color);
            animation(sprite_sheet, players[id].x, players[id].y);
            pop();
	};
    }

    animation(sprite_sheet, x, y);

    sendMessage({x, y, color: myColor.toString()  });

}


// onConnection
function onConnection(uid) {
    myId = uid;
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
    delete players[otherId];
}

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
