const jwt = require('jsonwebtoken');
const { verificaToken, verificarTipusUsuari } = require('./auth');

jest.mock('./tokenUtils.js', () => {
    return {
        refrescarToken: jest.fn().mockImplementationOnce(refreshToken => {
            if (refreshToken === 'invalid_refresh_token') {
                return { error: 'Token de refresco inválido' };
            }
            return { accessToken: 'new_access_token', usuario: { id: 1, nombre: 'Usuario' } };
        })
    };
});

// Mock de process.env.JWT_SECRET  i  process.env.REDIRECT_URL
process.env.JWT_SECRET = 'jwt_key_secreta';
process.env.REDIRECT_URL = 'http://prova.com';


// Proves funció VerificaToken
describe('Middleware verificaToken', () => {
    it('Hauria de passar si es proporciona un token vàlid', async () => {
        const token = jwt.sign({ usuario: { id: 1, nombre: 'Usuario' } }, process.env.JWT_SECRET);
        const req = { cookies: { token } };
        const res = {};
        const next = jest.fn();

        await verificaToken(req, res, next);
        expect(next).toHaveBeenCalled();
    });
    it('hauria de retornar un error 401 si no es proporciona cap token', async () => {
        const req = { cookies: {} };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const next = jest.fn();

        await verificaToken(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Token no proporcionado' });
    });

    it('hauria de retornar un error 302 si és proporciona un token de refresc invàlid', async () => {
        const token = jwt.sign({ usuario: { id: 1, nombre: 'Usuario' } }, process.env.JWT_SECRET);
        const req = { cookies: { token, refreshToken: 'invalid_refresh_token' } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const next = jest.fn();

        await verificaToken(req, res, next);
        expect(res.status).toHaveBeenCalledWith(302);
        expect(res.json).toHaveBeenCalledWith({ redirectTo: process.env.REDIRECT_URL });
    });
});


// Proves funció verificaTipusUsuari
describe('Middleware verificarTipusUsuari', () => {
    it('hauria de permetre l\'accés si el tipus d\'usuari coincideix', () => {
        const req = { usuario: { id: 1, nombre: 'Usuari', TipusUsuari: 'A' } };
        const res = {};
        const next = jest.fn();
        const middleware = verificarTipusUsuari('A');

        middleware(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    it('hauria de retornar un error 403 si no es proporciona cap usuari', () => {
        const req = {};
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const next = jest.fn();
        const middleware = verificarTipusUsuari('A');

        middleware(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: 'Acceso prohibido' });
    });

    it('hauria de retornar un error 403 si el tipus d\'usuari no és A', () => {
        const req = { usuario: { id: 1, nombre: 'Usuari', TipusUsuari: 'B' } };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(),
        };
        const next = jest.fn();
        const middleware = verificarTipusUsuari('A');

        middleware(req, res, next);
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: 'Acceso prohibido' });
    });
});
