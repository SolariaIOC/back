/**
 * Petit simulador d'hipoteques 
 * funciona amb dades bàsiques.
 */

const express = require("express");

const calculaHipoteca = express();
calculaHipoteca.use(express.json());

/**
 * Endpoint per simular hipoteques
 * @param {Request} req La petició HTTP
 * @param {Response} res La resposta HTTP
 * @returns {void}
 */
calculaHipoteca.post('/simulador/hipoteca', (req, res) => {
    try {
        const { preu_vivenda, prestec, temps_anys } = req.body;

        if (!preu_vivenda || !prestec || !temps_anys) {
            return res.status(400).json({ error: 'Falten dades' });
        }

        // Calcular l'import total a tornar (prèstec + interessos)
        const interesAnual = 0.05; 
        const interesMensual = interesAnual / 12; 
        const numPagaments = temps_anys * 12; 
        const quotaMensual = (prestec * interesMensual) / (1 - Math.pow(1 + interesMensual, -numPagaments));
        const totalAPagar = quotaMensual * numPagaments;

        // Preparar i enviar la resposta com un objecte JSON
        const respuesta = {
            quota_mensual: quotaMensual.toFixed(2),
            total_a_pagar: totalAPagar.toFixed(2)
        };

        res.status(200).json(respuesta);
    } catch (error) {
        console.error("Error en el bloc catch:", error);
        res.status(error.status || 500).json({ error: 'Error del servidor' });
    }
});

module.exports = calculaHipoteca;
