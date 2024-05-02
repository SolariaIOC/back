const request = require('supertest');
const app = require("./server.js")
const db = require('./database.js');
const immobles = require("./immobles.js");
const { verificaToken, verificarTipusUsuari } = require('./auth');
const { crearObjectesMock } = require('./functions');
const mockUserId = 1;


jest.mock('./database', () => ({
    query: jest.fn(),
}));

// Mock per al middleware de verificació de token
jest.mock('./auth', () => ({
    verificaToken: jest.fn().mockImplementation((req, res, next) => {
        // Simulem que el token és vàlid
        req.usuario = { id_usuari: 12, TipusUsuari: 'R' };
        next();
    }),
    verificarTipusUsuari: jest.fn().mockImplementation((tipusUsuari) => (req, res, next) => {
        if (req.usuario && req.usuario.TipusUsuari === tipusUsuari) {
            next(); // Si l'usuari té el tipus esperat, continuem
        } else {
            res.status(403).json({ error: 'Acceso prohibido' });
        }
    }),
}));


// Proves retorna llista per ID usuari (R)
describe('Endpoint /immobles/r', () => {
    beforeEach(() => {
        // Configuració bàsica de l'objecte mockRequest
        mockRequest = {
            body: {
                Carrer: 'Carrer 4',
                Numero: '40',
                Pis: '4t',
                Codi_Postal: '08003',
                Poblacio: 'Barcelona',
                Descripcio: 'Pis amb terrassa',
                Preu: 200000,
                Imatge: 'imatge4.jpg'
            },
            usuario: {
                id_usuari: mockUserId // Utilitzem l'ID d'usuari mock
            }
        };
    });
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('Hauria de retornar la llista d\'immobles de l\'usuari correctament', async () => {

        // Creem els objectes req, res i next
        const { req, res, next } = crearObjectesMock();
        const mockImmobles = [
            { id_immoble: 1, id_usuari: 12, Carrer: 'Carrer 1', Numero: '10', Pis: '1r', Codi_Postal: '08001', Poblacio: 'Barcelona', Descripcio: 'Bonic pis al centre de la ciutat', Preu: 120000.00, Imatge: 'imatge1.jpg' },
            { id_immoble: 2, id_usuari: 12, Carrer: 'Carrer 2', Numero: '20', Pis: '2n', Codi_Postal: '08002', Poblacio: 'Barcelona', Descripcio: 'Àtic amb vistes al mar', Preu: 250000.00, Imatge: 'imatge2.jpg' }
        ];

        // Simulem el comportament de la consulta a la base de dades
        db.query.mockImplementation((query, values, callback) => {
            if (query === 'SELECT * FROM immobles WHERE id_usuari = ?') {
                callback(null, mockImmobles);
            }
        });

        // Realitzem la sol·licitud HTTP a l'endpoint
        const response = await request(app).get('/immobles/r');

        // Verifiquem que la resposta sigui correcta
        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockImmobles);
    });

    it('Hauria de retornar un error 500 si hi ha un error en la consulta a la base de dades', async () => {
        // Creem els objectes req, res i next
        const { req, res, next } = crearObjectesMock();

        db.query.mockImplementation((query, values, callback) => {
            if (query === 'SELECT * FROM immobles WHERE id_usuari = ?') {
                callback(new Error('Error en la consulta'), null);
            }
        });

        const response = await request(app).get('/immobles/r');
        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Error del servidor' });
    });

    it('Hauria de retornar un error 404 si no es troben immobles per l\'usuari', async () => {
        // Creem els objectes req, res i next
        const { req, res, next } = crearObjectesMock();
        db.query.mockImplementation((query, values, callback) => {
            if (query === 'SELECT * FROM immobles WHERE id_usuari = ?') {
                callback(null, []); // Simulem que no s'han trobat resultats
            }
        });

        const response = await request(app).get('/immobles/r');
        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'No se encontraron resultados' });
    });

});

// Proves afegim immoble a usuari (R)
describe('Endpoint /immobles/r/afegir', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    const mockUserId = 1; // Definim l'ID de l'usuari mock

    it('Hauria d\'afegir un nou immoble amb dades vàlides', async () => {
        // Creem els objectes req, res i next
        const { req, res, next } = crearObjectesMock();

        // Mocks per a les consultes a la base de dades
        db.query.mockImplementation((query, values, callback) => {
            // Simulem l'èxit de la inserció
            if (query.startsWith('INSERT INTO immobles')) {
                callback(null, { insertId: 1 });
            }
        });

        const response = await request(app)
            .post('/immobles/r/afegir')
            .send(mockRequest.body);

        expect(response.status).toBe(201);
        expect(response.body).toEqual({ message: 'Nuevo inmueble añadido con éxito' });
    });

    it('Hauria de retornar un error 500 si hi ha un error en la consulta a la base de dades', async () => {
        // Creem els objectes req, res i next
        const { req, res, next } = crearObjectesMock();

        // Mocks per a les consultes a la base de dades
        db.query.mockImplementation((query, values, callback) => {
            callback(new Error('Error en la consulta'), null);
        });

        const response = await request(app)
            .post('/immobles/r/afegir')
            .send(mockRequest.body);

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Error del servidor' });
    });

    it('Hauria de retornar un error 500 si falten dades en el cos de la sol·licitud', async () => {

        mockRequest = {
            body: {
                Carrer: 'Carrer 4',
                Numero: '40',
                Pis: '4t',
                Codi_Postal: '08003',
                Imatge: 'imatge4.jpg'
            },
            usuario: {
                id_usuari: mockUserId // Utilitzem l'ID d'usuari mock
            }
        };

        const response = await request(app)
            .post('/immobles/r/afegir')
            .send(mockRequest.body);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Faltan datos' });
    });

    it('Hauria de retornar un error 400 si es passen dades invàlides per afegir un immoble', async () => {
        mockRequest.body.Poblacio = '';
        // Creem els objectes req, res i next
        const { req, res, next } = crearObjectesMock();

        const response = await request(app)
            .post('/immobles/r/afegir')
            .send(mockRequest.body);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Faltan datos' });
    });

});

