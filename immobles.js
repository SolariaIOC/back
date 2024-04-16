//Treballem amb 3 tipus d'usuari
// anónim = (accesible per tothom)
// Registrat = (R) nomes pot accedir a les seves dades
// Administrador = (A) pot accedir a tots els usuaris i immobles

const express = require("express");
const db = require('./database');
const { verificaToken, verificarTipusUsuari } = require('./auth');
const ERROR_SERVIDOR = "Error del servidor";
const ERROR_NO_RESULTATS = "No se encontraron resultados";
//const ERROR_ACCES_PROHIBIT = "Acceso prohibido";

const immobles = express();
immobles.use(express.json());


// Endpoint per obtenir llistat immobles (accessible per tothom)
immobles.get('/immobles', async (req, res) => {
    try {
        db.query('SELECT * FROM immobles', (error, results) => {
            if (error) {
                console.log("Error:", error);
                return res.status(500).json(ERROR_SERVIDOR);
            }
            if (!results || results.length === 0) {
                return res.status(404).json({ error: ERROR_NO_RESULTATS });
            }

            res.send(results);

        });
    } catch (err) {
        console.log("Error en el bloc catch:", err);
        res.status(500).json(ERROR_SERVIDOR);
    }
});

// Endpoint per obtenir llistat immobles segons el Codi_Postal (accessible per tothom)
immobles.get('/immobles/codi_postal/:codiPostal', async (req, res) => {
    try {
        const codiPostal = req.params.codiPostal;
        db.query('SELECT * FROM immobles WHERE Codi_Postal = ?', [codiPostal], (err, results) => {
            if (err) {
                console.error("Error:", err);
                return res.status(500).json(ERROR_SERVIDOR);
            }
            if (!results || results.length === 0) {
                return res.status(404).json({ error: ERROR_NO_RESULTATS });
            }

            res.send(results);

        });
    } catch (err) {
        console.error("Error en el bloc catch:", err);
        res.status(500).json(ERROR_SERVIDOR);
    }
});

// Endpoint per obtenir llistat immobles segons la Poblacio (accessible per tothom)
immobles.get('/immobles/poblacio/:poblacio', async (req, res) => {
    try {
        const poblacio = req.params.poblacio;
        db.query('SELECT * FROM immobles WHERE Poblacio = ?', [poblacio], (err, results) => {
            if (err) {
                console.error("Error:", err);
                return res.status(500).json(ERROR_SERVIDOR);
            }
            if (!results || results.length === 0) {
                return res.status(404).json({ error: ERROR_NO_RESULTATS });
            }

            res.send(results);

        });
    } catch (err) {
        console.error("Error en el bloc catch:", err);
        res.status(500).json(ERROR_SERVIDOR);
    }
});

// Endpoint per obtenir la llista d'immobles segons l'ID de l'usuari del token  (R)
immobles.get('/immobles/r', verificaToken, verificarTipusUsuari('R'), async (req, res) => {
    try {
        const idUsuariToken = req.usuario.id_usuari;

        db.query('SELECT * FROM immobles WHERE id_usuari = ?', [idUsuariToken], (error, results) => {
            if (error) {
                console.error("Error:", error);
                return res.status(500).json({ error: ERROR_SERVIDOR });
            }
            if (!results || results.length === 0) {
                return res.status(404).json({ error: ERROR_NO_RESULTATS });
            }
            res.status(200).json(results);
        });
    } catch (error) {
        console.error("Error en el bloc catch:", error);
        res.status(500).json(ERROR_SERVIDOR);
    }
});


// Endpoint per afegir un nou immoble (R)
immobles.post('/immobles/r/afegir', verificaToken, verificarTipusUsuari('R'), async (req, res) => {

    try {
        let { Carrer, Numero, Pis, Codi_Postal, Poblacio, Descripcio, Preu, Imatge } = req.body;
        const id_usuari = req.usuario.id_usuari;

        // Comprovació de dades vàlides
        if (!Carrer || !Numero || !Codi_Postal || !Poblacio || !Preu) {
            return res.status(400).json({ error: 'Faltan datos' });
        }

        db.query('INSERT INTO immobles (id_usuari, Carrer, Numero, Pis, Codi_Postal, Poblacio, Descripcio, Preu, Imatge) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [id_usuari, Carrer, Numero, Pis, Codi_Postal, Poblacio, Descripcio, Preu, Imatge], (err, result) => {
            if (err) {
                console.error("Error:", err);
                return res.status(500).json({ error: ERROR_SERVIDOR });
            } else {
                res.status(201).json({ message: 'Nuevo inmueble añadido con éxito' });
            }
        });
    } catch (error) {
         if (error.status && error.status === 403) {
            return res.status(403).json({ error: ERROR_ACCES_PROHIBIT });
        } else {
            console.error("Error en el bloc catch:", error);
            res.status(500).json({ error: ERROR_SERVIDOR });
        }
    }
});

