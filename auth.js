const jwt = require("jsonwebtoken");
const { refrescarToken } = require('./tokenUtils.js');

/**
 * Missatge d'error per a l'accés prohibit.
 * @type {string}
 */
const ERROR_ACCES_PROHIBIT = "Accés prohibit";

/**
 * Middleware per verificar el token i obtenir l'ID de l'usuari.
 * @param {object} req - Objecte de sol·licitud (request).
 * @param {object} res - Objecte de resposta (response).
 * @param {function} next - Funció per a la següent capa del middleware.
 */
function verificaToken(req, res, next) {
    const authorizationHeader = req.cookies['token'];
    const refreshToken = req.cookies['refreshToken'];
    try {
        if (!authorizationHeader && !refreshToken) {
            return res.status(401).json({ error: 'Token no proporcionat' });
        }
        // Verifica que s'ha proporcionat el token correctament i guarda les dades de l'usuari
        const decodedToken = jwt.verify(authorizationHeader, process.env.JWT_SECRET);
        req.usuario = decodedToken.usuario;
        next();
    } catch (error) {
        if (!refreshToken) {
            return res.status(401).send('No hi ha cap token de refresc');
        }
        try {
            const { accessToken, usuario, error: refreshError } = refrescarToken(refreshToken);
            if (refreshError) {
                res
                    .clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict' })
                    .clearCookie('token', { httpOnly: true, sameSite: 'strict' });
                res.status(302).json({ redirectTo: process.env.REDIRECT_URL }); // Redirigir a la pàgina de login
            }
            req.usuario = usuario;
            res
                .cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'strict', secure: true })
                .cookie('token', accessToken, { httpOnly: true, sameSite: 'strict', secure: true });
            next();
        } catch (error) {
            return res.status(400);
        }
    }
}

/**
 * Funció per verificar el tipus d'usuari.
 * @param {string} tipusUsuariPermes - Tipus d'usuari permès.
 * @returns {function} Middleware per verificar el tipus d'usuari.
 */
function verificarTipusUsuari(tipusUsuariPermes) {
    return (req, res, next) => {
        try {
            // Verificar si el tipus d'usuari del token coincideix amb el permès o si és null o undefined
            if (!req.usuario || (tipusUsuariPermes && req.usuario.TipusUsuari !== tipusUsuariPermes)) {
                return res.status(403).json({ error: ERROR_ACCES_PROHIBIT });
            }
            // Si coincideix, permetre que continuï l'execució
            next();
        } catch (error) {
            return res.status(403).json({ error: ERROR_ACCES_PROHIBIT });
        }
    };
}

module.exports = { verificaToken, verificarTipusUsuari };
