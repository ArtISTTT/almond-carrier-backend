import { Express } from 'express';
import { verifySignUp } from '../middlewares/verifySignUp';

import * as controller from '../controllers/auth.controller';

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

    app.post(
        '/api/auth/signup',
        [verifySignUp.checkDuplicateEmail, verifySignUp.checkRolesExisted],
        controller.signup
    );

    app.post('/api/auth/signin', controller.signin);

    app.post('/api/auth/signout', controller.signout);

    app.post('/api/auth/recover', controller.recover);
    app.post('/api/auth/process-recover', controller.processRecover);
};
