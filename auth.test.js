const jwt = require('jsonwebtoken');
const { verificaToken, verificarTipusUsuari } = require('./auth');

// Mock de tokenUtils.js
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


// Mock de process.env.JWT_SECRET
process.env.JWT_SECRET = 'jwt_key_secreta';

// Mock de process.env.REDIRECT_URL
process.env.REDIRECT_URL = 'http://prova.com';


// Proves funció VerificaToken
describe('Middleware verificaToken', () => {
    // Prueba para verificar si se proporciona un token válido
    it('debería pasar si se proporciona un token válido', async () => {
        const token = jwt.sign({ usuario: { id: 1, nombre: 'Usuario' } }, process.env.JWT_SECRET);
        const req = { cookies: { token } };
        const res = {};
        const next = jest.fn();

        await verificaToken(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    // Prueba para verificar si no se proporciona ningún token
    it('debería retornar un error 401 si no se proporciona ningún token', async () => {
        const req = { cookies: {} };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const next = jest.fn();

        await verificaToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Token no proporcionat' });
    });

    // Prueba para verificar si se proporciona un token de refresco inválido
    it('debería retornar un error 302 si se proporciona un token de refresco inválido', async () => {
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
  // Prova per verificar si el tipus d'usuari coincideix
  it('hauria de permetre l\'accés si el tipus d\'usuari coincideix', () => {
      const req = { usuario: { id: 1, nombre: 'Usuari', TipusUsuari: 'A' } };
      const res = {};
      const next = jest.fn();

      const middleware = verificarTipusUsuari('A');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
  });

  // Prova per verificar si no es proporciona cap usuari
  it('hauria de retornar un error 401 si no es proporciona cap usuari', () => {
      const req = {};
      const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
      };
      const next = jest.fn();

      const middleware = verificarTipusUsuari('A');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Acceso prohibido' });
  });

  // Prova per verificar si el tipus d'usuari no coincideix
  it('hauria de retornar un error 401 si el tipus d\'usuari no coincideix', () => {
      const req = { usuario: { id: 1, nombre: 'Usuari', TipusUsuari: 'R' } };
      const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
      };
      const next = jest.fn();

      const middleware = verificarTipusUsuari('A');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Acceso prohibido' });
  });
});
