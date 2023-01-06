import { Express } from 'express';
import {
    createOrderAsCarrier,
    createOrderAsReceiver,
    getMyOrders,
    searchOrders,
} from '../controllers/order.controller';

import middlewares from '../middlewares';

export default (app: Express) => {
    app.use((req, res, next) => {
        res.header(
            'Access-Control-Allow-Headers',
            'Origin, Content-Type, Accept'
        );
        next();
    });

    app.post(
        '/api/order/create-order-as-carrier',
        [middlewares.authJwt.verifyToken],
        createOrderAsCarrier
    );

    app.post(
        '/api/order/create-order-as-receiver',
        [middlewares.authJwt.verifyToken],
        createOrderAsReceiver
    );

    app.get(
        '/api/order/get-my-orders',
        [middlewares.authJwt.verifyToken],
        getMyOrders
    );

    app.post(
        '/api/order/search-orders',
        [middlewares.authJwt.verifyToken],
        searchOrders
    );
};