// Endpoint per eliminar un immoble per la seva id_immoble (R)
immobles.delete('/immobles/r/eliminar/:id_immoble', verificaToken, verificarTipusUsuari('R'), async (req, res) => {
    
    // Recollim el id_usuari del token i la id_immoble de la URL
    const { id_usuari } = req.usuario;
    const id_immoble_param = parseInt(req.params.id_immoble);

    // Verifiquem si la id_immoble és un número vàlid
    if (isNaN(id_immoble_param) || id_immoble_param <= 0) {
        return res.status(400).json({ error: 'La ID del inmueble no és válida' });
    }

    try {
        // Comprovem si l'immoble pertany a l'usuari autenticat
        const immoble = await new Promise((resolve, reject) => {
            db.query('SELECT * FROM immobles WHERE id_immoble = ? AND id_usuari = ?', [id_immoble_param, id_usuari], (err, result) => {
                if (err) {
                    console.error("Error en la consulta SELECT:", err);
                    reject({ status: 500, message: ERROR_SERVIDOR });
                } else if (!result || result.length === 0) {
                    reject({ status: 404, message: ERROR_NO_RESULTATS });
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
                    reject({ status: 500, message: ERROR_SERVIDOR });
                } else {
                    resolve();
                }
            });
        });

        res.status(200).json({ message: 'Inmueble eliminado con éxito' });
    } catch (error) {
        // Verificar si l'error és relacionat amb l'autorització
        if (error.status && error.status === 403) {
            return res.status(403).json({ error: ERROR_ACCES_PROHIBIT });
        } else {
            // Si no és un error de 403, manejar-lo com un error del servidor
            console.error("Error en el bloque catch:", error);
            res.status(error.status || 500).json({ error: error.message });
        }
    }
});

// Endpoint per actualitzar un immoble (R)
immobles.put('/immobles/r/actualitzar/:id_immoble', verificaToken, verificarTipusUsuari('R'), async (req, res) => {
    try {
        const id_immoble = parseInt(req.params.id_immoble);
        const id_usuari = req.usuario.id_usuari;
        const { Carrer, Numero, Pis, Codi_Postal, Poblacio, Descripcio, Preu, Imatge } = req.body;

        if (isNaN(id_immoble) || id_immoble <= 0) {
            return res.status(400).json({ error: 'La ID del inmueble no es válida' });
        }
        if (!Carrer || !Numero || !Codi_Postal || !Poblacio || !Preu) {
            return res.status(400).json({ error: 'Faltan datos' });
        }

        // Verificar si l'immoble pertany a l'usuari autenticat
        const inmueble = await new Promise((resolve, reject) => {
            db.query('SELECT * FROM immobles WHERE id_immoble = ? AND id_usuari = ?', [id_immoble, id_usuari], (err, result) => {
                if (err) {
                    console.error("Error en la consulta SELECT:", err);
                    reject({ status: 500, message: ERROR_SERVIDOR });
                } else if (!result || result.length === 0) {
                    reject({ status: 404, message: ERROR_NO_RESULTATS });
                } else {
                    resolve(result[0]); // hem de rebre un resultat
                }
            });
        });

        // Actualitzar les dades rebudes a la bbdd
        db.query('UPDATE immobles SET Carrer = ?, Numero = ?, Pis = ?, Codi_Postal = ?, Poblacio = ?, Descripcio = ?, Preu = ?, Imatge = ? WHERE id_immoble = ?',
            [Carrer, Numero, Pis, Codi_Postal, Poblacio, Descripcio, Preu, Imatge, id_immoble],
            (err, result) => {
                if (err) {
                    console.error("Error en la actualización del inmueble:", err);
                    return res.status(500).json({ error: ERROR_SERVIDOR });
                } else {
                    res.status(200).json({ message: 'Inmueble actualizado con éxito' });
                }
            });
    } catch (error) {
        console.error("Error en el bloque catch:", error);
        res.status(error.status || 500).json({ error: error.message });
    }
});


// Endpoint per a la llista d'immobles per Email usuari (A)
immobles.get('/immobles/a/llistaImmobles/:Email', verificaToken, verificarTipusUsuari('A'), async(req, res) => {
    const Email = req.params.Email;

    // Consulta per obtenir els immobles associats a l'usuari amb l'email proporcionat
    const query = `
        SELECT i.*
        FROM immobles i
        INNER JOIN usuaris u ON i.id_usuari = u.id_usuari
        WHERE u.Email = ?
    `;

    db.query(query, [Email], (error, results) => {
        if (error) {
            console.error("Error:", error);
            return res.status(500).json({ error: ERROR_SERVIDOR });
        }
        if (!results || results.length === 0) {
            return res.status(404).json({ error: ERROR_NO_RESULTATS });
        }

        res.json(results);
    });
});

