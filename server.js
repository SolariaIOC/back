const express = require("express");
const cors = require("cors");
const login = require("./login.js")
const immobles = require("./immobles.js");
const usuaris = require("./usuaris.js");
const cookieParser = require('cookie-parser');
const https = require('https');
const fs = require('fs');

const app = express();

const corsOptions = {
    origin: [
        "http://127.0.0.1:5500/",
        "https://solaria.website",
    ],
    credentials: true
};

app.use(cors(corsOptions))
app.use(cookieParser());
app.use('/', login);
app.use('/', immobles);
app.use('/', usuaris);


const SSLoptions = {
    key: fs.readFileSync('../../etc/letsencrypt/live/solaria.website/privkey.pem'),
    cert: fs.readFileSync('../../etc/letsencrypt/live/solaria.website/fullchain.pem'),
};


if (require.main === module) {
    const PORT = process.env.PORT || 3333;
    const server = https.createServer(SSLoptions, app);
    server.listen(PORT, () => {
        console.log(`Server is running at PORT: ${PORT}`);
    });
}

module.exports = app;









