//Treballem amb 3 tipus d'usuari
// anónim = (accesible per tothom)
// Registrat = (R) nomes pot accedir a les seves dades
// Administrador = (A) pot accedir a tots els usuaris i immobles

const express = require("express");
const db = require('./database');
const verificaToken = require('./auth');

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
immobles.get('/immobles/r', verificaToken, async (req, res) => {
    try {
        const idUsuariToken = req.usuario.id_usuari;

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
immobles.post('/immobles/r/afegir', verificaToken, async (req, res) => {
    try {
        // Recollim dades de l'immoble del body, excepte id_usuari que l'agafa del token
        let { Carrer, Numero, Pis, Codi_Postal, Poblacio, Descripcio, Preu, Imatge } = req.body;
        const id_usuari = req.usuario.id_usuari;

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
immobles.delete('/immobles/r/eliminar/:id_immoble', verificaToken, async (req, res) => {
    
    // Recollim el id_usuari del token i la id_immoble de la URL
    const { id_usuari, TipusUsuari } = req.usuario;
    const id_immoble_param = parseInt(req.params.id_immoble); // Diferenciem el paràmetre id_immoble

    // Verifiquem si el tipus d'usuari és "R"
    if (TipusUsuari !== "R") {
        return res.status(403).json({ error: 'Usuari no registrat' });
    }

    // Verifiquem si la id_immoble és un número vàlid
    if (isNaN(id_immoble_param) || id_immoble_param <= 0) {
        return res.status(400).json({ error: 'La ID de l\'immoble no és vàlida' });
    }

    try {
    // Comprovem si l'immoble pertany a l'usuari autenticat
    const immoble = await new Promise((resolve, reject) => {
        db.query('SELECT * FROM immobles WHERE id_immoble = ? AND id_usuari = ?', [id_immoble_param, id_usuari], (err, result) => {
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

// Endpoint per a la llista de tots els usuaris (A)
immobles.get('/immobles/a/llistaUsuaris', verificaToken, async (req, res) => {
    try {
        db.query('SELECT * FROM usuaris', (error, results) => {
            if (error) {
                console.error("Error:", error);
                return res.status(500).json({ error: 'Error en el servidor' });
            }
            if (!results || results.length === 0) {
                return res.status(404).json({ error: 'No s\'ha trobat cap usuari' });
            }
            res.json(results);
        });
    } catch (error) {
        console.error("Error en el bloc catch:", error);
        res.status(500).json("Error del servidor");
    }
});


// Endpoint per a la llista d'usuaris per Email usuari (A)
immobles.get('/immobles/a/llistaUsuaris/:Email', verificaToken, async (req, res) => {
    try {
        const Email = req.params.Email;

        db.query('SELECT * FROM usuaris WHERE Email = ?', [Email], (error, results) => {
            if (error) {
                console.error("Error:", error);
                return res.status(500).json({ error: 'Error en el servidor' });
            }
            if (!results || results.length === 0) {
                return res.status(404).json({ error: 'No s\'ha trobat cap usuari' });
            }
            res.json(results);
        });
    } catch (error) {
        console.error("Error en el bloc catch:", error);
        res.status(500).json("Error del servidor");
    }
});

// Endpoint per a la llista d'immobles per Email usuari (A)
immobles.get('/immobles/a/llistaImmobles/:Email', verificaToken, (req, res) => {
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
            return res.status(500).json({ error: 'Error en el servidor' });
        }
        if (!results || results.length === 0) {
            return res.status(404).json({ error: 'No s\'han trobat immobles per a aquest usuari' });
        }

        res.json(results);
    });
});

// Endpoint per afegir un usuari (A)
// Vinculat directament a usuaris/app/registre desde auth.js


// Endpoint per afegir un immoble a un usuari (A)
immobles.post('/immobles/a/afegirUsuariImmoble/:id_usuari', verificaToken, async (req, res) => {
    // Verificar que l'usuari que fa la sol·licitud sigui de tipus "A"
    if (req.usuario.TipusUsuari !== 'A') {
        return res.status(403).json({ error: 'Acceso prohibido' });
    }

    // Recollir el ID de l'usuari de la URL
    const id_usuari = parseInt(req.params.id_usuari);

    try {
        // Recollim dades de l'immoble del body
        let { Carrer, Numero, Pis, Codi_Postal, Poblacio, Descripcio, Preu, Imatge } = req.body;

        // Netejem les dades rebudes abans de fer la consulta
        Carrer = netejaDada(Carrer);
        Numero = netejaDada(Numero);
        Pis = netejaDada(Pis);
        Codi_Postal = netejaDada(Codi_Postal);
        Poblacio = netejaDada(Poblacio);
        Descripcio = netejaDada(Descripcio);
        Preu = netejaDada(Preu);
        Imatge = netejaDada(Imatge);

        // Consulta SQL per afegir un nou immoble a la bbdd amb l'id de l'usuari rebut per URL
        db.query('INSERT INTO immobles (id_usuari, Carrer, Numero, Pis, Codi_Postal, Poblacio, Descripcio, Preu, Imatge) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [id_usuari, Carrer, Numero, Pis, Codi_Postal, Poblacio, Descripcio, Preu, Imatge], (err, result) => {
            if (err) {
                console.error("Error en la inserció d'immoble:", err);
                return res.status(500).json({ error: 'Error del servidor' });
            } else {
                res.status(201).json({ message: 'Nou immoble afegit amb èxit!' });
            }
        });
    } catch (err) {
        console.error("Error en el bloc catch:", err);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

/*
// Endpoint per eliminar un usuari (A)
immobles.delete('/immobles/a/eliminarUsuari/:id_usuari', verificaToken, (req, res) => {
    
    if (req.usuario.TipusUsuari !== 'A') {
        return res.status(403).json({ error: 'Acceso prohibido' }); 
    }

    const id_usuari = parseInt(req.params.id_usuari);

    if (isNaN(id_usuari) || id_usuari <= 0) {
        return res.status(400).json({ error: 'El ID del usuario no es válido' }); 
    }

    // Executar la consulta SQL per eliminar l'usuari de la base de dades
    db.query('DELETE FROM usuaris WHERE id_usuari = ?', [id_usuari], (err, result) => {
        if (err) {
            console.error("Error:", err);
            return res.status(500).json({ error: 'Error del servidor' }); 
        } else {
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'No se ha encontrado ningún usuario con este ID' }); 
            } else {
                res.status(200).json({ message: 'Usuario eliminado con éxito' }); 
            }
        }
    });
});
*/

// Endpoint per eliminar un immoble (A)
immobles.delete('/immobles/a/eliminarImmoble/:id_immoble/:id_usuari', verificaToken, async (req, res) => {
    // Verificar que l'usuari que fa la sol·licitud sigui de tipus "A"
    if (req.usuario.TipusUsuari !== 'A') {
        return res.status(403).json({ error: 'Acceso prohibido' });
    }

    // Recollir els IDs de l'immoble i de l'usuari de la URL
    const id_immoble = parseInt(req.params.id_immoble);
    const id_usuari = parseInt(req.params.id_usuari);

    try {
        // Comprovar si l'immoble pertany a l'usuari especificat
        const immoble = await new Promise((resolve, reject) => {
            db.query('SELECT * FROM immobles WHERE id_immoble = ? AND id_usuari = ?', [id_immoble, id_usuari], (err, result) => {
                if (err) {
                    console.error("Error en la consulta SELECT:", err);
                    reject({ status: 500, message: 'Error del servidor' });
                } else if (!result || result.length === 0) {
                    reject({ status: 404, message: 'No s\'ha trobat cap immoble amb aquesta ID per a aquest usuari' });
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

