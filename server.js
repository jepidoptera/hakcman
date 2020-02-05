const axios = require('axios');
const express = require('express');
const app = express();
const fs = require('fs');
require('dotenv').config();

const port = process.env.PORT || 8080;
const apiKey = process.env.APIKEY || "no_api_key";

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

app.get('/', (req, res) => {
    // home page
    console.log('rendering city select page...');
    res.render("index", {cities: cities});
})

app.get('/game/:levelId', (req, res) => {
    const levelData = fs.readFileSync('levels/level1.lvl');
    // see what we've got
    console.log(levelData);
    // render this level
    res.render("game", {levelData: levelData});
})

app.listen(port);
