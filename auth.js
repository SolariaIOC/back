const jwt = require('jsonwebtoken');

// Middleware per verificar el token i obtenir l'ID de l'usuari
function verificaToken(req, res, next) {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader) {
        return res.status(401).json({ error: 'Token no proporcionat' });
    }

    try {
        // Separa el prefix "Bearer" i el token
        const [bearer, token] = authorizationHeader.split(' ');

        // Verifica que s'ha proporcionat el token correctament
        if (!token || bearer.toLowerCase() !== 'bearer') {
            throw new Error('Token invàlid');
        }

        //Guarda id_usuari i TipusUsuari del token descodificat
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
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
        return res.status(401).json({ error: error.message });
    }
}

module.exports = verificaToken;