// Proves per eliminar un immoble segons ID usuari (R)
describe('Proves sobre l\'endpoint per eliminar immobles', () => {
    const id_immoble_valid = 1;
    const id_immoble_invalid = 999;
    const id_immoble_erronia = 'immoble_invalid';
    const mockImmobles = [
        { id_immoble: 1, id_usuari: 1, Carrer: 'Carrer 1', Numero: '10', Pis: '1r', Codi_Postal: '08001', Poblacio: 'Barcelona', Descripcio: 'Bonic pis al centre de la ciutat', Preu: 120000.00, Imatge: 'imatge1.jpg' },
        { id_immoble: 2, id_usuari: 1, Carrer: 'Carrer 2', Numero: '20', Pis: '2n', Codi_Postal: '08002', Poblacio: 'Barcelona', Descripcio: 'Àtic amb vistes al mar', Preu: 250000.00, Imatge: 'imatge2.jpg' }
    ];


    it('Hauria de retornar un error 400 si la ID de l\'immoble no és vàlida', async () => {
        // Creem els objectes req, res i next
        const { req, res, next } = crearObjectesMock();
        const response = await request(app)
            .delete(`/immobles/r/eliminar/${id_immoble_erronia}`)

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'La ID del inmueble no és válida' });
    });

    it('Hauria de retornar un error 404 si no es troba cap immoble amb la ID proporcionada', async () => {
        // Creem els objectes req, res i next
        const { req, res, next } = crearObjectesMock();
        // Mock de la funció de consulta de la base de dades
        db.query = jest.fn().mockImplementation((sql, params, callback) => {
            callback(null, []);
        });

        const response = await request(app)
            .delete(`/immobles/r/eliminar/${id_immoble_invalid}`)

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'No se encontraron resultados' });
    });

    it('Hauria de retornar un error 403 si l\'usuari no és de tipus R', async () => {
        const usuariNoR = { id_usuari: 1, TipusUsuari: 'C' };
        // Creem els objectes req, res i next utilitzant la funció crearObjectesMock
        const { req, res, next } = crearObjectesMock();
        // Assignem l'usuari no R al req
        req.usuario = usuariNoR;

        // Implementació de la ruta directament dins de la prova
        app.delete('/immobles/r/eliminar/:id', verificarTipusUsuari('R'), async (req, res) => {
            try {
                const immobleId = req.params.id;
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
                res.status(200).json({ message: 'Immoble eliminat amb èxit' });
            } catch (error) {
                console.error('Error en eliminar immoble:', error);
                res.status(500).json({ error: 'Error en eliminar l\'immoble' });
            }
        });

        // Executem el middleware de verificarTipusUsuari
        verificarTipusUsuari('R')(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: 'Acceso prohibido' });
    });



    it('Hauria d\'eliminar correctament l\'immoble si tot és correcte', async () => {
        // Creem els objectes req, res i next
        const { req, res, next } = crearObjectesMock();
        // Mock de la funció de consulta de la base de dades
        db.query = jest.fn()
            .mockImplementationOnce((sql, params, callback) => {
                callback(null, [{ id_usuari: 1 }]); // Si l'immoble pertany a l'usuari autenticat
            })
            .mockImplementationOnce((sql, params, callback) => {
                if (params[0] === id_immoble_valid) {
                    callback(null); // Simulem que l'immoble s'ha eliminat amb èxit
                } else {
                    callback({ status: 404, message: 'No s\'ha trobat l\'immoble' }); // Si s'intenta eliminar un immoble diferent, retorna un error 404
                }
            });

        const response = await request(app)
            .delete(`/immobles/r/eliminar/${id_immoble_valid}`)

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ message: 'Inmueble eliminado con éxito' });
    });
});

