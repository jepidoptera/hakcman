let gameBoardWidth = 27;
let gameBoardHeight = 27;
let gameCellWidth;
let gameCellHeight;

var canvas;
var ctx;

var bricksImg;
var smileFace;
var tongueFace;
var angryFace;
var irkFace;
var devilFace;
var deadFace;

const directions = [
    {x:1, y:0, index:0}, 
    {x:0, y:1, index:1}, 
    {x:-1, y:0, index:2}, 
    {x:0, y:-1, index:3}
]
const noDirection = {x: 0, y: 0, index: -1};

class mapLocation {
    constructor(char, x, y) {
        if (char === "m") {
            monsters.push(new Monster(x, y, "irk"));
            char = ' ';
        }
        if (char === "M") {
            monsters.push(new Monster(x, y, "angry"));
            char = ' ';
        }
        if (char === "T") {
            monsters.push(new Monster(x, y, "turd"));
            char = ' ';
        }
        if (char === "D") {
            monsters.push(new Monster(x, y, "devil"));
            char = ' ';
        }
        if (char === "+") {
            donutsRemaining ++;
            let newDonut = new PowerUp(x, y, "donut");
            donuts.push (newDonut);
            this.powerUp = newDonut;
        }
        if (char === "H") {
            player.locate(x, y);
        }
        this.terrain = char;
        this.passable = (char === "*" || char === "X" || char === "x") ? false : true;
    }
}
var gameBoardMap;
var nodeMap;
var donutsRemaining = Infinity;
var maximumDonuts = 0;
var swipeAnimation = 0;
let paused = true;

class PowerUp {
    constructor(x, y, type = "donut") {
        this.x = x;
        this.y = y;
        this.type = type;
        if (type === "donut") {
            this.char = "+";
        }
        this.exists = true;
    }
    eat() {
        if (this.exists) {
            this.exists = false;
            gameBoardMap[this.y][this.x].terrain = " ";
            if (this.type === "donut") donutsRemaining --;
        }
    }
    respawn() {
        gameBoardMap[this.y][this.x].terrain = this.char;
        if (this.type === "donut") donutsRemaining ++;
        this.exists = true;
    }
}
let donuts = [];


class Player {
    constructor() {
        this.x = 1;
        this.y = 1;
        this.direction = noDirection;
        this.facetimeout = null;
        this.img = smileFace;
        this.dead = false;
        this.speed = 10;
        this.direction = noDirection;
        this.moveInterval = setInterval(movePlayer, 1000 / this.speed);
        this.lastFrame = Date.now();
        this.controls = {
            mouseButton: false,
            latestKeys: [],
            letOffKeys: [],
        } 
    }

    locate(x, y) {
        this.x = x;
        this.y = y;
        this.start_x = x;
        this.start_y = y;
    }

    respawn() {
        gameBoardMap[this.y][this.x].passable = true;
        this.x = this.start_x;
        this.y = this.start_y;
        resetMap();
        this.dead = false;
        this.img = smileFace;
        this.moveInterval = setInterval(movePlayer, 1000 / this.speed);
    }

    die() {
        if (this.dead) return;
        this.dead = true;
        this.direction = noDirection;
        this.controls.latestKeys = [];
        this.controls.letOffKeys = [];
        clearInterval(this.moveInterval);
        this.img = deadFace;
        setTimeout(() => {
           this.respawn();
        }, 2000);
    }
}
let player;

class Monster {
    constructor(x, y, name = "angry") {
        this.x = x;
        this.y = y;
        this.lastFrame = Date.now();
        if (name === "devil") {
            this.img = devilFace;
            this.speed = 10;
            this.followDistance = 99;
            this.pathFinder = 0.01;
        }
        else if (name === "angry") {
            this.img = angryFace;
            this.speed = 6;
            this.followDistance = 10;
        }
        else if (name === "irk") {
            this.img = irkFace;
            this.speed = 4;
            this.followDistance = 4;
        }
        else if (name === "turd") {
            this.img = turdFace;
            this.speed = 2;
            this.followDistance = 99;
            this.pathFinder = 1.0;
        }
        this.direction = noDirection;
        this.path = [];
        this.moveInterval = setInterval(() => this.move(), 1000 / this.speed)
        this.start_position = {x: x, y: y};
    }

    respawn() {
        gameBoardMap[this.y][this.x].passable = true;
        gameBoardMap[this.y + this.direction.y][this.x + this.direction.x].passable = true;
        nodeMap.grid[this.y][this.x].weight = 1;
        nodeMap.grid[this.y + this.direction.y][this.x + this.direction.x].weight = 1;
        this.x = this.start_position.x;
        this.y = this.start_position.y;
        this.direction = noDirection;
    }

