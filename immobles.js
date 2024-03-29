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
        // Recollim dades de l'immoble del body, excepte id_usuari que l'agafa del token
        let { Carrer, Numero, Pis, Codi_Postal, Poblacio, Descripcio, Preu, Imatge } = req.body;
        const id_usuari = req.idUsuariToken;

        // Netejem les dades rebudes abans de fer la consulta
        Carrer = netejaDada(Carrer);
        Numero = netejaDada(Numero);
        Pis = netejaDada(Pis);
        Codi_Postal = netejaDada(Codi_Postal);
        Poblacio = netejaDada(Poblacio);
        Descripcio = netejaDada(Descripcio);
        Preu = netejaDada(Preu);
        Imatge = netejaDada(Imatge);

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

// Endpoint per eliminar un immoble per la seva id_immoble (R)
immobles.delete('/immobles/r/:id_immoble', verificaToken, async (req, res) => {
    
    // Recollim el id_usuari del token i la id_immoble de la URL
    const { idUsuariToken, TipusUsuariToken } = req;
    const id_immoble_param = parseInt(req.params.id_immoble); // Diferenciem el paràmetre id_immoble

    // Verifiquem si el tipus d'usuari és "R"
    if (TipusUsuariToken !== "R") {
        return res.status(403).json({ error: 'Usuari no registrat' });
    }

    // Verifiquem si la id_immoble és un número vàlid
    if (isNaN(id_immoble_param) || id_immoble_param <= 0) {
        return res.status(400).json({ error: 'La ID de l\'immoble no és vàlida' });
    }

    try {
    // Comprovem si l'immoble pertany a l'usuari autenticat
    const immoble = await new Promise((resolve, reject) => {
        db.query('SELECT * FROM immobles WHERE id_immoble = ? AND id_usuari = ?', [id_immoble_param, idUsuariToken], (err, result) => {
            if (err) {
                console.error("Error en la consulta SELECT:", err);
                reject({ status: 500, message: 'Error del servidor' });
            } else if (!result || result.length === 0) {
                reject({ status: 404, message: 'No s\'ha trobat cap immoble amb aquesta ID per a aquest usuari' });
            } else {
                resolve(result);
            }
        });
    });

    // Eliminem l'immoble de la base de dades
    await new Promise((resolve, reject) => {
        db.query('DELETE FROM immobles WHERE id_immoble = ?', [id_immoble_param], (err) => {
            if (err) {
                console.error("Error en la consulta DELETE:", err);
                reject({ status: 500, message: 'Error del servidor' });
            } else {
                resolve();
            }
        });
    });

    res.status(200).json({ message: 'Immoble eliminat amb èxit' });
} catch (error) {
    res.status(error.status || 500).json({ error: error.message });
}
});

// Funció per netejar les cadenes de text en cas de trobar caràcters especials i espais en blanc al principi
function netejaDada(dada) {
    if (typeof dada === 'string') {
        dada = dada.trim();
        dada = dada.replace(/\\+/g, '\\');
        dada = dada.replace(/&/g, '&amp;')
                   .replace(/</g, '&lt;')
                   .replace(/>/g, '&gt;')
                   .replace(/"/g, '&quot;')
                   .replace(/'/g, '&#39;');
    }
    return dada;
}


module.exports = immobles;

