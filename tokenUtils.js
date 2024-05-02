const jwt = require("jsonwebtoken");

/**
 * Refresca un token d'accés utilitzant el token de refresc.
 * @param {string} refreshToken - El token de refresc per a generar un nou token d'accés.
 * @returns {object} - Retorna un objecte que conté el nou token d'accés i les dades de l'usuari, o un error si hi ha algun problema.
 */
function refrescarToken(refreshToken) {
    try {
        // Verificar el token de refresc
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        
        // Generar un nou token d'accés amb les dades de l'usuari
        const accessToken = jwt.sign({ usuario: decoded.usuario }, process.env.JWT_SECRET, { expiresIn: '15m' });
        
        // Verificar el nou token d'accés
        const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
        
        // Retornar el nou token d'accés i les dades de l'usuari
        return { accessToken, usuario: decodedToken.usuario };
    } catch (error) {
        // Retornar un error si hi ha algun problema en refrescar el token
        return { error: 'Has de fer login de nou' };
    }
}

module.exports = { refrescarToken };
