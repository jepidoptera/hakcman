const express = require('express');
const app = express();
const fs = require('fs');
require('dotenv').config();

const port = process.env.PORT || 8080;
const apiKey = process.env.APIKEY || "no_api_key";

const levels = [
    "easymobile",
    "inception",
    "hohum",
    "the original",
    "inexorable",
    "ratchet up",
    "the crucible",
    "4 square",
    "the devil's lair",
    "labyrinth"
]

// Serve static files
app.use(express.static(__dirname + '/public'));

// use handlebars
var exphbs = require("express-handlebars");
app.engine(".hbs", exphbs({
    defaultLayout: "main",
    extname: ".hbs",
    helpers: {
    // capitalize words on request
        'Capitalize': function(string)
        {
            return string.charAt(0).toUpperCase() + string.slice(1);
        }
    }
}));

app.set("view engine", ".hbs");

// Serve app
console.log('Listening on: http://localhost:' + port);

app.get ("/", (req, res) => {
    res.render("index");
})

app.get('/game/:levelID', (req, res) => {
    console.log(levels[req.params.levelID])
    let level = req.params.levelID;
    // fail gracefully:
    // if level does not exist, try the next in the list
    if (level == parseInt(level)) -- level;
    let filename = `public/levels/${levels[level]}.lvl`;
    while (!fs.existsSync(filename) && parseInt(level) < 99) {
        console.log("file not found:", filename);
        level = parseInt(level) + 1;
        filename = `public/levels/${levels[level]}.lvl`;
    }
    console.log(filename);
    if (level === 99) {
        res.render("win");
    }
    else {
        const levelData = fs.readFileSync(filename)
        .toString();
        // see what we've got
        console.log(levelData);
        // render this level
        res.render("game", {levelData: levelData, levelNumber: req.params.levelID, levelName: levels[level]});
    }
})

app.listen(port);
