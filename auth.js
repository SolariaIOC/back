const jwt = require("jsonwebtoken");
const { refrescarToken } = require('./tokenUtils.js')


// Middleware per verificar el token i obtenir l'ID de l'usuari
function verificaToken(req, res, next) {
    const authorizationHeader = req.cookies['token'];
    const refreshToken = req.cookies['refreshToken'];

    if (!authorizationHeader && !refreshToken) {
        return res.status(401).json({ error: 'Token no proporcionat' });
    }
    try {
        
        // Verifica que s'ha proporcionat el token correctament
        if (!token) {
            throw new Error('Token invàlid');
        }

        //Guarda id_usuari i TipusUsuari del token descodificat
        const decodedToken = jwt.verify(authorizationHeader, process.env.JWT_SECRET);
        req.idUsuariToken = decodedToken.usuario.id_usuari;
        req.TipusUsuariToken = decodedToken.usuario.TipusUsuari;

        // Redirigeix l'usuari al seu endpoint corresponent si no s'està intentant accedir ja a l'endpoint adequat
        if (req.method !== 'DELETE') {
            switch (req.TipusUsuariToken) {
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
                            if (req.path === '/immobles/a/afegirUsuari') {
                                return res.redirect('/immobles/a/afegirUsuari');
                            } else if (req.path === '/immobles/a/afegirUsuariImmoble') {
                                return res.redirect('/immobles/a/afegirImmoble');
                            }
                            break;
                        case 'DELETE':
                            if (req.path === '/immobles/a/eliminarUsuari') {
                                return res.redirect('/immobles/a/eliminarUsuari');
                            } else if (req.path === '/immobles/a/eliminarImmoble') {
                                return res.redirect('/immobles/a/eliminarImmoble');
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
                res.status(302).json({ redirectTo: "http://solaria.website" }) //Debe redirigir a la pagina de login para conseguir dos nuevos token
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