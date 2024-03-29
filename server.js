const express = require("express");
const cors = require("cors");
const login = require("./login.js")
const immobles = require("./immobles.js");
const usuaris = require("./usuaris.js");


const app = express();
app.use(cors());
app.use('/', login);
app.use('/', immobles);
app.use('/', usuaris);

if (require.main === module) {
    const PORT = process.env.PORT || 3333;
    app.listen(PORT, () => {
        console.log(`Server is running at PORT: ${PORT}`);
    });
}

module.exports = app;








