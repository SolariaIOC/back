const jwt = require("jsonwebtoken");

function refrescarToken(refreshToken) {
    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        const accessToken = jwt.sign({ usuario: decoded.usuario }, process.env.JWT_SECRET, { expiresIn: '15m' });
        const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
        return { accessToken, usuario: decodedToken.usuario };
    } catch (error) {
        return { error: 'Tienes que hacer login de nuevo' };
    }
}

module.exports = { refrescarToken };