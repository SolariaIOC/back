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

  module.exports = { crearObjectesMock };