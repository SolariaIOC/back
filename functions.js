const db = require('./database');

/**
 * Crea objectes mocks per a les proves.
 * @param {object} params - Paràmetres per crear els objectes de petició.
 * @returns {object} - Retorna els objectes de petició, resposta i el següent middleware.
 */
const crearObjectesMock = (params) => {
  const req = { params };
  const res = {
    status: jest.fn(() => res),
    json: jest.fn(),
  };
  const next = jest.fn();
  return { req, res, next };
};

/**
 * Verifica si un immoble existeix a la base de dades.
 * @param {number} id_immoble - ID de l'immoble a verificar.
 * @param {function} callback - Funció de retorn de trucada.
 * @returns {void}
 */
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

/**
 * Middleware per a la paginació de resultats.
 * @param {object} req - Objecte de sol·licitud.
 * @param {object} res - Objecte de resposta.
 * @param {function} next - Funció de següent middleware.
 * @returns {void}
 */
function paginateResults(req, res, next) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 9;
  const offset = (page - 1) * limit;

  req.pagination = {
    limit,
    offset,
    currentPage: page // Añadimos el número de la página actual al objeto de paginación
  };

  next();
}

module.exports = { crearObjectesMock, verificaExisteixImmoble, paginateResults };