// Endpoint per afegir un usuari (A)
// Vinculat directament a usuaris/app/registre desde auth.js


// Endpoint per afegir un immoble a un usuari (A)// Endpoint per afegir un immoble a un usuari (A)
immobles.post('/immobles/a/afegirUsuariImmoble', verificaToken, verificarTipusUsuari('A'), async (req, res) => {

    try {
        // Recollir totes les dades de l'immoble del cos de la sol·licitud
        let { id_usuari, Carrer, Numero, Pis, Codi_Postal, Poblacio, Descripcio, Preu, Imatge } = req.body;

        // Comprovació de dades vàlides
        if (!id_usuari || !Carrer || !Numero || !Codi_Postal || !Poblacio || !Preu) {
            return res.status(400).json({ error: 'Faltan datos' });
        }

        // Consulta SQL per afegir un nou immoble a la bbdd amb l'id de l'usuari rebut en el cos de la sol·licitud
        db.query('INSERT INTO immobles (id_usuari, Carrer, Numero, Pis, Codi_Postal, Poblacio, Descripcio, Preu, Imatge) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [id_usuari, Carrer, Numero, Pis, Codi_Postal, Poblacio, Descripcio, Preu, Imatge], (err, result) => {
            if (err) {
                console.error("Error en la inserció d'immoble:", err);
                return res.status(500).json({ error: ERROR_SERVIDOR });
            } else {
                res.status(201).json({ message: 'Nuevo inmueble añadido con éxito' });
            }
        });
    } catch (err) {
        console.error("Error en el bloc catch:", err);
        res.status(500).json({ error: ERROR_SERVIDOR });
    }
});


// Endpoint per eliminar un immoble (A)
immobles.delete('/immobles/a/eliminarImmoble/:id_immoble/:id_usuari', verificaToken, verificarTipusUsuari('A'), async (req, res) => {

    // Recollir els IDs de l'immoble i de l'usuari de la URL
    const id_immoble = parseInt(req.params.id_immoble);
    const id_usuari = parseInt(req.params.id_usuari);

    try {
        // Comprovar si l'immoble pertany a l'usuari especificat
        const immoble = await new Promise((resolve, reject) => {
            db.query('SELECT * FROM immobles WHERE id_immoble = ? AND id_usuari = ?', [id_immoble, id_usuari], (err, result) => {
                if (err) {
                    console.error("Error en la consulta SELECT:", err);
                    reject({ status: 500, message: ERROR_SERVIDOR });
                } else if (!result || result.length === 0) {
                    reject({ status: 404, message: ERROR_NO_RESULTATS });
                } else {
                    resolve(result[0]); // Només necessitem un resultat
                }
            });
        });

        // Eliminar l'immoble de la base de dades
        await new Promise((resolve, reject) => {
            db.query('DELETE FROM immobles WHERE id_immoble = ?', [id_immoble], (err) => {
                if (err) {
                    console.error("Error en la consulta DELETE:", err);
                    reject({ status: 500, message: ERROR_SERVIDOR });
                } else {
                    resolve();
                }
            });
        });

        res.status(200).json({ message: 'Inmueble eliminado con éxito' });
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message });
    }

});

// Endpoint per actualitzar un immoble de qualsevol usuari registrat (A)
immobles.put('/immobles/a/actualitzar/:id_immoble', verificaToken, verificarTipusUsuari('A'), async (req, res) => {
    try {
        const id_immoble = parseInt(req.params.id_immoble);
        const { id_usuari, Carrer, Numero, Pis, Codi_Postal, Poblacio, Descripcio, Preu, Imatge } = req.body;

        if (isNaN(id_immoble) || id_immoble <= 0) {
            return res.status(400).json({ error: 'La ID del inmueble no es válida' });
        }
        if (!id_usuari || !Carrer || !Numero || !Codi_Postal || !Poblacio || !Preu) {
            return res.status(400).json({ error: 'Faltan datos' });
        }

        // Actualitzar les dades de l'immoble a la bbdd
        db.query('UPDATE immobles SET id_usuari = ?, Carrer = ?, Numero = ?, Pis = ?, Codi_Postal = ?, Poblacio = ?, Descripcio = ?, Preu = ?, Imatge = ? WHERE id_immoble = ?',
            [id_usuari, Carrer, Numero, Pis, Codi_Postal, Poblacio, Descripcio, Preu, Imatge, id_immoble],
            (err, result) => {
                if (err) {
                    console.error("Error en la actualización del inmueble:", err);
                    return res.status(500).json({ error: ERROR_SERVIDOR });
                } else {
                    res.status(200).json({ message: 'Inmueble actualizado con éxito' });
                }
            });
    } catch (error) {
        console.error("Error en el bloque catch:", error);
        res.status(error.status || 500).json({ error: error.message });
    }
});


module.exports = immobles;
