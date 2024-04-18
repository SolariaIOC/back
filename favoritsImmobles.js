const express = require("express");
const db = require('./database');
const { verificaToken, verificarTipusUsuari } = require('./auth');
const { verificaExisteixImmoble } = require('./functions');
const ERROR_SERVIDOR = "Error del servidor";
const ERROR_NO_RESULTATS = "No se encontraron resultados";

const favoritsImmobles = express();
favoritsImmobles.use(express.json());

// Endpoint llistar immobles favorits d'un usuari
favoritsImmobles.get('/favorits', verificaToken, verificarTipusUsuari('R'), (req, res) => {
    try {
        const id_usuari = req.usuario.id_usuari;

        if (!id_usuari || isNaN(id_usuari)) {
            return res.status(400).json({ error: 'El ID del usuario no es válido' });
        }

        const query = `
            SELECT i.*
            FROM immobles i
            INNER JOIN immobles_favorits f ON i.id_immoble = f.id_immoble
            WHERE f.id_usuari = ?;
        `;

        db.query(query, [id_usuari], (error, immobles) => {
            if (error) {
                console.error("Error al obtener los inmuebles favoritos:", error);
                return res.status(500).json({ error: ERROR_SERVIDOR });
            }

            if (immobles.length === 0) {
                return res.status(404).json({ message: ERROR_NO_RESULTATS });
            }

            res.status(200).json(immobles);
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

// Endpoint per afegir o eliminar immobles favorits d'un usuari
favoritsImmobles.post('/gestionarImmobleFavorit', verificaToken, verificarTipusUsuari('R'), async (req, res) => {
    try {
        const id_usuari = req.usuario.id_usuari;
        const { id_immoble } = req.body;

        if (!id_immoble || isNaN(id_immoble)) {
            return res.status(400).json({ error: 'El ID del inmueble no es válido' });
        }

        // Verifica si l'immoble ja és favorit de l'usuari
        const query = 'SELECT * FROM immobles_favorits WHERE id_usuari = ? AND id_immoble = ?';
        db.query(query, [id_usuari, id_immoble], (error, result) => {
            if (error) {
                console.error('Error verificando inmueble favorito:', error);
                return res.status(500).json({ error: ERROR_SERVIDOR });
            }

            if (result.length === 0) {
                // Si no és favorit, l'afegiim a la taula
                const insertQuery = 'INSERT INTO immobles_favorits (id_usuari, id_immoble) VALUES (?, ?)';
                db.query(insertQuery, [id_usuari, id_immoble], (error, result) => {
                    if (error) {
                        console.error('Error añadiendo inmueble a favoritos:', error);
                        return res.status(500).json({ error: ERROR_SERVIDOR });
                    }
                    res.status(200).json({ message: 'Inmueble añadido a favoritos con éxito' });
                });
            } else {
                // Si ja és favorit, s'elimina de la taula
                const deleteQuery = 'DELETE FROM immobles_favorits WHERE id_usuari = ? AND id_immoble = ?';
                db.query(deleteQuery, [id_usuari, id_immoble], (error, result) => {
                    if (error) {
                        console.error('Error eliminando inmueble de favoritos:', error);
                        return res.status(500).json({ error: ERROR_SERVIDOR });
                    }
                    res.status(200).json({ message: 'Inmueble eliminado de favoritos con éxito' });
                });
            }
        });
    } catch (error) {
        console.error('Error gestionando el inmueble favorito:', error);
        res.status(500).json({ error: ERROR_SERVIDOR });
    }
});

module.exports = favoritsImmobles;

