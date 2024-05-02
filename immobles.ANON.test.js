const request = require('supertest');
const app = require("./server.js");
const db = require('./database.js');
const immobles = require("./immobles.js");
const { paginateResults } = require('./functions');

// Mock de la base de dades
jest.mock('./database', () => ({
    query: jest.fn((query, values, callback) => {
        if (query.startsWith('SELECT COUNT')) {
            // Canviem el mock per retornar la longitud esperada de resultats
            const mockResults = [{ total: 4 }];
            callback(null, mockResults);
        } else if (query.startsWith('SELECT')) {
            const limit = values[0];
            const offset = values[1];
            // Modifiquem els resultats perquè es corresponguin amb les crides de les proves
            let mockResults = [];
            if (limit === 10 && offset === 0) {
                mockResults = [
                    { id_immoble: 1, id_usuari: 1, Carrer: 'Carrer 1', Numero: '10', Pis: '1r', Codi_Postal: '08001', Poblacio: 'Barcelona', Descripcio: 'Bonic pis al centre de la ciutat', Preu: 120000.00, Imatge: 'imatge1.jpg' },
                    { id_immoble: 2, id_usuari: 2, Carrer: 'Carrer 2', Numero: '20', Pis: '2n', Codi_Postal: '08002', Poblacio: 'Girona', Descripcio: 'Àtic amb vistes al mar', Preu: 250000.00, Imatge: 'imatge2.jpg' },
                    { id_immoble: 3, id_usuari: 1, Carrer: 'Carrer 3', Numero: '30', Pis: '3r', Codi_Postal: '08003', Poblacio: 'Sabadell', Descripcio: 'Casa amb vistes a la muntanya', Preu: 150000.00, Imatge: 'imatge3.jpg' },
                    { id_immoble: 4, id_usuari: 2, Carrer: 'Carrer 4', Numero: '40', Pis: '4t', Codi_Postal: '08003', Poblacio: 'Barcelona', Descripcio: 'Casa amb vistes al camp', Preu: 150000.00, Imatge: 'imatge4.jpg' }
                ];
            }
            callback(null, mockResults);
        }
    }),
}));


// Mock del middleware de paginació
jest.mock('./functions', () => ({
    paginateResults: (req, res, next) => {
        const page = req.query.page ? parseInt(req.query.page) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const offset = (page - 1) * limit;

        req.pagination = { limit, offset, currentPage: page };
        next();
    },
}));

describe('Proves sobre /immobles', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('Hauria de retornar la llista d\'immobles correctament', async () => {
        // Fes una petició GET a l'endpoint /immobles
        const response = await request(app).get('/immobles');
    
        // Verifica que la petició s'ha fet correctament
        expect(response.status).toBe(200);
    
        // Verifica que el cos de la resposta coincideix amb les dades esperades
        expect(response.body).toEqual({
            results: [
                { id_immoble: 1, id_usuari: 1, Carrer: 'Carrer 1', Numero: '10', Pis: '1r', Codi_Postal: '08001', Poblacio: 'Barcelona', Descripcio: 'Bonic pis al centre de la ciutat', Preu: 120000.00, Imatge: 'imatge1.jpg' },
                { id_immoble: 2, id_usuari: 2, Carrer: 'Carrer 2', Numero: '20', Pis: '2n', Codi_Postal: '08002', Poblacio: 'Girona', Descripcio: 'Àtic amb vistes al mar', Preu: 250000.00, Imatge: 'imatge2.jpg' },
                { id_immoble: 3, id_usuari: 1, Carrer: 'Carrer 3', Numero: '30', Pis: '3r', Codi_Postal: '08003', Poblacio: 'Sabadell', Descripcio: 'Casa amb vistes a la muntanya', Preu: 150000.00, Imatge: 'imatge3.jpg' },
                { id_immoble: 4, id_usuari: 2, Carrer: 'Carrer 4', Numero: '40', Pis: '4t', Codi_Postal: '08003', Poblacio: 'Barcelona', Descripcio: 'Casa amb vistes al camp', Preu: 150000.00, Imatge: 'imatge4.jpg' }
            ],
            pagination: {
                totalResults: 4,
                totalPages: 1,
                currentPage: 1,
                nextPage: null,
                prevPage: null
            }
        });
    });
    

    it('Hauria de retornar un error del servidor quan falla la consulta a la base de dades', async () => {
        // Simula un error en la consulta a la base de dades
        require('./database').query.mockImplementation((query, values, callback) => {
            callback(new Error('Error en la consulta'), null);
        });

        // Fes una petició GET a l'endpoint /immobles
        const response = await request(app).get('/immobles');

        // Verifica que es retorna un error 500
        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Error del servidor' });
    });

    it('Hauria de retornar un error 404 si no es troben resultats a la base de dades', async () => {
        // Simula que no es troben resultats a la base de dades
        require('./database').query.mockImplementation((query, values, callback) => {
            callback(null, []); // Canviar per una llista buida
        });

        // Fes una petició GET a l'endpoint /immobles
        const response = await request(app).get('/immobles');

        // Verifica que es retorna un error 404
        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'No se encontraron resultados' });
    });
});

