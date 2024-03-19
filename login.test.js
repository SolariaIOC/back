const request = require('supertest');
const app = require("./server")
const login = require('./login.js');
const db = require('./database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

jest.mock('./database', () => {
    return {
        query: jest.fn(),
    };
});

const mockUser = {
    Email: 'test@example.com',
    Contrasenya: '$2b$10$H8v9MkiyQFtM07IiZvxzfuUZdKdqwT/8nBnwVBqZkYixF7rA9nl8G'
};

bcrypt.compare = jest.fn().mockReturnValue(true);
jwt.sign = jest.fn().mockReturnValue('mockedToken');

describe('Test del endpoint Login', () => {
    test('Login valido y devuelve token', async () => {
        db.query.mockImplementationOnce((query, values, callback) => {
            callback(null, [mockUser]);
        });
        const response = await request(app)
            .post('/login')
            .send({ Email: 'test@example.com', Contrasenya: 'password' });
        expect(response.statusCode).toBe(200);
        expect(response.body.token).toBe('mockedToken');
    });

    test('Credenciales incorrectas', async () => {
        db.query.mockImplementationOnce((query, values, callback) => {
            callback(null, []);
        });
        const response = await request(app)
            .post('/login')
            .send({ Email: 'test@example.com', Contrasenya: 'wrongpassword' });
        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe('Credenciales incorrectas');
    });

    test('Error en la base de datos', async () => {
        db.query.mockImplementationOnce((query, values, callback) => {
            callback(new Error('Error en la base de datos'));
        });
        const response = await request(app)
            .post('/login')
            .send({ Email: 'test@example.com', Contrasenya: 'password' });
        expect(response.statusCode).toBe(500);
        expect(response.body.error).toBe('Error en el servidor');
    });
});
