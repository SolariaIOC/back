const request = require('supertest');
const app = require("./server.js")
const db = require('./database.js');
const immobles = require("./immobles.js");
const { verificaToken, verificarTipusUsuari } = require('./auth');
const validToken = 'token_valid';
const invalidToken = 'token_invalid';
const mockUserId = 1;
const mockEmail = 'usuari@test.com'; 
const mockUsuarioA = { id_usuari: 2, TipusUsuari: 'A' };


jest.mock('./database', () => ({
  query: jest.fn(),
}));

jest.mock('./tokenUtils.js', () => ({
    refrescarToken: jest.fn().mockReturnValue({ accessToken: 'new_access_token', usuario: { id: '1', nombre: 'Usuario' } })
}));

jest.mock('./auth', () => ({
    verificaToken: jest.fn(),
    verificarTipusUsuari: jest.fn((tipusUsuari) => (req, res, next) => next()),
}));


// Proves per afegir un nou immoble amb id_usuari (A)
