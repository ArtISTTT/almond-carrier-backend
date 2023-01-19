import { Express } from 'express';
import { verifySignUp } from '../middlewares/verifySignUp';

import * as controller from '../controllers/auth.controller';
import {
    getConversationByOrderId,
    postMessage,
} from '../controllers/chat.controller';
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

    app.get(
        '/api/chat/',
        [middlewares.authJwt.verifyToken],
        getConversationByOrderId
    );

    app.post(
        '/api/chat/post-message',
        [middlewares.authJwt.verifyToken],
        postMessage
    );
};