    move() {
        if (paused) return;

        gameBoardMap[this.y][this.x].passable = true;
        nodeMap.grid[this.y][this.x].weight = 1;
        this.x += this.direction.x;
        this.y += this.direction.y;

        // did we get 'em??
        if (this.x === player.x && this.y === player.y) {
            this.x -= this.direction.x;
            this.y -= this.direction.y;
            player.die();
            this.lastFrame = Date.now();
            return;
        }

        // check which options are available to move towards
        let newMoveOptions = directions.reduce((sum, direction, i) => {
            if (!gameBoardMap[this.y + direction.y][this.x + direction.x].passable ||
                Math.abs(direction.index - this.direction.index) === 2) {
                return sum;
            }
            else {
                return sum + 2 ** i;
            }
        }, 0);

        if (this.pathFinder > Math.random()) this.findPath();
        if (this.path.length === 0) {
        // non-pathfinding monster movement rules:

        // 1. don't reverse course unless there is no other option, or
        // 2. when a new path (which isn't a course reversal) becomes available, 
        // (randomly) consider taking it
            
            // they will change direction when options for moving change
            // either hitting a wall, or coming across a new passage
            if ((newMoveOptions | this.moveOptions) != this.moveOptions || 
                !(newMoveOptions & 2 ** this.direction.index)) {
                let newDirection = directions[0];

                let xdif = player.x - this.x;
                let ydif = player.y - this.y;
                if (xdif + ydif < this.followDistance) {
                // // try to move toward player first
                    if (Math.floor(Math.random() * (Math.abs(xdif) + Math.abs(ydif))) < Math.abs(xdif)) {
                        newDirection = xdif > 0 ? directions[0] : directions[2];
                    }
                    else {
                        newDirection = ydif > 0 ? directions[1] : directions[3];
                    }
                }
                // but if that's not going to work out, due to a wall,
                // or because it would be going backwards...
                if (!gameBoardMap[this.y + newDirection.y][this.x + newDirection.x].passable 
                    || Math.abs(newDirection.index - this.direction.index) === 2) {
                        directions.forEach((direction, i) => {
                            // go anywhere but backwards
                            if (Math.abs(this.direction.index - i) != 2 &&
                            gameBoardMap[this.y + direction.y]
                            [this.x + direction.x].passable) {
                                newDirection = direction;
                            } 
                        })
                }
                this.direction = newDirection;
            }

            let tries = 0;
            while (!gameBoardMap[this.y + this.direction.y]
                [this.x + this.direction.x].passable && tries < 4) {
                    // hit a wall - change direction
                    // should only ever happen in the case of a dead end
                    this.direction = directions[(this.direction.index + 1) % directions.length];
                    tries ++;
                }
            
            // in the event that they are totally stuck, don't move this round
            if (tries == 4) this.direction = {x: 0, y: 0, index: -1};

        }
        else {
            // following a defined path
            let nextmove = this.path.shift();
            if (nextmove.x > this.x) this.direction = directions[0];
            if (nextmove.y > this.y) this.direction = directions[1];
            if (nextmove.x < this.x) this.direction = directions[2];
            if (nextmove.y < this.y) this.direction = directions[3];
        }
        this.moveOptions = newMoveOptions | 2 ** this.direction.index;

        // block off the square we are moving to at this point, so other monsters don't overlap
        gameBoardMap[this.y + this.direction.y][this.x + this.direction.x].passable = false;
        nodeMap.grid[this.y + this.direction.y][this.x + this.direction.x].weight = 0;

        this.lastFrame = Date.now();
    }
    findPath() {
        this.path = pathFinder.search(nodeMap, nodeMap.grid[this.y][this.x], nodeMap.grid[player.y][player.x])
    }
}
let monsters = [];

$(document).ready(() => {

    // player input
    $(document).on("keydown", function(e) {
        if (!player.controls.latestKeys.includes(e.key)) {
            player.controls.latestKeys.push(e.key);
        }
        if (e.key===" ") {
            if (paused) unPause();
            else pause();
        }
    })
    $(document).on("keyup", function(e) {
        player.controls.letOffKeys.push(e.key);
    })
    $(document).on("mousedown", function(e) {
        player.controls.mouseButton = true;
    })
    $(document).on("mouseup", function(e) {
        player.controls.mouseButton = false;
    })
    
    $("#gameCanvas").mousemove(function(event) {
        mousePos = {x: event.clientX / $(this).width(), y: event.clientY / $(this).height()}
        // $("#mousepos").text(event.clientX + " " + event.clientY);
    })

    // phone events??
    $(document).on("vmousedown", function(e) {
        player.controls.mouseButton = true;
    })
    $(document).on("vmouseup", function(e) {
        player.controls.mouseButton = false;
    })
    
    $(document).on("vmousemove", function(event) {
        mousePos = {x: event.pageX / $("#gameCanvas").width(), y: event.clientY / $("#gameCanvas").height()}
    })
        
    // load images
    bricksImg = document.getElementById("bricksImg")
    smileFace = document.getElementById("smileFace")
    tongueFace = document.getElementById("tongueFace")
    angryFace = document.getElementById("angryFace")
    irkFace = document.getElementById("irkedFace")
    turdFace = document.getElementById("poopFace")
    devilFace = document.getElementById("devilFace")
    deadFace = document.getElementById("deadFace")

    loadGame();

    requestAnimationFrame(drawGameBoard);

})

