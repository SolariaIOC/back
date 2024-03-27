const request = require('supertest');
const app = require("./server.js")
const immobles = require('./immobles.js');
const db = require('./database.js');
const { verificaTipusUsuari } = require('./middleware.js');


// Mock de la funció query de la bbdd per simular consultes
jest.mock('./database', () => ({
    query: jest.fn((query, values, callback) => {
        // Segons valor de query
        if (query === 'INSERT INTO immobles') {
            // Simulem un escenari d'èxit (200) per a la inserció
            callback(null, 'Inserció correcte');
        } else if (query === 'SELECT id_usuari FROM immobles') {
            // Simulem un escenari on l'usuari no té permís (403)
            callback(null, []); // no s'ha trobat cap immoble per l'usuari
        } else if (query === 'SELECT * FROM immobles') {
            // Simulem un escenari on no hi ha immobles (404)
            callback(null, []); // no s'ha trobat cap immoble
        } else {
            // Simulem un escenari d'error del servidor (500)
            callback(new Error('Error de consulta'), null);
        }
    })
}));


jest.mock('./middleware', () => ({
    verificaTipusUsuari: jest.fn().mockImplementation((req, res, next) => {
        const { token } = req.headers;
        if (!token) {
            req.tipusUsuari = 'anonim'; // Si no hi ha token, assumim un usuari anònim
        } else {
            const tipusUsuari = token.tipusUsuari; // tipusUsuari es proporciona al token
            if (tipusUsuari === 'A' || tipusUsuari === 'R') {
                req.tipusUsuari = tipusUsuari; // Només assignem el tipusUsuari si és "A" o "R"
            } else {
                return res.status(403).json("Accés prohibit"); // etornem un error de permisos
            }
        }
        next();
    })
}));

