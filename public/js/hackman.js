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

var playerControls = {
    ArrowUp: false, 
    ArrowDown: false, 
    ArrowLeft: false, 
    ArrowRight: false
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
    gameBoardMap = $("#levelData").text()
        .split("\n").map((line) => {
            return line.split('');
    });
    // load monsters
    gameBoardMap.forEach((row, y) => {
        row.forEach((char, x) => {
            if (char === "M") {
                monsters.push(new Monster(x, y))
            }
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
    setInterval(moveMonsters, 120);
})


function drawGameBoard() {
    for (let x = 0; x < gameBoardWidth; x++) {
        for (let y = 0; y < gameBoardHeight; y++) {

            if (gameBoardMap[y][x] === "*") {
                ctx.drawImage(bricksImg, 
                    gameCellWidth * x, gameCellHeight * y,
                    gameCellWidth, gameCellHeight)
            }
            else if (gameBoardMap[y][x] === "+") {
                ctx.drawImage(donutImg, 
                    gameCellWidth * x, gameCellHeight * y,
                    gameCellWidth, gameCellHeight)
            }
            else {
                ctx.clearRect(gameCellWidth * x, gameCellHeight * y,
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
        if (player.y > 0 && gameBoardMap[player.y - 1][player.x] !== "*") {
            --player.y;
            moved = true;
        }
    }
    if (playerControls.ArrowDown && !moved) {
        if (player.y < gameBoardHeight - 1 
            && gameBoardMap[player.y + 1][player.x] !== "*") {
            ++player.y;
            moved = true;
        }
    }
    if (playerControls.ArrowLeft && !moved) {
        if (player.x > 0 && gameBoardMap[player.y][player.x-1] !== "*") {
            --player.x;
            moved = true;
        }
    }
    if (playerControls.ArrowRight && !moved) {
        if (player.x < gameBoardWidth - 1 && gameBoardMap[player.y][player.x + 1] !== "*") {
            ++player.x;
            moved = true;
        }
    }
    if (gameBoardMap[player.y][player.x] === "+") {
        // eat a donut
        gameBoardMap[player.y][player.x] = " ";
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
        // check which options are available to move towards
        let moveOptions = checkMoveOptions(monster.x, monster.y);
        // they will change direction when options for moving change
        // either hitting a wall, or coming across a new passage
        if (moveOptions != monster.moveOptions) {
            monster.moveOptions = moveOptions;
            // try to move toward player
            let xdif = player.x - monster.x;
            let ydif = player.y - monster.y;
            if (Math.floor(Math.random() * (xdif + ydif)) > xdif) {
                monster.direction = [Math.sign(xdif), 0]
            }
            else {
                monster.direction = [0, Math.sign(ydif)]
            }
            while (gameBoardMap[monster.y + monster.direction[1]]
                [monster.x + monster.direction[0]] === "*") {
                    // hit a wall - change direction
                    monster.direction = 
                    [[1, 0], [0, 1], [-1, 0], [0, -1]]
                    [Math.floor(Math.random() * 4)]
                }
        }

        monster.x += monster.direction[0];
        monster.y += monster.direction[1];
    })
}

function checkMoveOptions(x, y) {
    // return a number from 1 to 16 which indicates which directions are open
    let directions = [[1, 0], [0, 1], [-1, 0], [0, -1]];
    return directions.reduce((sum, direction, i) => {
        if (gameBoardMap[y + direction[1]][x + direction[0]] === "*") {
            return sum;
        }
        else {
            return sum + 2 ** i;
        }
    }, 0)
}