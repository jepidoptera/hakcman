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
    constructor(terrain) {
        this.terrain = terrain;
        this.passable = (terrain === "*" || terrain === "X" || terrain === "x") ? false : true;
    }
}
var gameBoardMap;
var donutsRemaining = Infinity;
var swipeAnimation = 0;

class Player {
    constructor() {
        this.x = 1;
        this.y = 1;
        this.direction = null;
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
            letOffKeys: []
        } 
    }

    die() {
        this.dead = true;
        this.direction = noDirection;
        this.controls.latestKeys = [];
        this.controls.letOffKeys = [];
        clearInterval(this.moveInterval);
        this.img = deadFace;
        // remove monsters
        monsters.forEach(monster => {
            clearInterval(monster.moveInterval);
        })
        setTimeout(() => {
            loadGame();
        }, 2000);
    }
    latestKeys = [];
    letOffKeys = [];
}
let player;

class Monster {
    constructor(x, y, name = "normie") {
        this.x = x;
        this.y = y;
        this.direction = [1, 0];
        if (name === "devil") {
            this.img = devilFace;
            this.speed = 10;
        }
        else {
            this.img = angryFace;
            this.speed = 6;
        }
        this.direction = directions[0];
        this.moveInterval = setInterval(() => this.move(), 1000 / this.speed)
    }

    move() {
        // monster movement rules:

        // 1. don't reverse course unless there is no other option, or
        // 2. when a new path (which isn't a course reversal) becomes available, 
        // (randomly) consider taking it


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
        // they will change direction when options for moving change
        // either hitting a wall, or coming across a new passage
        if ((newMoveOptions | this.moveOptions) != this.moveOptions || 
            !(newMoveOptions & 2 ** this.direction.index)) {
            let newDirection = directions[0];
            // // try to move toward player first
            let xdif = player.x - this.x;
            let ydif = player.y - this.y;
            if (Math.floor(Math.random() * (Math.abs(xdif) + Math.abs(ydif))) < Math.abs(xdif)) {
                newDirection = xdif > 0 ? directions[0] : directions[2];
            }
            else {
                newDirection = ydif > 0 ? directions[1] : directions[3];
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

        gameBoardMap[this.y][this.x].passable = true;
        this.x += this.direction.x;
        this.y += this.direction.y;
        gameBoardMap[this.y][this.x].passable = false;

        this.moveOptions = newMoveOptions | 2 ** this.direction.index;

        // did we get 'em??
        if (this.x === player.x && this.y === player.y) {
            this.x -= this.direction.x;
            this.y -= this.direction.y;
            player.die();
        }
    }
}
let monsters = [];

$(document).ready(() => {

    // player input
    $(document).on("keydown", function(e) {
        if (!player.controls.latestKeys.includes(e.key)) {
            player.controls.latestKeys.push(e.key);
        }
    })
    $(document).on("keyup", function(e) {
        player.letOffKeys.push(e.key);
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
        // $("#mousepos").text(event.clientX + " " + event.clientY);
    })
        
    // load images
    bricksImg = document.getElementById("bricksImg")
    smileFace = document.getElementById("smileFace")
    tongueFace = document.getElementById("tongueFace")
    angryFace = document.getElementById("angryFace")
    devilFace = document.getElementById("devilFace")
    deadFace = document.getElementById("deadFace")

    loadGame();

    requestAnimationFrame(drawGameBoard);

})

let mousePos ={x: 0, y: 0};

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
            if (char === "M") {
                monsters.push(new Monster(x, y));
                char = ' ';
            }
            if (char === "D") {
                monsters.push(new Monster(x, y, "devil"));
                char = ' ';
            }
            if (char === "+") {
                donutsRemaining ++;
            }
            if (char === "H") {
                player.x = x;
                player.y = y;
            }
            gameBoardMap[y][x] = new mapLocation(char);
        })
    })

    // testing::
    // donutsRemaining = 1;

    // load canvas
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext('2d');

    // calculate dimensions
    gameCellWidth = canvas.width / gameBoardWidth;
    gameCellHeight = canvas.height / gameBoardHeight;

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

        ctx.drawImage (monster.img, 
            gameCellWidth * monster.x, gameCellHeight * (monster.y - swipeAnimation),
            gameCellWidth, gameCellHeight)
        })
    
    // draw player
    player.offset = {
        x: player.direction.x * (Date.now() - player.lastFrame) / 1000 * player.speed,
        y: player.direction.y * (Date.now() - player.lastFrame) / 1000 * player.speed,
    }
    ctx.drawImage (player.img, 
        gameCellWidth * (player.x + player.offset.x), gameCellHeight * (player.y + player.offset.y - swipeAnimation),
        gameCellWidth, gameCellHeight)
    
    
    // console.log('frame rendered');
    requestAnimationFrame(drawGameBoard);

}

function movePlayer() {
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

    player.direction = noDirection;
    for (let i = player.controls.latestKeys.length - 1; i >= 0; i--) {
        let key = player.controls.latestKeys[i];
        if ((key === "ArrowUp" || moveUp) && player.y > 0) {
            player.direction = directions[3];
        }
        else if ((key === "ArrowDown"  || moveDown) && player.y < gameBoardHeight - 1) {
                player.direction = directions[1];
        }
        else if ((key === "ArrowLeft"  || moveLeft) && player.x > 0) {
            player.direction = directions[2];
        }
        else if ((key === "ArrowRight"  || moveRight) && player.x < gameBoardWidth - 1) {
            player.direction = directions[0];
        }
        if (gameBoardMap[player.y + player.direction.y][player.x + player.direction.x].passable) {
            break;
        }
        else player.direction = noDirection;
    }
    // if (!gameBoardMap[player.y + player.direction.y][player.x + player.direction.x].passable) {
    //     player.direction = noDirection;
    // }

    // process keys which have been released
    player.letOffKeys.forEach(offKey => {
        if (player.controls.latestKeys.includes(offKey)) {
            player.controls.latestKeys.splice(player.controls.latestKeys.indexOf(offKey), 1);
        }
    })
    player.letOffKeys = [];

    if (gameBoardMap[player.y][player.x].terrain === "+") {
        // eat a donut
        gameBoardMap[player.y][player.x].terrain = " ";
        donutsRemaining --;
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
                        if (location.terrain === "X") gameBoardMap[y][x].terrain = "O";
                        gameBoardMap[y][x].passable = true;
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

