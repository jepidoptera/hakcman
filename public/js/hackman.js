let gameBoardWidth = 27;
let gameBoardHeight = 27;
let gameCellWidth;
let gameCellHeight;

var canvas;
var ctx;

var bricksImg;
var smileImg;
var tongueImg;
var playerImg;

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
    }
}
let player = new Player();

$(document).ready(() => {
    // load map
    gameBoardMap = $("#levelData").text()
        .split("\n").map((line) => {
            return line.split('');
    });
    
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext('2d');

    // load images
    bricksImg = document.getElementById("bricksImg");
    smileImg = document.getElementById("smileImg");
    tongueImg = document.getElementById("tongueImg");
    playerImg = smileImg;

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
            if (player.x === x && player.y === y) {
                ctx.drawImage (playerImg, 
                    gameCellWidth * x, gameCellHeight * y,
                    gameCellWidth, gameCellHeight)
            }
        }
    }
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
        playerImg = tongueImg;
        clearInterval(player.facetimeout);
        player.facetimeout = setTimeout(() => {
            // reset player emoji
            playerImg = smileImg;
        }, 100)
        console.log('ate a donut');
    }
}
