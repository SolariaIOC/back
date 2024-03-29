const express = require("express");
const bcrypt = require('bcrypt');
const db = require('./database');


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

module.exports = usuaris;