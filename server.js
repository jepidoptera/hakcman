const express = require('express');
const app = express();
const fs = require('fs');
require('dotenv').config();

const port = process.env.PORT || 8080;
const apiKey = process.env.APIKEY || "no_api_key";

const level = [
    "easymobile",
    "inception",
    "the original",
    "inexorable",
    "the crucible",
    "section 4",
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
    console.log(level[req.params.levelID])
    const filename = `public/levels/${level[req.params.levelID-1]}.lvl`;
    console.log(filename);
    if (fs.existsSync(filename)) {
        const levelData = fs.readFileSync(filename)
        .toString();
        // see what we've got
        console.log(levelData);
        // render this level
        res.render("game", {levelData: levelData, levelNumber: req.params.levelID});
    }
    else {
        res.render("win");
    }
})

app.listen(port);