let mousePos = {x: 0, y: 0};

function loadGame() {
    // reset monsters, player, and donuts
    monsters = [];
    player = new Player();
    donutsRemaining = 0
    // load map
    let mapText = $("#levelData").text()
        .split("\n").map((line) => {
            return line.split('');
    });
    gameBoardMap = Array(mapText.length);
    mapText.forEach((row, y) => {
        gameBoardMap[y] = Array(row.length)
        row.forEach((char, x) => {
            gameBoardMap[y][x] = new mapLocation(char, x, y);
        })
    })

    // testing::
    // donutsRemaining = 1;
    maximumDonuts = donutsRemaining;

    // load canvas
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext('2d');

    // calculate dimensions
    gameCellWidth = canvas.width / gameBoardWidth;
    gameCellHeight = canvas.height / gameBoardHeight;

    // get a node-based interpretation of the map
    nodeMap = new Graph(gameBoardMap.map(row => {
        return row.map(node => {
            return node.passable ? 1 : 0;
        })
    }))
}

function resetMap() {
    // put back ten percent of donuts
    const enoughDonuts = Math.min(donutsRemaining + maximumDonuts / 10, maximumDonuts);
    const firstDonut = Math.floor(Math.random() * maximumDonuts);
    for (i in donuts) {
        let n = (parseInt(i) + firstDonut) % maximumDonuts;
        if (!donuts[n].exists) {
            donuts[n].respawn();
        }
        if (donutsRemaining >= enoughDonuts) {
            break;
        }
    }
    // monsters
    monsters.forEach(monster => {
        monster.respawn();
    })
    // close up escape route
    gameBoardMap.forEach((row, y) => {
        row.forEach((char, x) => {
            if (gameBoardMap[y][x].terrain === "O") {
                gameBoardMap[y][x].terrain = "X";
            }
        })
    })
}

function drawGameBoard() {
    ctx.clearRect(0, 0,
        canvas.width, canvas.height)

    for (let x = 0; x < gameBoardWidth; x++) {
        for (let y = 0; y < gameBoardHeight; y++) {

            if (gameBoardMap[y][x].terrain === "*" || gameBoardMap[y][x].terrain.toLowerCase() === "x") {
                ctx.drawImage(bricksImg, 
                    gameCellWidth * x, gameCellHeight * (y - swipeAnimation),
                    gameCellWidth, gameCellHeight)
            }
            else if (gameBoardMap[y][x].terrain === "+") {
                ctx.drawImage(donutImg, 
                    gameCellWidth * x, gameCellHeight * (y - swipeAnimation),
                    gameCellWidth, gameCellHeight)
            }
        }
    }

    // draw monsters
    monsters.forEach(monster => {
        monster.offset = {
            x: monster.direction.x * Math.min((Date.now() - monster.lastFrame) / 1000 * monster.speed, 1),
            y: monster.direction.y * Math.min((Date.now() - monster.lastFrame) / 1000 * monster.speed, 1),
        }
        ctx.drawImage (monster.img, 
            gameCellWidth * (monster.x + monster.offset.x), 
            gameCellHeight * (monster.y + monster.offset.y - swipeAnimation),
            gameCellWidth, gameCellHeight)
        })
    
    // draw player
    player.offset = {
        x: player.direction.x * Math.min((Date.now() - player.lastFrame) / 1000 * player.speed, 1),
        y: player.direction.y * Math.min((Date.now() - player.lastFrame) / 1000 * player.speed, 1)
    }
    ctx.drawImage (player.img, 
        gameCellWidth * (player.x + player.offset.x), gameCellHeight * (player.y + player.offset.y - swipeAnimation),
        gameCellWidth, gameCellHeight)
    
    
    // console.log('frame rendered');
    requestAnimationFrame(drawGameBoard);

}

function pause() { 
    paused = true 
    $("#startButton").show();
}
function unPause() {
    paused = false;
    $("#startButton").hide();
}

