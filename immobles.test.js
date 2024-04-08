//const jwt = require("jsonwebtoken");
const request = require('supertest');
const app = require("./server.js")
const db = require('./database.js');
const immobles = require("./immobles.js");
const { verificaToken, verificarTipusUsuari } = require('./auth');
const validToken = 'token_valid';
const invalidToken = 'token_invalid';

jest.mock('./database', () => ({
  query: jest.fn(),
}));

jest.mock('./tokenUtils.js', () => ({
    refrescarToken: jest.fn().mockReturnValue({ accessToken: 'new_access_token', usuario: { id: 1, nombre: 'Usuario' } })
}));

jest.mock('./auth', () => ({
    verificaToken: jest.fn(),
    verificarTipusUsuari: jest.fn((tipusUsuari) => (req, res, next) => next()),
}));

// Proves GET llistat immobles
describe('Proves sobre /immobles', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('Hauria de retornar la llista d\'immobles correctament', async () => {
        const mockResults = [
            { id_immoble: 1, id_usuari: 1, Carrer: 'Carrer 1', Numero: '10', Pis: '1r', Codi_Postal: '08001', Poblacio: 'Barcelona', Descripcio: 'Bonic pis al centre de la ciutat', Preu: 120000.00, Imatge: 'imatge1.jpg' },
            { id_immoble: 2, id_usuari: 2, Carrer: 'Carrer 2', Numero: '20', Pis: '2n', Codi_Postal: '08002', Poblacio: 'Barcelona', Descripcio: 'Àtic amb vistes al mar', Preu: 250000.00, Imatge: 'imatge2.jpg' }
        ];
        db.query.mockImplementation((query, callback) => {
            callback(null, mockResults);
        });

        const response = await request(app).get('/immobles');
        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockResults);
    });

    it('Hauria de retornar un error del servidor quan falla la consulta a la base de dades', async () => {
        db.query.mockImplementation((query, callback) => {
            callback(new Error('Error en la consulta'), null);
        });

        const response = await request(app).get('/immobles');
        expect(response.status).toBe(500);
        expect(response.body).toBe('Error del servidor');
    });

    it('Hauria de retornar un error 404 si no es troben resultats a la base de dades', async () => {
        db.query.mockImplementation((query, callback) => {
            callback(null, []); // Simulem que no s'han trobat resultats
        });

        const response = await request(app).get('/immobles');
        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'No se encontraron resultados' });
    });

});

//Proves GET llistat immobles per Codi Postal
describe('Proves sobre /immobles/codi_postal/:codiPostal', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('Hauria de retornar els immobles amb el mateix Codi Postal correctament', async () => {
        const codiPostal = '08001';
        const mockResults = [
            { id_immoble: 1, id_usuari: 1, Carrer: 'Carrer 1', Numero: '10', Pis: '1r', Codi_Postal: '08001', Poblacio: 'Barcelona', Descripcio: 'Bonic pis al centre de la ciutat', Preu: 120000.00, Imatge: 'imatge1.jpg' },
            { id_immoble: 3, id_usuari: 3, Carrer: 'Carrer 3', Numero: '30', Pis: '3r', Codi_Postal: '08001', Poblacio: 'Barcelona', Descripcio: 'Apartament modern al Raval', Preu: 180000.00, Imatge: 'imatge3.jpg' }
        ];
        db.query.mockImplementation((query, values, callback) => {
            if (query.includes('Codi_Postal')) {
                callback(null, mockResults);
            }
        });

        const response = await request(app).get(`/immobles/codi_postal/${codiPostal}`);
        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockResults);
    });

    it('Hauria de retornar un error del servidor quan falla la consulta a la base de dades', async () => {
        const codiPostal = '08001';
        db.query.mockImplementation((query, values, callback) => {
            if (query.includes('Codi_Postal')) {
                callback(new Error('Error en la consulta'), null);
            }
        });

        const response = await request(app).get(`/immobles/codi_postal/${codiPostal}`);
        expect(response.status).toBe(500);
        expect(response.body).toBe('Error del servidor');
    });

    it('Hauria de retornar un error 404 si no es troben resultats a la base de dades', async () => {
        const codiPostal = '08001';
        db.query.mockImplementation((query, values, callback) => {
            if (query.includes('Codi_Postal')) {
                callback(null, []); // Simulem que no s'han trobat resultats
            }
        });

        const response = await request(app).get(`/immobles/codi_postal/${codiPostal}`);
        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'No se encontraron resultados' });
    });
});

// Proves GET llistat immobles per població
describe('Proves sobre /immobles/poblacio/:poblacio', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('Hauria de retornar els immobles de la població correctament', async () => {
        const poblacio = 'Barcelona';
        const mockResults = [
            { id_immoble: 1, id_usuari: 1, Carrer: 'Carrer 1', Numero: '10', Pis: '1r', Codi_Postal: '08001', Poblacio: 'Barcelona', Descripcio: 'Bonic pis al centre de la ciutat', Preu: 120000.00, Imatge: 'imatge1.jpg' },
            { id_immoble: 3, id_usuari: 3, Carrer: 'Carrer 3', Numero: '30', Pis: '3r', Codi_Postal: '08001', Poblacio: 'Barcelona', Descripcio: 'Apartament modern al Raval', Preu: 180000.00, Imatge: 'imatge3.jpg' }
        ];
        db.query.mockImplementation((query, values, callback) => {
            if (query.includes('Poblacio')) {
                callback(null, mockResults);
            }
        });

        const response = await request(app).get(`/immobles/poblacio/${poblacio}`);
        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockResults);
    });

    it('Hauria de retornar un error del servidor quan falla la consulta a la base de dades', async () => {
        const poblacio = 'Barcelona';
        db.query.mockImplementation((query, values, callback) => {
            if (query.includes('Poblacio')) {
                callback(new Error('Error en la consulta'), null);
            }
        });

        const response = await request(app).get(`/immobles/poblacio/${poblacio}`);
        expect(response.status).toBe(500);
        expect(response.body).toBe('Error del servidor');
    });

    it('Hauria de retornar un error 404 si no es troben resultats a la base de dades', async () => {
        const poblacio = 'Barcelona';
        db.query.mockImplementation((query, values, callback) => {
            if (query.includes('Poblacio')) {
                callback(null, []); // Simulem que no s'han trobat resultats
            }
        });

        const response = await request(app).get(`/immobles/poblacio/${poblacio}`);
        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'No se encontraron resultados' });
    });
});








