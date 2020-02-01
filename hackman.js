let gameBoardWidth = 27;
let gameBoardHeight = 27;

var canvas;
var ctx;

var bricksImg;

var gameBoardMap = [
    "***************************",
    "* *************************",
    "* *************************",
    "* *** *********************",
    "* *** *********************",
    "* *** *********************",
    "* *** *********************",
    "*           ***************",
    "* * ******   **************",
    "* * *    * *  *************",
    "* * *    * **  ************",
    "* * ****** ***  ***********",
    "* * ****** ****  **********",
    "* * ****** ***** **********",
    "* * ****** ***** **********",
    "* * ****** ***** **********",
    "* * ****** ****************",
    "* *        ****************",
    "* * ****** ****************",
    "* *        ****************",
    "***************************",
    "***************************",
    "***************************",
    "***************************",
    "***************************",
    "***************************",
    "***************************",
]

$(document).ready(() => {
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext('2d');
    // don't draw a big circle
    // ctx.beginPath();
    // ctx.arc(200, 200, 150, 0, 2 * Math.PI);
    // ctx.stroke();

    // load images
    bricksImg = document.getElementById("bricksImg");

    $(document).on("keydown", function(e) {
        console.log(e);
    })
    $(document).on("keyup", function(e) {
        console.log(e);
    })
    setInterval(() => {
        drawGameBoard();
    }, 33);
})

function drawGameBoard() {
    for (let x = 0; x < gameBoardWidth; x++) {
        for (let y = 0; y < gameBoardHeight; y++) {

            // ctx.moveTo(canvas.width / gameBoardWidth * x, 0);
            // ctx.lineTo(canvas.width / gameBoardWidth * x, canvas.height)
            // ctx.stroke();
            if (gameBoardMap[y][x] === "*") {
                ctx.drawImage(bricksImg, 
                    canvas.width / gameBoardWidth * x, canvas.height / gameBoardHeight * y,
                    canvas.width / gameBoardWidth, canvas.height / gameBoardHeight)
            }
        }
        // ctx.moveTo(0, canvas.height / gameBoardHeight * y);
        // ctx.lineTo(canvas.width, canvas.height / gameBoardHeight * y);
        // ctx.stroke();
    }
}