function movePlayer() {
    if (paused) return;

    if (nodeMap.nodes.filter(node => gameBoardMap[node.y][node.x].terrain==="*" && gameBoardMap[node.y][node.x].passable).length > 0) {
        let er = 1;
    }
    player.lastFrame = Date.now();

    player.x += player.direction.x;
    player.y += player.direction.y;

    let xdif = Math.round(mousePos.x * gameBoardWidth) - player.x;
    let ydif = Math.round(mousePos.y * gameBoardHeight) - player.y;
    let moveUp, moveDown, moveLeft, moveRight;

    if (player.controls.mouseButton) {
        if (xdif > 0) {
            moveRight = true;
        }
        else if (xdif < 0) {
            moveLeft = true;
        }
        if (ydif < 0) {
            moveUp = true;
        }
        else if (ydif > 0) {
            moveDown = true;
        }
    }

    // process keys which have been released
    player.controls.letOffKeys.forEach(offKey => {
        if (player.controls.latestKeys.includes(offKey)) {
            player.controls.latestKeys.splice(player.controls.latestKeys.indexOf(offKey), 1);
        }
    })
    player.controls.letOffKeys = [];

    
    let currentDirection = player.direction;
    let newDirection = undefined;
    player.direction = noDirection;
    for (let i = player.controls.latestKeys.length - 1; i >= 0; i--) {
        let key = player.controls.latestKeys[i];
        if ((key === "ArrowUp" || moveUp) && player.y > 0) {
            newDirection = directions[3];
        }
        else if ((key === "ArrowDown"  || moveDown) && player.y < gameBoardHeight - 1) {
            newDirection = directions[1];
        }
        else if ((key === "ArrowLeft"  || moveLeft) && player.x > 0) {
            newDirection = directions[2];
        }
        else if ((key === "ArrowRight"  || moveRight) && player.x < gameBoardWidth - 1) {
            newDirection = directions[0];
        }
        if (newDirection && (
            gameBoardMap[player.y + newDirection.y][player.x + newDirection.x].passable
            || gameBoardMap[player.y + newDirection.y][player.x + newDirection.x].terrain === "O")) {
            if (player.direction === noDirection) {
                player.direction = newDirection;
            }
            // always prefer to go in a direction you're not currently going
            if (newDirection != currentDirection) {
                player.direction = newDirection;
                break;
            } 
        }
    }
    // if (!gameBoardMap[player.y + player.direction.y][player.x + player.direction.x].passable) {
    //     player.direction = noDirection;
    // }


    if (gameBoardMap[player.y][player.x].powerUp) {

        gameBoardMap[player.y][player.x].powerUp.eat();

        player.img = tongueFace;
        clearInterval(player.facetimeout);
        player.facetimeout = setTimeout(() => {
            // reset player emoji
            if (player.img !== deadFace) player.img = smileFace;
        }, 100)
        console.log('ate a donut');
        // was that the last of them??
        if (donutsRemaining === 0) {
            // X's on map explode
            gameBoardMap.forEach((row, y) => {
                row.forEach((location, x) => {
                    if (location.terrain === "X" || location.terrain === "x") {
                        // capital Xs become escape route
                        if (location.terrain === "X") 
                            gameBoardMap[y][x].terrain = "O";
                        else {
                            gameBoardMap[y][x].terrain = " ";
                            gameBoardMap[y][x].passable = true;
                        }
                        let explosionImg = $("<img>")
                            .attr("src", "/images/boom.gif")
                            .css({
                                "top": y/gameBoardHeight*100 + "vmin",
                                "left": "Calc(" + x/gameBoardWidth*100 + "vmin + " + 
                                ($(document).width() - $("#gameCanvas").width())/ 2 + "px)",
                                "height": 1/gameBoardHeight*100 + "vmin",
                                "width": 1/gameBoardWidth*100 + "vmin",
                                "z-index": "100"
                            })
                            .addClass("blockimg")
                            .appendTo(document.body)
                        setTimeout(() => {
                            explosionImg.remove();
                        }, 1000);
                    }
                })
            })
        }
    }
    if (gameBoardMap[player.y][player.x].terrain === "O") {
        // next level
        console.log("next level!");
        $("#gameCanvas").addClass("swipeUp");
        swipeInterval = setInterval(() => {
            swipeAnimation ++;
        }, 33);
        setTimeout(() => {
            clearInterval(swipeInterval);
            window.location.href="/game/" + (parseInt($("#levelNumber").text()) + 1);
        }, 1000);
    }
    // check monsters
    monsters.forEach(monster => {
        if (monster.x === player.x && monster.y === player.y) {
            player.die();
        }
    })
}

