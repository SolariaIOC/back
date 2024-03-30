const jwt = require("jsonwebtoken");
const { refrescarToken } = require('./tokenUtils.js')


// Middleware per verificar el token i obtenir l'ID de l'usuari
function verificaToken(req, res, next) {
    const authorizationHeader = req.cookies['token'];
    const refreshToken = req.cookies['refreshToken'];

    if (!authorizationHeader && !refreshToken) {
        return res.status(401).json({ error: 'Token no proporcionat' });
    }
    try {
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
                res.status(302).json({ redirectTo: "http://solaria.website" }) //Debe redirigir a la pagina de login para conseguir dos nuevos token
            }
            req.usuario = usuario;
            res
                .cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'strict' })
                .cookie('token', accessToken, { httpOnly: true, sameSite: 'strict' });
            next();
        } catch (error) {
            return res.status(400);
        }
    }
}

module.exports = verificaToken;