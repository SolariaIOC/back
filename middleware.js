const jwt = require('jsonwebtoken');

// ELIMINAR UN COP RESOLT PROVA verificar JWT_SECRET va ok  
//require('dotenv').config(); // Assegura't que .env s'estigui carregant
//const jwtSecret = process.env.JWT_SECRET;
//console.log("Clau secreta JWT:", jwtSecret);
//console.log("NUEVA PRUEBA", this.jwtService)

console.log()

// Middleware per verificar el token i guardar les dades de l'usuari
const verificaToken = (req, res) => {
    const token = req.headers.authorization; //retorna error "JsonWebTokenError: invalid token"

    // ELIMINAR  console.log('Token REBUT:', token);

jwt.verify(token)
    if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }
    try {
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Descodifica el token
        console.log('USUARI DECODED', decoded);
        req.usuario = decoded.usuario; // Guardem les dades de l'usuari per accedir posteriorment
    } catch (error) {
        console.error('Error al decodificar el token:', error.message);
        return res.status(401).json({ error: 'Token inválido AAAAA' });
    }
    

};

module.exports = verificaToken;

