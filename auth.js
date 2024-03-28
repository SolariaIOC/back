const jwt = require("jsonwebtoken");

// Middleware per verificar el token i obtenir l'ID de l'usuari
function verificaToken(req, res, next) {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader) {
        return res.status(401).json({ error: 'Token no proporcionat' });
    }

    try {
        // Separa el prefix "Bearer" i el token
        const [bearer, token] = authorizationHeader.split(' ');

        // Verifica que s'ha proporcionat el token correctament
        if (!token || bearer.toLowerCase() !== 'bearer') {
            throw new Error('Token invàlid');
        }

        //Guarda id_usuari del token descodificat
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        req.idUsuariToken = decodedToken.usuario.id_usuari;
        next();
    } catch (error) {
        return res.status(401).json({ error: error.message });
    }
}

module.exports = verificaToken;