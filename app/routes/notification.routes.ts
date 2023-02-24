import { removeNotification } from './../controllers/notification.controller';
import { Express } from 'express';
import middlewares from '../middlewares';
import { getNotifications } from '../controllers/notification.controller';

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
};
