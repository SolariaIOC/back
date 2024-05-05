const express = require("express");
const bcrypt = require('bcrypt');
const db = require('./database');
const { verificaToken, verificarTipusUsuari } = require('./auth');

const usuaris = express();
usuaris.use(express.json());

/**
 * Obté la llista de tots els usuaris.
 * @route GET /app
 * @middleware verificaToken - Middleware per verificar el token.
 * @returns {object} - Retorna un array amb tots els usuaris.
 */
usuaris.get('/app', verificaToken, async (req, res) => {
    db.query('SELECT * FROM usuaris', (err, results) => {
        if (err) {
            console.log("Error:", err);
            return res.status(500).send("Error");
        } else {
            res.send(results);
        }
    });
});

/**
 * Obté un usuari per identificador d'usuari (ID).
 * @route GET /app/:id
 * @param {number} id.params.required - Identificador de l'usuari.
 * @middleware verificaToken - Middleware per verificar el token.
 * @returns {object} - Retorna l'usuari amb l'ID especificat.
 */
usuaris.get('/app/:id', verificaToken, async (req, res) => {
    try {
        const id = req.params.id;
        db.query('SELECT * FROM usuaris where id_usuari = ?', id, (error, results) => {
            if (error) {
                console.log("Error:", error);
                return res.status(500).send("Error del servidor");
            } else {
                if (results.length > 0) {
                    res.send(results[0]);
                } else {
                    res.status(404).send("No trobat");
                }
            }
        });
    } catch (err) {
        console.log("Error en el bloque catch:", err);
        res.status(500).send("Error del servidor");
    }
});

/**
 * Registra un nou usuari.
 * @route POST /app/registre
 * @param {string} Email.body.required - Correu electrònic de l'usuari.
 * @param {string} Nom.body.required - Nom de l'usuari.
 * @param {string} Cognoms.body.required - Cognoms de l'usuari.
 * @param {string} Contrasenya.body.required - Contrasenya de l'usuari.
 * @param {string} TipusUsuari.body.required - Tipus d'usuari.
 * @returns {object} - Retorna un missatge indicant que l'usuari s'ha creat amb èxit.
 */
usuaris.post('/app/registre', async (req, res) => {
    const { Email, Nom, Cognoms, Contrasenya, TipusUsuari } = req.body;
    bcrypt.hash(Contrasenya, 10, (err, hashedPassword) => {
        if (err) {
            console.log("Error al hashear la contrasenya:", err);
            return res.status(500).send({ error: 'Error al hashear la contrasenya' });
        }

        const queryComprobar = 'SELECT id_usuari FROM usuaris WHERE Email = ?';
        db.query(queryComprobar, [Email], (error, results) => {
            if (error) {
                res.status(500).send({ error: 'Error trobant l\'usuari' });
                return;
            }
            if (results.length === 0) {
                const queryInsertarUsuario = 'INSERT INTO usuaris (Email, Nom, Cognoms, Contrasenya, TipusUsuari) VALUES (?, ?, ?, ?, ?)';
                db.query(queryInsertarUsuario, [Email, Nom, Cognoms, hashedPassword, TipusUsuari], (err, result) => {
                    if (err) {
                        console.log("Error creant l'usuari:", err);
                        res.status(500).send({ error: 'Error creant l\'usuari' });
                        return;
                    }
                    res.status(200).send("Usuari creat amb èxit");
                });
            } else {
                res.status(400).send('L\'usuari ja existeix');
            }
        });
    });
});

/**
 * Elimina un usuari per identificador d'usuari (ID).
 * @route DELETE /app/a/eliminarUsuari/:id_usuari
 * @param {number} id_usuari.params.required - Identificador de l'usuari.
 * @middleware verificaToken - Middleware per verificar el token.
 * @middleware verificarTipusUsuari('A') - Middleware per verificar el tipus d'usuari.
 * @returns {object} - Retorna un missatge que indica que l'usuari s'ha eliminat amb èxit.
 */
