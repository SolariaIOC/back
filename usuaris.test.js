const request = require('supertest');
const app = require("./server.js")
const login = require('./login.js');
const db = require('./database.js');

jest.mock('./database', () => {
    return {
        query: jest.fn(),
    };
});


describe('Test del endpoint /app', () => {
    it('Obtiene correctamente los usuarios', async () => {
        const mockResults = [{ id: 1, name: 'Marcos', cognoms: "Lopez" }, { id: 2, name: 'Jose', cognoms: "Perez" }];
        db.query.mockImplementationOnce((query, callback) => {
            callback(null, mockResults);
        });
        const response = await request(app).get('/app');
        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockResults);
    });
    it('Error en la base de datos', async () => {
        db.query.mockImplementationOnce((query, callback) => {
            callback(new Error('Error de base de datos'));
        });
        const response = await request(app).get('/app');
        expect(response.status).toBe(500);
        expect(response.text).toBe('Error');
    });
});

describe('Test del endpoint /app/:id', () => {
    it('Encuentra al usuario', async () => {
        const mockUser = { id_usuari: 1, name: 'Marcos' };
        db.query.mockImplementationOnce((query, values, callback) => {
            callback(null, [mockUser]);
        });
        const response = await request(app).get('/app/1');
        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockUser);
    });

    it('No lo encuentra debido a una id inexistente', async () => {
        db.query.mockImplementationOnce((query, values, callback) => {
            callback(null, []);
        });
        const response = await request(app).get('/app/999');
        expect(response.status).toBe(404);
        expect(response.text).toBe('Not found');
    });

    it('Error en consulta a la base de datos', async () => {
        db.query.mockImplementationOnce((query, values, callback) => {
            callback(new Error('Error de base de datos'));
        });
        const response = await request(app).get('/app/1');
        expect(response.status).toBe(500);
        expect(response.text).toBe('Server Error');
    });
});

describe('Test del endpoint /app/registre', () => {
    it('Crear un nuevo usuario', async () => {
        const mockRequestBody = {
            Email: 'test@example.com',
            Nom: 'Test',
            Cognoms: 'Usuario',
            Contrasenya: 'password',
            TipusUsuari: 'u',
        };
        db.query.mockImplementationOnce((query, values, callback) => {
            callback(null, []);
        });
        db.query.mockImplementationOnce((query, values, callback) => {
            callback(null, { insertId: 1 });
        });
        const response = await request(app)
            .post('/app/registre')
            .send(mockRequestBody);
        expect(response.status).toBe(200);
        expect(response.text).toBe('Usuario creado con éxito');
    });

    it('Usuario ya existe', async () => {
        const mockRequestBody = {
            Email: 'test@example.com',
            Nom: 'Test',
            Cognoms: 'Usuario',
            Contrasenya: 'password',
            TipusUsuari: 'u',
        };
        db.query.mockImplementationOnce((query, values, callback) => {
            callback(null, [{ id_usuari: 1 }]);
        });
        const response = await request(app)
            .post('/app/registre')
            .send(mockRequestBody);
        expect(response.status).toBe(400);
        expect(response.text).toBe('El usuario ya existe');
    });

    it('Error en base de datos', async () => {
        const mockRequestBody = {
            Email: 'test@example.com',
            Nom: 'Test',
            Cognoms: 'Usuario',
            Contrasenya: 'password',
            TipusUsuari: 'u',
        };
        db.query.mockImplementationOnce((query, values, callback) => {
            callback(null, []);
        });
        db.query.mockImplementationOnce((query, values, callback) => {
            callback(new Error('Error al insertar usuario en la base de datos'));
        });
        const response = await request(app)
            .post('/app/registre')
            .send(mockRequestBody);
        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Error creando la tabla' });
    });
});


