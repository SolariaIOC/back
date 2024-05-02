const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require('./database');

/**
 * Middleware per gestionar el login de l'usuari.
 * @type {object}
 */
const login = express();

// Middleware per interpretar el cos de la sol·licitud com a JSON
login.use(express.json());

/**
 * Endpoint per iniciar sessió.
 * @route POST /login
 * @param {object} req - Objecte de la sol·licitud.
 * @param {object} res - Objecte de resposta.
 * @returns {object} - Retorna un missatge d'inici de sessió exitós o un error.
 */
login.post('/login', async (req, res) => {
    const { Email, Contrasenya } = req.body;
    db.query('SELECT * FROM usuaris WHERE Email = ?', [Email], async (error, results) => {
        if (error) {
            console.log("Error:", error);
            return res.status(500).json({ error: 'Error en el servidor' });
        }
        if (results.length === 0) {
            return res.status(400).json({ error: 'Credencials incorrectes' });
        }
        const usuario = results[0];
        const contrasenyaValida = await bcrypt.compare(Contrasenya, usuario.Contrasenya);
        if (!contrasenyaValida) {
            return res.status(400).json({ error: 'Credencials incorrectes' });
        }
        const token = jwt.sign({ usuario }, process.env.JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = jwt.sign({ usuario }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res
            .cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'strict', secure: true })
            .cookie('token', token, { httpOnly: true, sameSite: 'strict', secure: true })
            .json({
                message: "Inici de sessió exitós",
                dadesUsuari: {
                    nom: usuario.Nom,
                    cognoms: usuario.Cognoms,
                    email: usuario.Email,
                    tipusUsuari: usuario.TipusUsuari
                }
            });
    });
});

module.exports = login;