// Proves actualitzar dades immoble (R)
describe('Endpoint /immobles/r/actualitzar/:id_immoble', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    const mockRequestBody = {
        Carrer: 'Carrer actualitzat',
        Numero: '20',
        Pis: '1r',
        Codi_Postal: '08001',
        Poblacio: 'Barcelona',
        Descripcio: 'Pis actualitzat',
        Preu: 150000,
        Imatge: 'imatge_actualitzada.jpg'
    };

    it('Hauria de poder actualitzar un immoble amb dades vàlides', async () => {
        const mockIdImmoble = 1; // ID de l'immoble a actualitzar
        const mockUserId = 12; // ID de l'usuari mock
        
        const { req, res, next } = crearObjectesMock();
        req.usuario = { id_usuari: mockUserId }; // Assignem l'ID d'usuari mock al req

        db.query.mockImplementation((query, values, callback) => {
            if (query === 'SELECT * FROM immobles WHERE id_immoble = ? AND id_usuari = ?') {
                // Simulem que l'immoble pertany a l'usuari autenticat
                callback(null, [{ id_usuari: mockUserId }]);
            } else if (query === 'UPDATE immobles SET Carrer = ?, Numero = ?, Pis = ?, Codi_Postal = ?, Poblacio = ?, Descripcio = ?, Preu = ?, Imatge = ? WHERE id_immoble = ?') {
                // Simulem l'èxit de l'actualització
                callback(null, { affectedRows: 1 });
            }
        });

        // Realitzem la sol·licitud HTTP a l'endpoint d'actualització
        const response = await request(app)
            .put(`/immobles/r/actualitzar/${mockIdImmoble}`)
            .send(mockRequestBody);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ message: 'Inmueble actualizado con éxito' });
    });

    it('Hauria de retornar un error 400 si falten dades en la sol·licitud', async () => {
        const mockIdImmoble = 1; // ID de l'immoble a actualitzar
        const mockUserId = 12; // ID de l'usuari mock
        const mockRequestBody = {
            Carrer: 'Carrer actualitzat',
            Numero: '20',
            // manca la dada CodiPostal
            Poblacio: 'Barcelona',
            Preu: 150000,
            Imatge: 'imatge_actualitzada.jpg'
        };

        // Creem els objectes req, res i next
        const { req, res, next } = crearObjectesMock();
        req.usuario = { id_usuari: mockUserId }; // Assignem l'ID d'usuari mock al req

        // Realitzem la sol·licitud HTTP a l'endpoint d'actualització
        const response = await request(app)
            .put(`/immobles/r/actualitzar/${mockIdImmoble}`)
            .send(mockRequestBody);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Faltan datos' });
    });

    it('Hauria de retornar un error 500 si hi ha un error en la consulta a la base de dades', async () => {
        const mockIdImmoble = 1; // ID de l'immoble a actualitzar
        const mockUserId = 12; // ID de l'usuari mock


        const { req, res, next } = crearObjectesMock();
        req.usuario = { id_usuari: mockUserId };

        // Mock de la funció de consulta de la base de dades
        db.query.mockImplementation((query, values, callback) => {
            if (query === 'SELECT * FROM immobles WHERE id_immoble = ? AND id_usuari = ?') {
                // Simulem que l'immoble pertany a l'usuari autenticat
                callback(null, [{ id_usuari: mockUserId }]);
            } else if (query === 'UPDATE immobles SET Carrer = ?, Numero = ?, Pis = ?, Codi_Postal = ?, Poblacio = ?, Descripcio = ?, Preu = ?, Imatge = ? WHERE id_immoble = ?') {
                // Simulem un error en l'actualització
                callback(new Error('Error en la consulta UPDATE'), null);
            }
        });

        // Realitzem la sol·licitud HTTP a l'endpoint d'actualització
        const response = await request(app)
            .put(`/immobles/r/actualitzar/${mockIdImmoble}`)
            .send(mockRequestBody);

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Error del servidor' });
    });

    it('Hauria de retornar un error 404 si no es troba cap immoble amb la ID proporcionada', async () => {
        const mockIdImmoble = 999; // ID de l'immoble a actualitzar (que no existeix)
        const mockUserId = 12; // ID de l'usuari mock

        // Creem els objectes req, res i next
        const { req, res, next } = crearObjectesMock();
        req.usuario = { id_usuari: mockUserId };

        // Mock de la consulta de la base de dades sese trobar cap immoble
        db.query.mockImplementation((query, values, callback) => {
            if (query === 'SELECT * FROM immobles WHERE id_immoble = ? AND id_usuari = ?') {
                callback(null, []);
            }
        });

        // Realitzem la sol·licitud HTTP a l'endpoint d'actualització
        const response = await request(app)
            .put(`/immobles/r/actualitzar/${mockIdImmoble}`)
            .send(mockRequestBody);

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'No se encontraron resultados' });
    });

    it('Hauria de retornar un error 400 si la ID de l\'immoble no és vàlida', async () => {
        const mockIdImmoble = 'immoble_invalid';
        const mockUserId = 12;

        // Creem els objectes req, res i next
        const { req, res, next } = crearObjectesMock();
        req.usuario = { id_usuari: mockUserId }; 

        // Realitzem la sol·licitud HTTP a l'endpoint d'actualització
        const response = await request(app)
            .put(`/immobles/r/actualitzar/${mockIdImmoble}`)
            .send(mockRequestBody);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'La ID del inmueble no es válida' });
    });
});