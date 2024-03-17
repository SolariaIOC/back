const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require('./database');


const login = express();
login.use(express.json());
login.post('/login', async (req, res) => {
    const { Email, Contrasenya } = req.body;
    db.query('SELECT * FROM usuaris WHERE Email = ?', [Email], async (error, results) => {
        if (error) {
            console.log("Error:", error);
            return res.status(500).json({ error: 'Error en el servidor' });
        }
        if (results.length === 0) {
            return res.status(400).json({ error: 'Credenciales incorrectas' });
        }
        const usuario = results[0];
        const contrasenyaValida = await bcrypt.compare(Contrasenya, usuario.Contrasenya);
        if (!contrasenyaValida) {
            return res.status(400).json({ error: 'Credenciales incorrectas' });
        }
        const token = jwt.sign({ usuario }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    });
});
module.exports = login;


