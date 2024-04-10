const request = require('supertest');
const app = require('./immobles');
const db = require('./database');
const { verificaToken, verificarTipusUsuari } = require('./auth');
const { crearObjectesMock } = require('./functions');

// Mock per a la consulta de la base de dades
jest.mock('./database', () => ({
  query: jest.fn(),
}));

// Mock per al middleware de verificació de token
jest.mock('./auth', () => ({
  verificaToken: jest.fn().mockImplementation((req, res, next) => {
    // Simulem que el token és vàlid
    req.usuario = { id_usuari: 11, TipusUsuari: 'A' };
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


// Proves per llistar immobles d'un usuari per el seu email (A)
describe('GET /immobles/a/llistaImmobles/:Email', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('hauria de retornar una llista d\'immobles per un id d\'usuari vàlid', async () => {
    // Mock de l'email de l'usuari i de l'id_usuari corresponent al correu
    const emailUsuari = 'usuari@prova.com';
    const id_usuari = 1;

    // Mock de la consulta SELECT per obtenir els immobles de l'usuari
    const mockResultatConsulta = [
      { id_immoble: 1, id_usuari: 1, Carrer: 'Carrer 1', Numero: '1', Poblacio: 'Barcelona' },
      { id_immoble: 2, id_usuari: 1, Carrer: 'Carrer 2', Numero: '2', Poblacio: 'Madrid' },
      { id_immoble: 3, id_usuari: 1, Carrer: 'Carrer 3', Numero: '3', Poblacio: 'Sevilla' },
    ];

    // Mock dels objectes req, res i next utilitzant la funció d'ajuda
    const { req, res, next } = crearObjectesMock({ id_usuari, emailUsuari });

    db.query.mockImplementationOnce((query, values, callback) => {
      // Simulem l'èxit de la consulta SELECT
      callback(null, mockResultatConsulta);
    });

    // Realitzem la sol·licitud GET amb l'email de l'usuari
    const response = await request(app)
      .get(`/immobles/a/llistaImmobles/${emailUsuari}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockResultatConsulta);
    
    // Verifiquem que tots els immobles de la resposta tenen el mateix id_usuari
    response.body.forEach((immoble) => {
      expect(immoble.id_usuari).toBe(id_usuari);
    });
});


  it('hauria de retornar un error 404 si l\'usuari no té immobles associats', async () => {
    // Mock de l'email de l'usuari
    const emailUsuari = 'usuari@example.com';

    // Mock de la consulta SELECT on l'usuari no te immobles associats
    db.query.mockImplementationOnce((query, values, callback) => {
      callback(null, []);
    });

    // Realitzem la sol·licitud GET amb l'email de l'usuari
    const response = await request(app)
      .get(`/immobles/a/llistaImmobles/${emailUsuari}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'No se encontraron resultados' });
  });

  it('hauria de retornar un error 500 si hi ha un error en la consulta SELECT', async () => {
    const emailUsuari = 'usuari@example.com';

    // Mock de error a la consulta SELECT per obtenir els immobles de l'usuari
    db.query.mockImplementationOnce((query, values, callback) => {
      callback(new Error('Error en la consulta SELECT'));
    });

    // Realitzem la sol·licitud GET amb l'email de l'usuari
    const response = await request(app)
      .get(`/immobles/a/llistaImmobles/${emailUsuari}`);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Error del servidor' });
  });

  it('hauria de retornar un error 403 si l\'usuari no és de tipus A', async () => {
    // Simulem un usuari que no és de tipus 'A'
    const usuariNoAdmin = { id_usuari: 2, TipusUsuari: 'B' };

    // Creem objectes simulats per req, res, i next
    const req = { params: { Email: 'usuari@example.com' } };
    const res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    };
    const next = jest.fn();

    // Mock per al middleware de verificació de tipus d'usuari
    verificarTipusUsuari('A')(req, res, next);

    // Esperem que no s'hagi cridat la funció next
    expect(next).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Acceso prohibido' });
  });
});


// Proves afegir un immoble a un usuari (A)
describe('POST /immobles/a/afegirUsuariImmoble', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Esborrem els mocks abans de cada prova
  });

  it('hauria d\'afegir un nou immoble amb dades vàlides', async () => {
    // Dades de l'immoble a enviar a la sol·licitud POST
    const immoble = {
      id_usuari: 1,
      Carrer: 'Carrer 4',
      Numero: '40',
      Pis: '4t',
      Codi_Postal: '08003',
      Poblacio: 'Barcelona',
      Descripcio: 'Pis amb terrassa',
      Preu: 200000,
      Imatge: 'imatge4.jpg',
    };

    // Mock per a la consulta d'inserció a la base de dades
    db.query.mockImplementationOnce((query, values, callback) => {
      // Simulem l'èxit de la inserció
      callback(null, { insertId: 1 });
    });

    // Realitzem la sol·licitud POST amb les dades de l'immoble
    const response = await request(app)
      .post('/immobles/a/afegirUsuariImmoble')
      .send(immoble);

    // Esperem que la resposta sigui 201 (Created) i contingui el missatge d'èxit esperat
    expect(response.status).toBe(201);
    expect(response.body).toEqual({ message: 'Nuevo inmueble añadido con éxito' });
  });

  it('hauria de retornar un error 400 si falten dades', async () => {
    // Dades de l'immoble amb dades mancants
    const immoble = {
      //Manca dada id_usuari
      Carrer: 'Carrer 4',
      Numero: '40',
      Pis: '4t',
      Codi_Postal: '08003',
      Poblacio: 'Barcelona',
      //Manca descripció tot i que no és obligatòria
      Preu: 200000,
      Imatge: 'imatge4.jpg',
    };

    // Realitzem la sol·licitud POST amb les dades de l'immoble
    const response = await request(app)
      .post('/immobles/a/afegirUsuariImmoble')
      .send(immoble);

    // Esperem que la resposta sigui un error 400
    expect(response.status).toBe(400);
  });

  it('hauria de retornar un error 500 si hi ha un error en la inserció a la base de dades', async () => {
    // Dades de l'immoble a enviar a la sol·licitud POST
    const immoble = {
      id_usuari: 1,
      Carrer: 'Carrer 4',
      Numero: '40',
      Pis: '4t',
      Codi_Postal: '08003',
      Poblacio: 'Barcelona',
      Descripcio: 'Pis amb terrassa',
      Preu: 200000,
      Imatge: 'imatge4.jpg',
    };

    // Mock per a la consulta d'inserció a la base de dades amb error
    db.query.mockImplementationOnce((query, values, callback) => {
      callback(new Error('Error en la inserció d\'immoble'));
    });

    // Realitzem la sol·licitud POST amb les dades de l'immoble
    const response = await request(app)
      .post('/immobles/a/afegirUsuariImmoble')
      .send(immoble);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Error del servidor' });
  });

  it('hauria de retornar un error 403 si l\'usuari no és de tipus A', async () => {
    // mock usuari que no és de tipus 'A'
    const usuariNoAdmin = { id_usuari: 2, TipusUsuari: 'B' };
    const req = { body: { id_usuari: usuariNoAdmin.id_usuari } };
    const res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    };
    const next = jest.fn();

    // Mock per al middleware de verificació de tipus d'usuari
    verificarTipusUsuari('A')(req, res, next);

    // Esperem que no s'hagi cridat la funció next
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Acceso prohibido' });
  });

});


