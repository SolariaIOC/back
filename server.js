const express = require("express");
const cors = require("cors");
const login = require("./login.js");
const immobles = require("./immobles.js");
const usuaris = require("./usuaris.js");
const logout = require("./logout.js");
const calculaHipoteca = require("./simuladorHipoteca.js");
const favoritsImmobles = require('./favoritsImmobles.js');
const cookieParser = require('cookie-parser');
const https = require('https');
const fs = require('fs');
const dotenv = require("dotenv");
const http = require('http');
dotenv.config();

/**
 * Express app per al servidor.
 * @type {object}
 */
const app = express();

const corsOptions = JSON.parse(process.env.CORS_OPTIONS);

// Utilitzar la configuració CORS especificada
app.use(cors(corsOptions));

// Middleware per a interpretar cookies
app.use(cookieParser());

// Rutes per als diferents endpoints
app.use('/', login);
app.use('/', immobles);
app.use('/', usuaris);
app.use('/', logout);
app.use('/', calculaHipoteca);
app.use('/', favoritsImmobles);

// Opcions del servidor HTTPS
let SSLoptions = {};

// Comprovar si l'aplicació està en entorn de producció
if (process.env.ENVIRONMENT === 'live') {
    SSLoptions = {
        key: fs.readFileSync('../../etc/letsencrypt/live/solaria.website/privkey.pem'),
        cert: fs.readFileSync('../../etc/letsencrypt/live/solaria.website/fullchain.pem'),
    };
}

// Crear servidor HTTP o HTTPS segons l'entorn
let server;
if (require.main === module) {
    const PORT = process.env.PORT || 3333;
    if (process.env.ENVIRONMENT === 'live') {
        server = https.createServer(SSLoptions, app);
    } else {
        server = http.createServer(app);
    }
    server.listen(PORT, () => {
        console.log(`Servidor funcionant al PORT: ${PORT}`);
    });
}

module.exports = app;