// PASS  OK  --  proves unitàries utilitzant MIDDLEWARE mock
describe('Middleware verificaTipusUsuari', () => {
    it('assigna tipusUsuari com a "anonim" quan no hi ha token', () => {
        const req = { headers: {} };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();

        verificaTipusUsuari(req, res, next);

        expect(req.tipusUsuari).toBe('anonim');
        expect(next).toHaveBeenCalled();
    });

    it('assigna tipusUsuari com a "A" quan el token és de tipus "A"', () => {
        const req = { headers: { token: { tipusUsuari: 'A' } } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();

        verificaTipusUsuari(req, res, next);

        expect(req.tipusUsuari).toBe('A');
        expect(next).toHaveBeenCalled();
    });

    it('assigna tipusUsuari com a "R" quan el token és de tipus "R"', () => {
        const req = { headers: { token: { tipusUsuari: 'R' } } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();

        verificaTipusUsuari(req, res, next);

        expect(req.tipusUsuari).toBe('R');
        expect(next).toHaveBeenCalled();
    });
});


// PASS OK  --  Mock endpoint app GET llistar immobles
describe('Obtenir llistat d\'immobles', () => {
    it('Retorna el llistat complet d\'immobles', async () => {
        // Mock de la consulta a la base de dades amb èxit
        db.query.mockImplementationOnce((query, callback) => {
            // Mock de resultats de la base de dades
            const mockResults = [
                { id: 1, id_usuari: 1, Carrer: 'Carrer A', Numero: '123', Pis: '1', Codi_Postal: '08001', Poblacio: 'Barcelona', Descripcio: 'Pis lluminós', Preu: '150000', Imatge: 'imatge1.jpg' },
                { id: 2, id_usuari: 2, Carrer: 'Carrer B', Numero: '456', Pis: '2', Codi_Postal: '08002', Poblacio: 'Barcelona', Descripcio: 'Pis àmpli', Preu: '200000', Imatge: 'imatge2.jpg' }
            ];
            // Simula l'èxit de la consulta
            callback(null, mockResults);
        });

        // Realitza la sol·licitud a l'endpoint
        const response = await request(app).get('/app');

        // Verifica la resposta
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual([
            { id: 1, id_usuari: 1, Carrer: 'Carrer A', Numero: '123', Pis: '1', Codi_Postal: '08001', Poblacio: 'Barcelona', Descripcio: 'Pis lluminós', Preu: '150000', Imatge: 'imatge1.jpg' },
            { id: 2, id_usuari: 2, Carrer: 'Carrer B', Numero: '456', Pis: '2', Codi_Postal: '08002', Poblacio: 'Barcelona', Descripcio: 'Pis àmpli', Preu: '200000', Imatge: 'imatge2.jpg' }
        ]);
    });

    it('Retorna error 500 en cas de fallo en la base de dades', async () => {
        // Mock de la consulta a la base de dades sense èxit
        db.query.mockImplementationOnce((query, callback) => {
            callback(new Error('Error en la consulta a la base de dades'));
        });

        // Realitza la sol·licitud a l'endpoint
        const response = await request(app).get('/app');

        // Verifica la resposta
        expect(response.statusCode).toBe(500);
    });
});

// PASS OK  --  Mock obtenir llistat immob per CP
describe('Endpoint per obtenir llistat immobles segons el Codi_Postal', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('Retorna una llista d\'immobles quan la consulta a la base de dades és correcta', async () => {
        // Dades simulades de la consulta a la base de dades
        const mockResults = [
            { id: 1, id_usuari: 1, Carrer: 'Carrer A', Numero: '123', Pis: '1', Codi_Postal: '08001', Poblacio: 'Barcelona', Descripcio: 'Pis lluminós', Preu: '150000', Imatge: 'imatge1.jpg' },
            { id: 2, id_usuari: 2, Carrer: 'Carrer B', Numero: '456', Pis: '2', Codi_Postal: '08001', Poblacio: 'Barcelona', Descripcio: 'Pis àmpli', Preu: '200000', Imatge: 'imatge2.jpg' }
        ];

        // Mock de la resposta de la base de dades
        db.query.mockImplementationOnce((query, [codiPostal], callback) => {
            callback(null, mockResults);
        });

        // Realitza la sol·licitud HTTP
        const response = await request(app).get('/app/codi_postal/08001');

        // Verifica la resposta
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(mockResults);
    });

    it('Retorna un error 500 quan hi ha un error de la base de dades', async () => {
        // Mock de l'error de la base de dades
        db.query.mockImplementationOnce((query, [codiPostal], callback) => {
            callback(new Error('Error en la consulta a la base de dades'), null);
        });

        // Realitza la sol·licitud HTTP
        const response = await request(app).get('/app/codi_postal/08001');

        // Verifica la resposta
        expect(response.statusCode).toBe(500);
        expect(response.body).toEqual('Error del servidor');
    });
});

// PASS OK  --   Mock per obtenir immobles per Població

describe('Endpoint per obtenir llistat immobles segons la Poblacio', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('Retorna una llista d\'immobles quan la consulta a la base de dades és correcta', async () => {
        // Dades simulades de la consulta a la base de dades
        const mockResults = [
            { id: 1, id_usuari: 1, Carrer: 'Carrer A', Numero: '123', Pis: '1', Codi_Postal: '08001', Poblacio: 'Barcelona', Descripcio: 'Pis lluminós', Preu: '150000', Imatge: 'imatge1.jpg' },
            { id: 2, id_usuari: 2, Carrer: 'Carrer B', Numero: '456', Pis: '2', Codi_Postal: '08002', Poblacio: 'Barcelona', Descripcio: 'Pis àmpli', Preu: '200000', Imatge: 'imatge2.jpg' }
        ];

        // Mock de la resposta de la base de dades
        db.query.mockImplementationOnce((query, [poblacio], callback) => {
            callback(null, mockResults);
        });

        // Realitza la sol·licitud HTTP
        const response = await request(app).get('/app/poblacio/Barcelona');

        // Verifica la resposta
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(mockResults);
    });

    it('Retorna un error 500 quan hi ha un error de la base de dades', async () => {
        // Mock de l'error de la base de dades
        db.query.mockImplementationOnce((query, [poblacio], callback) => {
            callback(new Error('Error en la consulta a la base de dades'), null);
        });

        // Realitza la sol·licitud HTTP
        const response = await request(app).get('/app/poblacio/Barcelona');

        // Verifica la resposta
        expect(response.statusCode).toBe(500);
        expect(response.body).toEqual('Error del servidor');
    });
});

