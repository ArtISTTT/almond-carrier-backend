import { Express } from 'express';
import {
    adminBoard,
    allAccess,
    getSavedCards,
    getUserProfile,
    moderatorBoard,
    updateAvatar,
    updateUserInfo,
    updateUserPassword,
    userBoard,
} from '../controllers/user.controller';

import { upload } from '../aws-s3';
import { getSaveCardUrl } from '../controllers/order.controller';
import middlewares from '../middlewares';

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

    app.get('/api/get-user', [middlewares.authJwt.verifyToken], getUserProfile);

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

    app.get(
        '/api/get-save-card-url',
        [middlewares.authJwt.verifyToken],
        getSaveCardUrl
    );

    app.get(
        '/api/get-saved-cards',
        [middlewares.authJwt.verifyToken],
        getSavedCards
    );

    app.post(
        '/api/update-avatar',
        [upload.single('image'), middlewares.authJwt.verifyToken],
        updateAvatar
    );
};