usuaris.delete('/app/a/eliminarUsuari/:id_usuari', verificaToken, verificarTipusUsuari('A'), (req, res) => {
    try {
        if (req.usuario.TipusUsuari !== 'A') {
            return res.status(403).json({ error: 'Accés prohibit' });
        }

        const id_usuari = parseInt(req.params.id_usuari);

        if (isNaN(id_usuari) || id_usuari <= 0) {
            return res.status(400).json({ error: 'L\'ID de l\'usuari no és vàlid' });
        }

        const query = 'DELETE FROM usuaris WHERE id_usuari = ?';
        const values = [id_usuari];
        db.query(query, values, (err, result) => {
            if (err) {
                console.error("Error:", err);
                return res.status(500).json({ error: 'Error del servidor' });
            } else {
                if (result.affectedRows === 0) {
                    return res.status(404).json({ error: 'No s\'han trobat resultats' });
                } else {
                    res.status(200).json({ message: 'Usuari eliminat amb èxit' });
                }
            }
        });
    } catch (error) {
        console.error("Error en el bloque .catch:", error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

/**
 * Obté la llista de tots els usuaris.
 * @route GET /app/a/llistaUsuaris
 * @middleware verificaToken - Middleware per verificar el token.
 * @middleware verificarTipusUsuari('A') - Middleware per verificar el tipus d'usuari.
 * @returns {object} - Retorna un array amb tots els usuaris.
 */
usuaris.get('/app/a/llistaUsuaris', verificaToken, verificarTipusUsuari('A'), async (req, res) => {
    try {
        db.query('SELECT * FROM usuaris', (error, results) => {
            if (error) {
                console.error("Error:", error);
                return res.status(500).json({ error: 'Error en el servidor' });
            }
            if (!results || results.length === 0) {
                return res.status(404).json({ error: 'No s\'han trobat resultats' });
            }
            res.json(results);
        });
    } catch (error) {
        console.error("Error en el bloc catch:", error);
        res.status(500).json("Error del servidor");
    }
});

/**
 * Actualitza les dades d'un usuari per identificador d'usuari (ID).
 * @route PUT /app/a/actualitzarUsuari/:id_usuari
 * @param {number} id_usuari.params.required - Identificador de l'usuari.
 * @param {string} Email.body.required - Correu electrònic de l'usuari.
 * @param {string} Nom.body.required - Nom de l'usuari.
 * @param {string} Cognoms.body.required - Cognoms de l'usuari.
 * @param {string} Contrasenya.body.required - Contrasenya de l'usuari.
 * @param {string} TipusUsuari.body.required - Tipus d'usuari.
 * @middleware verificaToken - Middleware per verificar el token.
 * @middleware verificarTipusUsuari('A') - Middleware per verificar el tipus d'usuari.
 * @returns {object} - Retorna un missatge que indica que l'usuari s'ha actualitzat amb èxit.
 */
usuaris.put('/app/a/actualitzarUsuari/:id_usuari', verificaToken, verificarTipusUsuari('A'), async (req, res) => {
    try {
        const id_usuari = parseInt(req.params.id_usuari);
        const { Email, Nom, Cognoms, Contrasenya, TipusUsuari } = req.body;

        if (isNaN(id_usuari) || id_usuari <= 0) {
            return res.status(400).json({ error: 'L\'ID de l\'usuari no és vàlid' });
        }
        if (!Email || !Nom || !Cognoms || !TipusUsuari) {
            return res.status(400).json({ error: 'Falten dades' });
        }

        // Hashear la contrasenya abans d'actualitzar-la
        try {
            if (!Contrasenya) {
                db.query('UPDATE usuaris SET Email = ?, Nom = ?, Cognoms = ?, TipusUsuari = ? WHERE id_usuari = ?',
                    [Email, Nom, Cognoms, TipusUsuari, id_usuari],
                    (err, result) => {
                        if (err) {
                            console.error("Error en l'actualització de l'usuari:", err);
                            return res.status(500).json({ error: 'Error del servidor' });
                        } else {
                            res.status(200).json({ message: 'Usuari actualitzat amb èxit' });
                        }
                    });
            } else {
                const hashedPassword = await bcrypt.hash(Contrasenya, 10);

                // Actualitzar les dades de l'usuari a la base de dades
                db.query('UPDATE usuaris SET Email = ?, Nom = ?, Cognoms = ?, Contrasenya = ?, TipusUsuari = ? WHERE id_usuari = ?',
                    [Email, Nom, Cognoms, hashedPassword, TipusUsuari, id_usuari],
                    (err, result) => {
                        if (err) {
                            console.error("Error en l'actualització de l'usuari:", err);
                            return res.status(500).json({ error: 'Error del servidor' });
                        } else {
                            res.status(200).json({ message: 'Usuari actualitzat amb èxit' });
                        }
                    });
            }
        } catch (error) {
            console.log("Error al hashear la contrasenya:", error);
            return res.status(500).json({ error: 'Error al hashear la contrasenya' });
        }
    } catch (error) {
        console.error("Error en el bloque catch:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = usuaris;
