const mysql = require('mysql2');
const dotenv = require("dotenv");
dotenv.config();

/**
 * Configuració de la connexió a la base de dades MySQL.
 * @type {object}
 * @property {string} host - Host de la base de dades.
 * @property {number} port - Port de la base de dades.
 * @property {string} user - Nom d'usuari de la base de dades.
 * @property {string} password - Contrasenya de l'usuari de la base de dades.
 * @property {string} database - Nom de la base de dades.
 */
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
})

module.exports = db;
