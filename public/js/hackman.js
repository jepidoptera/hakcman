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
var deadFace;

const playerControls = {
    ArrowUp: false, 
    ArrowDown: false, 
    ArrowLeft: false, 
    ArrowRight: false,
    MouseButon: false
} 

const directions = [
    {x:1, y:0, index:0}, 
    {x:0, y:1, index:1}, 
    {x:-1, y:0, index:2}, 
    {x:0, y:-1, index:3}
]

class mapLocation {
    constructor(terrain) {
        this.terrain = terrain;
        this.passable = terrain === "*" ? false : true;
    }
}
var gameBoardMap;

class Player {
    constructor() {
        this.x = 1;
        this.y = 1;
        this.direction = null;
        this.facetimeout = null;
        this.img = smileFace;
        this.dead = false;
        this.moveInterval = setInterval(movePlayer, 100);
    }

    die() {
        this.dead = true;
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
}
let player;

class Monster {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.direction = [1, 0];
        this.img = angryFace;
        this.direction = directions[0];
        this.speed = 6;
        this.moveInterval = setInterval(() => this.move(), 1000 / this.speed)
    }

    move() {
        // monster movement rules:

        // 1. don't reverse course unless there is no other option, or
        // 2. when a new path (which isn't a course reversal) becomes available, (randomly) consider taking it


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
        playerControls[e.key] = true
    })
    $(document).on("keyup", function(e) {
        playerControls[e.key] = false;
    })
    $(document).on("mousedown", function(e) {
        playerControls.MouseButon = true;
    })
    $(document).on("mouseup", function(e) {
        playerControls.MouseButon = false;
    })
    
    $("#gameCanvas").mousemove(function(event) {
        mousePos = {x: event.clientX / $(this).width(), y: event.clientY / $(this).height()}
        // $("#mousepos").text(event.clientX + " " + event.clientY);
    })
        
    // load images
    bricksImg = document.getElementById("bricksImg")
    smileFace = document.getElementById("smileFace")
    tongueFace = document.getElementById("tongueFace")
    angryFace = document.getElementById("angryFace")
    deadFace = document.getElementById("deadFace")

    loadGame();

    requestAnimationFrame(drawGameBoard);

})

let mousePos ={x: 0, y: 0};

function loadGame() {
    // reset monsters and player
    monsters = [];
    player = new Player();
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
            gameBoardMap[y][x] = new mapLocation(char);
        })
    })

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

            if (gameBoardMap[y][x].terrain === "*") {
                ctx.drawImage(bricksImg, 
                    gameCellWidth * x, gameCellHeight * y,
                    gameCellWidth, gameCellHeight)
            }
            else if (gameBoardMap[y][x].terrain === "+") {
                ctx.drawImage(donutImg, 
                    gameCellWidth * x, gameCellHeight * y,
                    gameCellWidth, gameCellHeight)
            }
        }
    }

    // draw monsters
    monsters.forEach(monster => {
        ctx.drawImage (monster.img, 
            gameCellWidth * monster.x, gameCellHeight * monster.y,
            gameCellWidth, gameCellHeight)
        })
    
    // draw player
    ctx.drawImage (player.img, 
        gameCellWidth * player.x, gameCellHeight * player.y,
        gameCellWidth, gameCellHeight)
    
    
    // console.log('frame rendered');
    requestAnimationFrame(drawGameBoard);

}

function movePlayer() {
    let moved = false;

    let xdif = Math.round(mousePos.x * gameBoardWidth) - player.x;
    let ydif = Math.round(mousePos.y * gameBoardHeight) - player.y;
    let moveUp, moveDown, moveLeft, moveRight;

    if (playerControls.MouseButon) {
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
    if (playerControls.ArrowUp || moveUp) {
        if (player.y > 0 && gameBoardMap[player.y - 1][player.x].passable) {
            --player.y;
            moved = true;
        }
    }
    if ((playerControls.ArrowDown || moveDown) && !moved) {
        if (player.y < gameBoardHeight - 1 
            && gameBoardMap[player.y + 1][player.x].passable) {
            ++player.y;
            moved = true;
        }
    }
    if ((playerControls.ArrowLeft || moveLeft) && !moved ) {
        if (player.x > 0 && gameBoardMap[player.y][player.x-1].passable) {
            --player.x;
            moved = true;
        }
    }
    if ((playerControls.ArrowRight || moveRight) && !moved ) {
        if (player.x < gameBoardWidth - 1 && gameBoardMap[player.y][player.x + 1].passable) {
            ++player.x;
            moved = true;
        }
    }
    if (gameBoardMap[player.y][player.x].terrain === "+") {
        // eat a donut
        gameBoardMap[player.y][player.x].terrain = " ";
        player.img = tongueFace;
        clearInterval(player.facetimeout);
        player.facetimeout = setTimeout(() => {
            // reset player emoji
            player.img = smileFace;
        }, 100)
        console.log('ate a donut');
    }
}

