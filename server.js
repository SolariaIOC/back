const express = require("express");
const cors = require("cors");
const login = require("./login.js")
const immobles = require("./immobles.js");
const usuaris = require("./usuaris.js");
const logout = require("./logout.js");
const calculaHipoteca = require("./simulador-hipoteca.js");
const cookieParser = require('cookie-parser');
const https = require('https');
const fs = require('fs');
const dotenv = require("dotenv");
const http = require('http');
dotenv.config();


const app = express();

const corsOptions = JSON.parse(process.env.CORS_OPTIONS);


app.use(cors(corsOptions))
app.use(cookieParser());
app.use('/', login);
app.use('/', immobles);
app.use('/', usuaris);
app.use('/', logout);
app.use('/', calculaHipoteca);


/*const SSLoptions = {
    key: fs.readFileSync('../../etc/letsencrypt/live/solaria.website/privkey.pem'),
    cert: fs.readFileSync('../../etc/letsencrypt/live/solaria.website/fullchain.pem'),
};*/

let SSLoptions = {}

if (process.env.ENVIRONMENT === 'live') {
    SSLoptions = {
        key: fs.readFileSync('../../etc/letsencrypt/live/solaria.website/privkey.pem'),
        cert: fs.readFileSync('../../etc/letsencrypt/live/solaria.website/fullchain.pem'),
    };
}


if (require.main === module) {
    const PORT = process.env.PORT || 3333;
    let server;
    if (process.env.ENVIRONMENT === 'live') {
        server = https.createServer(SSLoptions, app);
    } else {
        server = http.createServer(app);
    }
    server.listen(PORT, () => {
        console.log(`Server is running at PORT: ${PORT}`);
    });
}

module.exports = app;









