const express = require('express');
const request = require('supertest');
const favoritsImmobles = require('./favoritsImmobles');
const db = require('./database');
const { verificaToken, verificarTipusUsuari } = require('./auth');
const { crearObjectesMock, verificaExisteixImmoble } = require('./functions');
const mockUsuari = 12;

// Mock per al servidor
jest.mock('./database', () => ({
    query: jest.fn(),
}));

// Mock per als middlewares
jest.mock('./auth', () => ({
    verificaToken: jest.fn().mockImplementation((req, res, next) => {
        // Simulem que el token és vàlid
        req.usuario = { id_usuari: mockUsuari, TipusUsuari: 'R' };
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

// Mock per a la funció verificaExisteixImmoble
jest.mock('./functions', () => ({
    ...jest.requireActual('./functions'),
    verificaExisteixImmoble: jest.fn().mockImplementation((id_immoble, callback) => {
        // Simulem que l'immoble existeix
        callback(null, true);
    }),
}));

// Proves unitàries per favorits
describe('Proves unitàries per immobles favorits:', () => {
    let mockRequest;

    beforeEach(() => {
        // Configuració bàsica de l'objecte mockRequest amb l'ID d'usuari mock i el tipus d'usuari "R"
        mockRequest = {
            body: {
                id_immoble: 1
            },
            usuario: {
                id_usuari: mockUsuari,
                TipusUsuari: 'R'
            }
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('Endpoint /favorits', () => {
        it('Retorna els immobles favorits si hi ha resultats', async () => {
            const mockImmoblesFavorits = [{ id_usuari: mockUsuari, id_immoble: 1 }, { id_usuari: mockUsuari, id_immoble: 2 }];
            db.query.mockImplementationOnce((query, params, callback) => {
                callback(null, mockImmoblesFavorits);
            });

            const response = await request(favoritsImmobles)
                .get('/favorits')
                .set('Authorization', `Bearer token`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockImmoblesFavorits);
            expect(db.query).toHaveBeenCalledWith(expect.any(String), [mockRequest.usuario.id_usuari], expect.any(Function));
        });

        it('Hauria de redirigir un usuari no autoritzat quan intenta accedir als immobles favorits', async () => {
            const usuariNoR = { id_usuari: mockUsuari, TipusUsuari: 'C' }; // Simulem un usuari no "R"

            const { req, res, next } = crearObjectesMock();
            req.usuario = usuariNoR; // Assignem l'usuari no "R" al req

            // Implementació de la ruta per als immobles favorits
            favoritsImmobles.get('/favorits', verificaToken, verificarTipusUsuari('R'), async (req, res) => {
                res.status(403).json({ error: 'Acceso prohibido' });
            });

            // Executem el middleware de verificarTipusUsuari
            verificarTipusUsuari('R')(req, res, next);

            await new Promise(resolve => setTimeout(resolve)); // Esperem que s'executi la funció asincrònica

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ error: 'Acceso prohibido' });
        });
        it('Retorna un error si no hi ha resultats', async () => {
            db.query.mockImplementationOnce((query, params, callback) => {
                callback(null, []); // Simulem que no hi ha resultats
            });

            const response = await request(favoritsImmobles)
                .get('/favorits')
                .set('Authorization', `Bearer token`);

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ message: "No se encontraron resultados" });
        });

        it('Retorna un error si hi ha un error al servidor', async () => {
            db.query.mockImplementationOnce((query, params, callback) => {
                callback(new Error('Error al consultar la base de datos')); // Simulem un error a la base de dades
            });

            const response = await request(favoritsImmobles)
                .get('/favorits')
                .set('Authorization', `Bearer token`);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: "Error del servidor" });
        });
    });
    describe('Endpoint /afegirImmobleFavorit', () => {
        it('Afegir un immoble a la llista de favorits', async () => {
            // Simulem que l'immoble no està a la llista de favorits
            db.query.mockImplementationOnce((query, params, callback) => {
                callback(null, []);
            });

            // Simulem que s'afegeix l'immoble a la llista de favorits
            db.query.mockImplementationOnce((query, params, callback) => {
                callback(null, { insertId: 1 });
            });

            const response = await request(favoritsImmobles)
                .post('/afegirImmobleFavorit')
                .set('Authorization', `Bearer token`)
                .send({ id_immoble: mockRequest.body.id_immoble });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Inmueble añadido a favoritos con éxito' });
        });

        it('Retorna un error si l\'immoble ja està a la llista de favorits', async () => {
            // Simulem que l'immoble ja està a la llista de favorits
            db.query.mockImplementationOnce((query, params, callback) => {
                callback(null, [{ id_usuari: mockUsuari, id_immoble: 1 }]);
            });

            const response = await request(favoritsImmobles)
                .post('/afegirImmobleFavorit')
                .set('Authorization', `Bearer token`)
                .send({ id_immoble: mockRequest.body.id_immoble });

            expect(response.status).toBe(409);
            expect(response.body).toEqual({ error: 'El inmueble ya está en la lista de favoritos' });
        });

        it('Retorna un error si l\'ID de l\'immoble no és vàlid', async () => {
            const response = await request(favoritsImmobles)
                .post('/afegirImmobleFavorit')
                .set('Authorization', `Bearer token`)
                .send({ id_immoble: 'abc' }); // Enviem un ID no vàlid

            expect(response.status).toBe(400);
            expect(response.body).toEqual({ error: 'El ID del inmueble no es válido' });
        });

        it('Retorna un error si hi ha un error al servidor', async () => {
            // Simulem un error al servidor
            db.query.mockImplementationOnce((query, params, callback) => {
                callback(new Error('Error de servidor'));
            });

            const response = await request(favoritsImmobles)
                .post('/afegirImmobleFavorit')
                .set('Authorization', `Bearer token`)
                .send({ id_immoble: mockRequest.body.id_immoble });

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'Error del servidor' });
        });
    });
    describe('Endpoint /eliminarImmobleFavorit', () => {
        it('Eliminar un immoble de la llista de favorits', async () => {
            const id_immoble = 1;
            const mockResponse = { message: 'Inmueble eliminado de favoritos con éxito' };
            db.query.mockImplementationOnce((query, params, callback) => {
                callback(null, { affectedRows: 1 }); // Simulem que l'immoble s'ha eliminat correctament
            });

            const response = await request(favoritsImmobles)
                .delete('/eliminarImmobleFavorit')
                .set('Authorization', `Bearer token`)
                .send({ id_immoble });

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockResponse);
            expect(db.query).toHaveBeenCalledWith(expect.any(String), [mockRequest.usuario.id_usuari, id_immoble], expect.any(Function));
        });

        it('Retorna un error si l\'immoble no està a la llista de favorits', async () => {
            const id_immoble = 1;
            db.query.mockImplementationOnce((query, params, callback) => {
                callback(null, { affectedRows: 0 }); // Simulem que l'immoble no està a la llista de favorits
            });

            const response = await request(favoritsImmobles)
                .delete('/eliminarImmobleFavorit')
                .set('Authorization', `Bearer token`)
                .send({ id_immoble });

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ error: 'El inmueble no está en la lista de favoritos del usuario' });
            expect(db.query).toHaveBeenCalledWith(expect.any(String), [mockRequest.usuario.id_usuari, id_immoble], expect.any(Function));
        });

        it('Retorna un error si l\'ID de l\'immoble no és vàlid', async () => {
            const response = await request(favoritsImmobles)
                .delete('/eliminarImmobleFavorit')
                .set('Authorization', `Bearer token`)
                .send({ id_immoble: 'abc' }); // Enviem un ID no vàlid

            expect(response.status).toBe(400);
            expect(response.body).toEqual({ error: 'El ID del inmueble no es válido' });
        });

        it('Retorna un error si hi ha un error al servidor', async () => {
            const id_immoble = 1;
            db.query.mockImplementationOnce((query, params, callback) => {
                callback(new Error('Error al consultar la base de datos')); // Simulem un error a la base de dades
            });

            const response = await request(favoritsImmobles)
                .delete('/eliminarImmobleFavorit')
                .set('Authorization', `Bearer token`)
                .send({ id_immoble });

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'Error del servidor' });
            expect(db.query).toHaveBeenCalledWith(expect.any(String), [mockRequest.usuario.id_usuari, id_immoble], expect.any(Function));
        });
    });
});
