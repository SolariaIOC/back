const express = require("express");
const bcrypt = require('bcrypt');
const db = require('./database');
const { verificaToken, verificarTipusUsuari } = require('./auth');


const usuaris = express();
usuaris.use(express.json())

usuaris.get('/app', async (req, res) => {
    db.query('SELECT * FROM usuaris', (err, results) => {
        if (err) {
            console.log("Error");
            return res.status(500).send("Error")
        } else {
            res.send(results);
        }
    });
})

usuaris.get('/app/:id', async (req, res) => {
    try {
        const id = req.params.id;
        db.query('SELECT * FROM usuaris where id_usuari = ?', id, (error, results) => {
            if (error) {
                console.log("Error:", error);
                return res.status(500).send("Server Error");
            } else {
                if (results.length > 0) {
                    res.send(results[0]);
                } else {
                    res.status(404).send("Not found");
                }
            }
        });
    } catch (err) {
        console.log("Catch block error:", err);
        res.status(500).send("Server Error");
    }
});



usuaris.post('/app/registre', async (req, res) => {
    const { Email, Nom, Cognoms, Contrasenya, TipusUsuari } = req.body;
    bcrypt.hash(Contrasenya, 10, (err, hashedPassword) => {
        if (err) {
            console.log("Error hashing password:", err);
            return res.status(500).send({ error: 'Error hashing password' });
        }

        const queryComprobar = 'SELECT id_usuari FROM usuaris WHERE Email = ?';
        db.query(queryComprobar, [Email], (error, results) => {
            if (error) {
                res.status(500).send({ error: 'Error encontrando usuario' });
                return;
            }
            if (results.length === 0) {
                const queryInsertarUsuario = 'INSERT INTO usuaris (Email, Nom, Cognoms, Contrasenya, TipusUsuari) VALUES (?, ?, ?, ?, ?)';
                db.query(queryInsertarUsuario, [Email, Nom, Cognoms, hashedPassword, TipusUsuari], (err, result) => {
                    if (err) {
                        console.log("Error creando la tabla");
                        res.status(500).send({ error: 'Error creando la tabla' });
                        return;
                    }
                    res.status(200).send("Usuario creado con éxito");
                });
            } else {
                res.status(400).send('El usuario ya existe');
            }
        });
    });
});

// Endpoint per eliminar un usuari (A)
//rep un id_usuari com a parametre per eliminar-ho si existeix.
usuaris.delete('/app/a/eliminarUsuari/:id_usuari', verificaToken, verificarTipusUsuari('A'), (req, res) => {
    try {
        if (req.usuario.TipusUsuari !== 'A') {
            return res.status(403).json({ error: 'Acceso prohibido' });
        }

        const id_usuari = parseInt(req.params.id_usuari);

        if (isNaN(id_usuari) || id_usuari <= 0) {
            return res.status(400).json({ error: 'El ID del usuario no es válido' });
        }

        const query = 'DELETE FROM usuaris WHERE id_usuari = ?';
        const values = [id_usuari];
        db.query(query, values, (err, result) => {
            if (err) {
                console.error("Error:", err);
                return res.status(500).json({ error: 'Error del servidor' });
            } else {
                if (result.affectedRows === 0) {
                    return res.status(404).json({ error: 'No se encontraron resultados' });
                } else {
                    res.status(200).json({ message: 'Usuario eliminado con éxito' });
                }
            }
        });
    } catch (error) {
        console.error("Error en el bloque .catch:", error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});
 

// Endpoint per a la llista de tots els usuaris (A)
usuaris.get('/app/a/llistaUsuaris', verificaToken, verificarTipusUsuari('A'), async (req, res) => {
    try {
        db.query('SELECT * FROM usuaris', (error, results) => {
            if (error) {
                console.error("Error:", error);
                return res.status(500).json({ error: 'Error en el servidor' });
            }
            if (!results || results.length === 0) {
                return res.status(404).json({ error: 'No se encontraron resultados' });
            }
            res.json(results);
        });
    } catch (error) {
        console.error("Error en el bloc catch:", error);
        res.status(500).json("Error del servidor");
    }
});

// Endpoint per actualitzar les dades de qualsevol usuari (A)
usuaris.put('/app/a/actualitzarUsuari/:id_usuari', verificaToken, verificarTipusUsuari('A'), async (req, res) => {
    try {
        const id_usuari = parseInt(req.params.id_usuari);
        const { Email, Nom, Cognoms, Contrasenya, TipusUsuari } = req.body;

        if (isNaN(id_usuari) || id_usuari <= 0) {
            return res.status(400).json({ error: 'El ID del usuario no es válido' });
        }
        if (!Email || !Nom || !Cognoms || !TipusUsuari) {
            return res.status(400).json({ error: 'Faltan datos' });
        }

        // Hashear la contrasenya abans d'actualitzar-la
        try {

            if(!Contrasenya){
                db.query('UPDATE usuaris SET Email = ?, Nom = ?, Cognoms = ?, TipusUsuari = ? WHERE id_usuari = ?',
                    [Email, Nom, Cognoms, TipusUsuari, id_usuari],
                    (err, result) => {
                        if (err) {
                            console.error("Error en l'actualització de l'usuari:", err);
                            return res.status(500).json({error: 'Error del servidor'});
                        } else {
                            res.status(200).json({message: 'Usuario actualizado con éxito'});
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
                            return res.status(500).json({error: 'Error del servidor'});
                        } else {
                            res.status(200).json({message: 'Usuario actualizado con éxito'});
                        }
                    });
            }
        } catch (error) {
            console.log("Error al hashear la contraseña:", error);
            return res.status(500).json({ error: 'Error al hashear la contraseña' });
        }
    } catch (error) {
        console.error("Error en el bloque catch:", error);
        res.status(500).json({ error: error.message });
    }
});





module.exports = usuaris;
