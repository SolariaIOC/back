const db = require('./database');

// Crear objectes Mocks
const crearObjectesMock = (params) => {
  const req = { params };
  const res = {
    status: jest.fn(() => res),
    json: jest.fn(),
  };
  const next = jest.fn();
  return { req, res, next };
};

// Verifica si un immoble existeix a la bbdd
function verificaExisteixImmoble(id_immoble, callback) {
  const query = 'SELECT COUNT(*) AS count FROM Immobles WHERE id_immoble = ?';
  db.query(query, [id_immoble], (error, result) => {
    if (error) {
      console.error('Error al verificar la existencia del inmueble:', error);
      callback(error, null);
    } else {
      const existeix = result[0].count > 0;
      callback(null, existeix);
    }
  });
}

function paginateResults(req, res, next) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  req.pagination = {
    limit,
    offset,
    currentPage: page // Añadimos el número de la página actual al objeto de paginación
  };

  next();
}

module.exports = { crearObjectesMock, verificaExisteixImmoble, paginateResults };