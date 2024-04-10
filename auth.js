const jwt = require("jsonwebtoken");
const { refrescarToken } = require('./tokenUtils.js');
const ERROR_ACCES_PROHIBIT = "Acceso prohibido";


// Middleware per verificar el token i obtenir l'ID de l'usuari
function verificaToken(req, res, next) {
    const authorizationHeader = req.cookies['token'];
    const refreshToken = req.cookies['refreshToken'];
    try {
        if (!authorizationHeader && !refreshToken) {
            return res.status(401).json({ error: 'Token no proporcionado' });
        }
        // Verifica que s'ha proporcionat el token correctament i guarda les dades de l'usuari
        const decodedToken = jwt.verify(authorizationHeader, process.env.JWT_SECRET);
        req.usuario = decodedToken.usuario;
        next();
    } catch (error) {
        if (!refreshToken) {
            return res.status(401).send('No hay token de refresco');
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

// Funció per verificar el tipus d'usuari
function verificarTipusUsuari(tipusUsuariPermes) {
    return (req, res, next) => {
        try {
            // Verificar si el tipus d'usuari del token coincideix amb el permès o si es null o undefined
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

