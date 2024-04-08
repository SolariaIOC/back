const request = require('supertest');
const app = require("./server.js")
const db = require('./database.js');
const immobles = require("./immobles.js");
const { verificaToken, verificarTipusUsuari } = require('./auth');
const validToken = 'token_valid';
const invalidToken = 'token_invalid';
const mockUserId = 1;


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


// Proves retorna llista per ID usuari (R)
describe('Endpoint /immobles/r', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
  
    it('Hauria de retornar la llista d\'immobles de l\'usuari correctament', async () => {
      const mockImmobles = [
        { id_immoble: 1, id_usuari: 1, Carrer: 'Carrer 1', Numero: '10', Pis: '1r', Codi_Postal: '08001', Poblacio: 'Barcelona', Descripcio: 'Bonic pis al centre de la ciutat', Preu: 120000.00, Imatge: 'imatge1.jpg' },
        { id_immoble: 2, id_usuari: 1, Carrer: 'Carrer 2', Numero: '20', Pis: '2n', Codi_Postal: '08002', Poblacio: 'Barcelona', Descripcio: 'Àtic amb vistes al mar', Preu: 250000.00, Imatge: 'imatge2.jpg' }
      ];
  
      // Simulem el comportament de la consulta a la base de dades
      db.query.mockImplementation((query, values, callback) => {
        if (query === 'SELECT * FROM immobles WHERE id_usuari = ?') {
          callback(null, mockImmobles);
        }
      });
  
      // Simulem el comportament de les funcions de verificació de token
      verificaToken.mockImplementation((req, res, next) => {
        req.usuario = { id_usuari: mockUserId }; // Simulem l'ID d'usuari del token
        next();
      });
      verificarTipusUsuari.mockImplementation((tipusUsuari) => (req, res, next) => next());
  
      // Realitzem la sol·licitud HTTP a l'endpoint
      const response = await request(app).get('/immobles/r');
  
      // Verifiquem que la resposta sigui correcta
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockImmobles);
    });
  
    it('Hauria de retornar un error 500 si hi ha un error en la consulta a la base de dades', async () => {
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
        const mockRequest = {
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
        const mockRequest = {
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
        const mockRequest = {
            body: {
                Carrer: 'Carrer 4',
                Numero: '40',
                Pis: '4t',
                Codi_Postal: '08003',
                Poblacio: 'Barcelona',
                Preu: 200000,
                Imatge: 'imatge4.jpg'
            },
            usuario: {
                id_usuari: mockUserId // Utilitzem l'ID d'usuari mock
            }
        };

        const response = await request(app)
            .post('/immobles/r/afegir')
            .send(mockRequest.body);

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Error del servidor' });
    });

    it('Hauria de retornar un error 400 si es passen dades invàlides per afegir un immoble', async () => {
        const mockRequest = {
            body: {
                Carrer: 'Carrer 4',
                Numero: '40',
                Pis: '4t',
                Codi_Postal: '08003',
                Poblacio: '',  // Descripció buida, considerada invàlida
                Descripcio: 'Casa moblada i lluminosa', 
                Preu: 200000,
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
        expect(response.body).toEqual({ error: 'Datos inválidos' });
    });

    it('Hauria de retornar un error 403 si l\'usuari no està autoritzat per afegir un immoble', async () => {
        const mockRequest = {
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
                id_usuari: 2,
                TipusUsuari: 'C' // usuari no vàlid
            }
        };

        const response = await request(app)
            .post('/immobles/r/afegir')
            .send(mockRequest.body);

        expect(response.status).toBe(403);
        expect(response.body).toEqual({ error: 'Acceso prohibido' });
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
        const response = await request(app)
            .delete(`/immobles/r/eliminar/${id_immoble_erronia}`)
            .set('Cookie', ['token=mockToken', 'refreshToken=mockRefreshToken']);
    
        expect(response.status).toBe(400); 
        expect(response.body).toEqual({ error: 'La ID del inmueble no és válida' }); 
    });

    it('Hauria de retornar un error 404 si no es troba cap immoble amb la ID proporcionada', async () => {
        // Mock de la funció de consulta de la base de dades
        db.query = jest.fn().mockImplementation((sql, params, callback) => {
            callback(null, []);
        });

        const response = await request(app)
            .delete(`/immobles/r/eliminar/${id_immoble_invalid}`)
            .set('Cookie', ['token=mockToken', 'refreshToken=mockRefreshToken']);
        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'No se encontraron resultados' });
    });

    it('Hauria de retornar un error 403 si l\'usuari no té permisos per eliminar l\'immoble', async () => {
        // Mock de la funció de consulta de la base de dades
        db.query = jest.fn().mockImplementation((sql, params, callback) => {
            callback(null, [{ id_usuari: 2 }]); // Assumint que l'immoble no pertany a l'usuari autenticat
        });

        const response = await request(app)
            .delete(`/immobles/r/eliminar/${id_immoble_valid}`)
            .set('Cookie', ['token=mockToken', 'refreshToken=mockRefreshToken']);
        expect(response.status).toBe(403);
        expect(response.body).toEqual({ error: 'Acceso prohibido' });
    });

    it('Hauria d\'eliminar correctament l\'immoble si tot és correcte', async () => {
        // Mock de la funció de consulta de la base de dades
        db.query = jest.fn()
            .mockImplementationOnce((sql, params, callback) => {
                callback(null, [{ id_usuari: 1 }]); // Assumint que l'immoble pertany a l'usuari autenticat
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
            .set('Cookie', ['token=mockToken', 'refreshToken=mockRefreshToken']);
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ message: 'Inmueble eliminado con éxito' });
    });
    
});










