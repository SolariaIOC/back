const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
})

db.connect(err => {
    if (err) {
        console.log("Error connecting to DB", err);
        return;
    }
    console.log("Connected to DB");
});

app.get('/app', async (req, res) => {
    db.query('SELECT * FROM usuaris', (err, results) => {
        if (err) {
            console.log("Error");
            return;
        } else {
            res.send(results.data);
        }
    });
})

app.get('/app/:id', async (req, res) => {
    try {
        const id = req.params.id;
        db.query('SELECT * FROM usuaris where id_usuari = ?', id, (error, results) => {
            if (error) {
                console.log("Error:", error);
                return res.status(500).json("Server Error");
            } else {
                if (results.length > 0) {
                    res.send(results[0]);
                } else {
                    res.status(404).json("Not found");
                }
            }
        });
    } catch (err) {
        console.log("Catch block error:", err);
        res.status(500).json("Server Error");
    }
});

app.post('/app/registre', async (req, res) => {
    const { DNI, Nom, Cognoms, Contrasenya, TipusUsuari } = req.body;
    const queryComprobar = 'SELECT id_usuari FROM usuaris WHERE DNI = ?';
    db.query(queryComprobar, [DNI], (error, results) => {
        if (error) {
            res.status(500).send({ error: 'Error encontrando usuario' });
            return;
        }
        if (results.length === 0) {
            const queryInsertarUsuario = 'INSERT INTO usuaris (DNI, Nom, Cognoms, Contrasenya, TipusUsuari) VALUES (?, ?, ?, ?, ?)';
            db.query(queryInsertarUsuario, [DNI, Nom, Cognoms, Contrasenya, TipusUsuari], (err, result) => {
                if (err) {
                    console.log("Error creando la tabla");
                    res.status(500).send({ error: 'Error creando la tabla' });
                    return;
                }
            });
        } else {
            res.status(400).send('El usuario ya existe');
        }
    });
});


const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
    console.log(`Server is running at PORT: ${PORT}`);
});