// Proves per eliminar un immoble d'un usuari A
describe('DELETE /immobles/a/eliminarImmoble/:id_immoble/:id_usuari', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Esborrem els mocks abans de cada prova
  });

  it('hauria de eliminar un immoble existent', async () => {
    // Mock de les dades de la sol·licitud
    const id_immoble = 1;
    const id_usuari = 1;

    // Mock de la consulta SELECT per trobar l'immoble
    db.query.mockImplementationOnce((query, values, callback) => {
      callback(null, [{ id_immoble, id_usuari }]);
    });

    // Mock de la consulta DELETE per eliminar l'immoble
    db.query.mockImplementationOnce((query, values, callback) => {
      // Simulem l'èxit de l'eliminació
      callback(null);
    });

    const response = await request(app)
      .delete(`/immobles/a/eliminarImmoble/${id_immoble}/${id_usuari}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Inmueble eliminado con éxito' });
  });

  it('hauria de retornar un error 404 si l\'immoble no existeix', async () => {
    // Mock de les dades de la sol·licitud
    const id_immoble = 1;
    const id_usuari = 1;

    // Mock de la consulta SELECT per trobar l'immoble (sense resultats)
    db.query.mockImplementationOnce((query, values, callback) => {
      callback(null, []);
    });

    const response = await request(app)
      .delete(`/immobles/a/eliminarImmoble/${id_immoble}/${id_usuari}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'No se encontraron resultados' });
  });

  it('hauria de retornar un error 500 si hi ha un error en la consulta SELECT', async () => {
    // Mock de les dades de la sol·licitud
    const id_immoble = 1;
    const id_usuari = 1;

    // Mock de la consulta SELECT per trobar l'immoble (error)
    db.query.mockImplementationOnce((query, values, callback) => {
      callback(new Error('Error en la consulta SELECT'));
    });

    const response = await request(app)
      .delete(`/immobles/a/eliminarImmoble/${id_immoble}/${id_usuari}`);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Error del servidor' });
  });

  it('hauria de retornar un error 500 si hi ha un error en la consulta DELETE', async () => {
    // Mock de les dades de la sol·licitud
    const id_immoble = 1;
    const id_usuari = 1;

    // Mock de la consulta SELECT per trobar l'immoble
    db.query.mockImplementationOnce((query, values, callback) => {
      callback(null, [{ id_immoble, id_usuari }]);
    });

    // Mock de la consulta DELETE per eliminar l'immoble (error)
    db.query.mockImplementationOnce((query, values, callback) => {
      // Simulem un error en la consulta
      callback(new Error('Error en la consulta DELETE'));
    });

    const response = await request(app)
      .delete(`/immobles/a/eliminarImmoble/${id_immoble}/${id_usuari}`);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Error del servidor' });
  });

  it('hauria de retornar un error 403 si l\'usuari no és de tipus A', async () => {
    // Simulem un usuari que no és de tipus 'A'
    const usuariNoAdmin = { id_usuari: 2, TipusUsuari: 'B' };

    // Creem objectes simulats per req, res, i next
    const req = { params: { id_immoble: 1, id_usuari: 2 } }; // Id_immoble no importa en aquesta prova
    const res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    };
    const next = jest.fn();

    // Mock per al middleware de verificació de tipus d'usuari
    verificarTipusUsuari('A')(req, res, next);

    // Esperem que no s'hagi cridat la funció next
    expect(next).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Acceso prohibido' });
  });
});



