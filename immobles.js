const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require('./database');
const verificaToken = require('./auth');
const login = require('./login.js');

const immobles = express();
immobles.use(express.json());


// Endpoint per obtenir llistat immobles (accessible per tothom)
immobles.get('/immobles', async (req, res) => {
    try {
        db.query('SELECT * FROM immobles', (err, results) => {
            if (err) {
                console.log("Error:", err); 
                return res.status(500).json("Error del servidor");
            } 
            if (!results || results.length === 0) {
                return res.status(404).json({ error: 'No se encontraron resultados' });
            }

            res.send(results);
            
        });
    } catch (err) {
        console.log("Error en el bloc catch:", err); 
        res.status(500).json("Error del servidor");
    }
});

// Endpoint per obtenir llistat immobles segons el Codi_Postal (accessible per tothom)
immobles.get('/immobles/codi_postal/:codiPostal', async (req, res) => {
    try {
        const codiPostal = req.params.codiPostal;
        db.query('SELECT * FROM immobles WHERE Codi_Postal = ?', [codiPostal], (err, results) => {
            if (err) {
                console.error("Error:", err);
                return res.status(500).json("Error del servidor");
            } 
            if (!results || results.length === 0) {
                return res.status(404).json({ error: 'No se encontraron resultados' });
            }
            
            res.send(results);
            
        });
    } catch (err) {
        console.error("Error en el bloc catch:", err);
        res.status(500).json("Error del servidor");
    }
});

// Endpoint per obtenir llistat immobles segons la Poblacio (accessible per tothom)
immobles.get('/immobles/poblacio/:poblacio', async (req, res) => {
    try {
        const poblacio = req.params.poblacio;
        db.query('SELECT * FROM immobles WHERE Poblacio = ?', [poblacio], (err, results) => {
            if (err) {
                console.error("Error:", err);
                return res.status(500).json("Error del servidor");
            } 
            if (!results || results.length === 0) {
                return res.status(404).json({ error: 'No se encontraron resultados' });
            }

            res.send(results);
            
        });
    } catch (err) {
        console.error("Error en el bloc catch:", err);
        res.status(500).json("Error del servidor");
    }
});

// Endpoint per obtenir la llista d'immobles segons l'ID de l'usuari del token  (R)
immobles.get('/immobles/usuari', verificaToken, async (req, res) => {
    try {
        const idUsuariToken = req.idUsuariToken;

        db.query('SELECT * FROM immobles WHERE id_usuari = ?', [idUsuariToken], (error, results) => {
            if (error) {
                console.error("Error:", error);
                return res.status(500).json({ error: 'Error en el servidor' });
            }
            if (!results || results.length === 0) {
                return res.status(404).json({ error: 'No s\'ha trobat cap immoble per a aquest usuari' });
            }
            res.json(results);
        });
    } catch (error) {
        console.error("Error en el bloc catch:", error);
        res.status(500).json("Error del servidor");
    }
});


// Endpoint per afegir un nou immoble (R)
immobles.post('/immobles/afegir', verificaToken, async (req, res) => {
    try {
        //Recollim dades de l'immoble del body, excepte id_usuari que l'agafa del token
        const { Carrer, Numero, Pis, Codi_Postal, Poblacio, Descripcio, Preu, Imatge } = req.body;
        const id_usuari = req.idUsuariToken;

        // Consulta SQL per afegir un nou immoble a la bbdd amb l'id de l'usuari autenticat
        db.query('INSERT INTO immobles (id_usuari, Carrer, Numero, Pis, Codi_Postal, Poblacio, Descripcio, Preu, Imatge) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [id_usuari, Carrer, Numero, Pis, Codi_Postal, Poblacio, Descripcio, Preu, Imatge], (err, result) => {
            if (err) {
                console.error("Error:", err);
                return res.status(500).json("Error del servidor");
            } else {
                res.status(201).json({ message: 'Nou immoble afegit amb èxit!' });
            }
        });
    } catch (err) {
        console.error("Error en el bloc catch:", err);
        res.status(500).json("Error del servidor");
    }
});



module.exports = immobles;

