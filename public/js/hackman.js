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

const playerControls = {
    ArrowUp: false, 
    ArrowDown: false, 
    ArrowLeft: false, 
    ArrowRight: false
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
        this.facetimeout = null;
        this.img = smileFace;
    }
}
const player = new Player();

class Monster {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.direction = [1, 0];
        this.img = angryFace;
        this.direction = directions[0];
    }
}
const monsters = [];

$(document).ready(() => {

    // load images
    bricksImg = document.getElementById("bricksImg")
    smileFace = document.getElementById("smileFace")
    tongueFace = document.getElementById("tongueFace")
    angryFace = document.getElementById("angryFace")
    player.img = smileFace;

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

    // player input
    $(document).on("keydown", function(e) {
        playerControls[e.key] = true
    })
    $(document).on("keyup", function(e) {
        playerControls[e.key] = false;
    })

    requestAnimationFrame(drawGameBoard);

    setInterval(movePlayer, 100);
    setInterval(moveMonsters, 150);
})


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

    ctx.drawImage (player.img, 
        gameCellWidth * player.x, gameCellHeight * player.y,
        gameCellWidth, gameCellHeight)

    // draw monsters
    monsters.forEach(monster => {
        ctx.drawImage (monster.img, 
            gameCellWidth * monster.x, gameCellHeight * monster.y,
            gameCellWidth, gameCellHeight)
        })

    // console.log('frame rendered');
    requestAnimationFrame(drawGameBoard);

}

function movePlayer() {
    let moved = false;
    // console.log('input processed');
    if (playerControls.ArrowUp) {
        if (player.y > 0 && gameBoardMap[player.y - 1][player.x].passable) {
            --player.y;
            moved = true;
        }
    }
    if (playerControls.ArrowDown && !moved) {
        if (player.y < gameBoardHeight - 1 
            && gameBoardMap[player.y + 1][player.x].passable) {
            ++player.y;
            moved = true;
        }
    }
    if (playerControls.ArrowLeft && !moved) {
        if (player.x > 0 && gameBoardMap[player.y][player.x-1].passable) {
            --player.x;
            moved = true;
        }
    }
    if (playerControls.ArrowRight && !moved) {
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

function moveMonsters() {
    monsters.forEach(monster => {
        // monster movement rules:

        // 1. don't reverse course unless there is no other option, or
        // 2. when a new path (which isn't a course reversal) becomes available, (randomly) consider taking it


        // check which options are available to move towards
        let newMoveOptions = directions.reduce((sum, direction, i) => {
            if (!gameBoardMap[monster.y + direction.y][monster.x + direction.x].passable ||
                Math.abs(direction.index - monster.direction.index) === 2) {
                return sum;
            }
            else {
                return sum + 2 ** i;
            }
        }, 0);
        // they will change direction when options for moving change
        // either hitting a wall, or coming across a new passage
        if ((newMoveOptions | monster.moveOptions) != monster.moveOptions || 
            !(newMoveOptions & 2 ** monster.direction.index)) {
            let newDirection = directions[0];
            // // try to move toward player first
            let xdif = player.x - monster.x;
            let ydif = player.y - monster.y;
            if (Math.floor(Math.random() * (Math.abs(xdif) + Math.abs(ydif))) < Math.abs(xdif)) {
                newDirection = xdif > 0 ? directions[0] : directions[2];
            }
            else {
                newDirection = ydif > 0 ? directions[1] : directions[3];
            }
            // but if that's not going to work out, due to a wall,
            // or because it would be going backwards...
            if (!gameBoardMap[monster.y + newDirection.y][monster.x + newDirection.x].passable 
                || Math.abs(newDirection.index - monster.direction.index) === 2) {
                    directions.forEach((direction, i) => {
                        // go anywhere but backwards
                        if (Math.abs(monster.direction.index - i) != 2 &&
                        gameBoardMap[monster.y + direction.y]
                        [monster.x + direction.x].passable) {
                            newDirection = direction;
                        } 
                    })
            }
            monster.direction = newDirection;
        }

        let newDirection = monster.direction.index + 1 % directions.length;
        while (!gameBoardMap[monster.y + monster.direction.y]
            [monster.x + monster.direction.x].passable && newDirection != monster.direction.index) {
                // hit a wall - change direction
                // should only ever happen in the case of a dead end
                monster.direction = directions[newDirection];
                newDirection = ++newDirection % directions.length;
            }

        gameBoardMap[monster.y][monster.x].passable = true;
        monster.x += monster.direction.x;
        monster.y += monster.direction.y;
        gameBoardMap[monster.y][monster.x].passable = false;

        monster.moveOptions = newMoveOptions | 2 ** monster.direction.index;

    })
}

