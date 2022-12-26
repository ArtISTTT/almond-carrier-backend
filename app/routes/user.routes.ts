import { Express } from 'express';
import {
    adminBoard,
    allAccess,
    moderatorBoard,
    userBoard,
} from '../controllers/user.controller';

import middlewares from '../middlewares';

export default (app: Express) => {
    app.use((req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', [
            'https://friendlycarrier.com',
            'http://localhost:3000',
        ]);
        res.header(
            'Access-Control-Allow-Headers',
            'Origin, Content-Type, Accept'
        );
        next();
    });

    app.get('/api/test/all', allAccess);

    app.get('/api/user', [middlewares.authJwt.verifyToken], userBoard);

    app.get(
        '/api/test/mod',
        [middlewares.authJwt.verifyToken, middlewares.authJwt.isModerator],
        moderatorBoard
    );

    app.get(
        '/api/test/admin',
        [middlewares.authJwt.verifyToken, middlewares.authJwt.isAdmin],
        adminBoard
    );
};
