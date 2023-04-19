import { Express } from 'express';
import { verifySignUp } from '../middlewares/verifySignUp';

import * as controller from '../controllers/auth.controller';
import { paymentWebHook } from '../controllers/paygine';
import { verificationWebHook } from '../controllers/verifictionWebHooks';

export default (app: Express) => {
    app.post('/payment-callback', paymentWebHook);
};
