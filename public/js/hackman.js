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
            if (char === "🙁") {
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

    ctx.drawImage (playerImg, 
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
        playerImg = tongueFace;
        clearInterval(player.facetimeout);
        player.facetimeout = setTimeout(() => {
            // reset player emoji
            playerImg = smileFace;
        }, 100)
        console.log('ate a donut');
    }
}

function moveMosters() {
    monsters.forEach(monster => {

    })
}