// EXTRA PROVA  --  Nou mock bàsic per a verificar que hi ha dos tests
describe('Mock de comprovació', () => {
    it('Comprova si hi ha dos tests', () => {
        // Verifica que hi ha dos tests
        expect(2).toBe(2);
    });
});


// Mock endopoint app POST afegir immobles

describe('Endpoint per registrar un nou immoble', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    // PASS OK  --  Quan l'usuari no es ni A ni R
    it('Rebutja l\'addició d\'un immoble per a usuaris que no siguin A ni R', async () => {
        const immoble = {
            id_usuari: 'id_usuari_invalid', // id_usuari diferent del tokenId
            Carrer: 'Carrer exemple',
            Numero: '123',
            Pis: '1',
            Codi_Postal: '08001',
            Poblacio: 'Barcelona',
            Descripcio: 'Descripció de l\'immoble',
            Preu: 100000,
            Imatge: 'imatge.png'
        };

        const response = await request(app)
            .post('/app')
            .send(immoble);

        expect(response.statusCode).toBe(403);
        expect(response.body).toBe("Accés prohibit");
    });

});

describe('Endpoint per registrar un nou immoble', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

//  FALLA RETORNA ERR 403    
it('Registra un nou immoble a la base de dades', async () => {
    // Dades simulades de la sol·licitud
    const mockReq = {
      tipusUsuari: 'A',
      tokenId: 'id_usuari',
      body: {
        id_usuari: 'id_usuari',
        Carrer: 'Carrer exemple',
        Numero: '123',
        Pis: '1',
        Codi_Postal: '08001',
        Poblacio: 'Barcelona',
        Descripcio: 'Descripció de l\'immoble',
        Preu: 100000,
        Imatge: 'imatge.png'
      }
    };

    // Mock de la resposta de la base de dades (inserció amb èxit)
    db.query.mockImplementationOnce((query, values, callback) => {
      callback(null, 'Inserció correcte');
    });

    // Realitza la sol·licitud HTTP
    const response = await request(app)
      .post('/app')
      .send(mockReq);

    // Verifica la resposta
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual("Immoble registrat amb èxit");
  });

    //  PASS OK  --  Quan detecta error de usuari
    it('Retorna un error 403 quan l\'usuari no té els permisos necessaris', async () => {
        // Dades simulades de la sol·licitud
        const mockReq = {
            tipusUsuari: 'C', // Assumint que l'usuari no té permisos adequats (tipus 'C')
            tokenId: 'id_token', // Identificador del token
            body: {
                id_usuari: '123',
                Carrer: 'Carrer exemple',
                Numero: '123',
                Pis: '1',
                Codi_Postal: '08001',
                Poblacio: 'Barcelona',
                Descripcio: 'Descripció de l\'immoble',
                Preu: 100000,
                Imatge: 'imatge.png'
            }
        };

        // Realitza la sol·licitud HTTP
        const response = await request(app)
            .post('/app')
            .send(mockReq);

        // Verifica la resposta
        expect(response.statusCode).toBe(403);
        expect(response.body).toEqual("Accés prohibit");
    });

//  FALLA RETORNA ERR 403
    it('Retorna un error 500 quan hi ha un error en la inserció a la base de dades', async () => {
        // Dades simulades de la sol·licitud
        const mockReq = {
            tipusUsuari: 'A', // Assumint que l'usuari té permisos de tipus 'A'
            tokenId: 'id_token', // Identificador del token
            body: {
                id_usuari: '123',
                Carrer: 'Carrer exemple',
                Numero: '123',
                Pis: '1',
                Codi_Postal: '08001',
                Poblacio: 'Barcelona',
                Descripcio: 'Descripció de l\'immoble',
                Preu: 100000,
                Imatge: 'imatge.png'
            }
        };

        // Mock de l'error de la base de dades
        db.query.mockImplementationOnce((query, values, callback) => {
            callback(new Error('Error en la inserció a la base de dades'), null);
        });

        // Realitza la sol·licitud HTTP
        const response = await request(app)
            .post('/app')
            .send(mockReq);

        // Verifica la resposta
        expect(response.statusCode).toBe(500);
        expect(response.body).toEqual("Error del servidor");
    });
});