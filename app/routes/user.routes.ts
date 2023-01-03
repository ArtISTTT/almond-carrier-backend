import { Express } from 'express';
import {
    adminBoard,
    allAccess,
    moderatorBoard,
    updateAvatar,
    updateUserInfo,
    updateUserPassword,
    userBoard,
} from '../controllers/user.controller';

import middlewares from '../middlewares';
import { upload } from '../services/storage';

export default (app: Express) => {
    app.use((req, res, next) => {
        // res.setHeader(
        //     'Access-Control-Allow-Origin',
        //     'https://friendlycarrier.com'
        // );
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

    app.post(
        '/api/update-user-info',
        [middlewares.authJwt.verifyToken],
        updateUserInfo
    );

    app.post(
        '/api/update-user-password',
        [middlewares.authJwt.verifyToken],
        updateUserPassword
    );

    app.post(
        '/api/update-avatar',
        [upload.single('image'), middlewares.authJwt.verifyToken],
        updateAvatar
    );
};
