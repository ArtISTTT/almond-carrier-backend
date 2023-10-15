import { Express } from 'express';
import {
    getNotifications,
    removeAllNotifications,
    removeNotification,
} from '../controllers/notification.controller';
import middlewares from '../middlewares';

export default (app: Express) => {
    app.use((req, res, next) => {
        res.header(
            'Access-Control-Allow-Headers',
            'Origin, Content-Type, Accept'
        );
        next();
    });

    app.get(
        '/api/notifications/',
        [middlewares.authJwt.verifyToken],
        getNotifications
    );

    app.delete(
        '/api/notifications/',
        [middlewares.authJwt.verifyToken],
        removeNotification
    );

    app.delete(
        '/api/notifications/all',
        [middlewares.authJwt.verifyToken],
        removeAllNotifications
    );
};
