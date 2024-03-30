//Treballem amb 3 tipus d'usuari
// anónim = (accesible per tothom)
// Registrat = (R) nomes pot accedir a les seves dades
// Administrador = (A) pot accedir a tots els usuaris i immobles

const jwt = require("jsonwebtoken");
const { refrescarToken } = require('./tokenUtils.js')


// Middleware per verificar el token i obtenir l'ID de l'usuari
function verificaToken(req, res, next) {
    const authorizationHeader = req.cookies['token'];
    const refreshToken = req.cookies['refreshToken'];

    try {
        if (!authorizationHeader && !refreshToken) {
            return res.status(401).json({ error: 'Token no proporcionat' });
        }

        // Verifica que s'ha proporcionat el token correctament
        const decodedToken = jwt.verify(authorizationHeader, process.env.JWT_SECRET);
        req.usuario = {
            id_usuari: decodedToken.usuario.id_usuari,
            TipusUsuari: decodedToken.usuario.TipusUsuari
        };

        // Redirigeix l'usuari al seu endpoint corresponent si no s'està intentant accedir ja a l'endpoint adequat
        if (req.method !== 'DELETE') {
            switch (req.usuario.TipusUsuari) {
                case 'R':
                    switch (req.method) {
                        case 'GET':
                            if (req.path !== '/immobles/r') {
                                return res.redirect('/immobles/r');
                            }
                            break;
                        case 'POST':
                            if (req.path !== '/immobles/r/afegir') {
                                return res.redirect('/immobles/r/afegir');
                            }
                            break;
                        case 'DELETE':
                            if (req.path !== '/immobles/r/eliminar') {
                                return res.redirect('/immobles/r/eliminar');
                            }
                            break;
                    }
                    break;
                case 'A':
                    switch (req.method) {
                        case 'GET':
                            if (req.path === '/immobles/a/llistaUsuaris') {
                                return res.redirect('/immobles/a/llistaUsuaris');
                            } else if (req.path === '/immobles/a/llistaUsuaris/:Email') {
                                return res.redirect('/immobles/a/llistaUsuaris/:Email');
                            } else if (req.path === '/immobles/a/llistaImmobles') {
                                return res.redirect('/immobles/a/llistaImmobles');
                            } else if (req.path === '/immobles/a/llistaImmobles/:id_immoble') {
                                return res.redirect('/immobles/a/llistaImmobles/:id_immoble');
                            } else if (req.path === '/immobles/a/llistaImmobles/:Email') {
                                return res.redirect('/immobles/a/llistaImmobles/:Email');
                            }
                            break;
                        case 'POST':
                            console.log("METODE dins CASE POST ", req.method);
                            if (req.path === '/usuaris/app/registre') {
                                return res.redirect('/usuaris/app/registre');
                            } else if (req.path === '/immobles/a/afegirUsuariImmoble') {
                                return res.redirect('/immobles/a/afegirImmoble');
                            }
                            break;
                        case 'DELETE':
                            if (req.path === '/usuaris/app/a/eliminarUsuari/:id_usuari') {
                                return res.redirect('/usuaris/app/a/eliminarUsuari/:id_usuari');
                            } else if (req.path === '/immobles/a/eliminarImmoble/:id_immoble/:id_usuari') {
                                return res.redirect('/immobles/a/eliminarImmoble/:id_immoble/:id_usuari');
                            }
                            break;
                    }
                    break;
                default:
                    return res.status(403).json({ error: 'Acceso prohibido' });
                    break;
            }
            next();
        } else {
            next(); // En cas de petició DELETE
        }

    } catch (error) {
        if (!refreshToken) {
            return res.status(401).send('No hay token de refresco');
        }

        try {
            const { accessToken, usuario, error: refreshError } = refrescarToken(refreshToken);
            if (refreshError) {
                res.status(302).json({ redirectTo: "http://solaria.website" }) // Redirigir a la pàgina de login per obtenir dos nous tokens
            }
            req.usuario = usuario;
            res
                .cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'strict', maxAge: 60 * 1000 }) // 60 segons
                .cookie('token', accessToken, { httpOnly: true, sameSite: 'strict', maxAge: 60 * 1000 }); // 60 segons
            next();
        } catch (error) {
            return res.status(400);
        }
    }
}

module.exports = verificaToken;

