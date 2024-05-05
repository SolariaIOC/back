const express = require("express");

/**
 * Middleware per gestionar el logout de l'usuari.
 * @type {object}
 */
const logout = express();

// Middleware per interpretar el cos de la sol·licitud com a JSON
logout.use(express.json());

/**
 * Endpoint per tancar la sessió de l'usuari.
 * @route POST /logout
 * @param {object} req - Objecte de la sol·licitud.
 * @param {object} res - Objecte de resposta.
 * @returns {object} - Retorna una resposta buida després de tancar la sessió de l'usuari.
 */
logout.post('/logout', async (req, res) => {
    res
        .clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict' })
        .clearCookie('token', { httpOnly: true, sameSite: 'strict' })
        .send();
});

module.exports = logout;
