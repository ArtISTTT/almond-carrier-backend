import { Express } from 'express';
import { verifySignUp } from '../middlewares/verifySignUp';

import bodyParser from 'body-parser';
import bodyParserXML from 'body-parser-xml';
import * as controller from '../controllers/auth.controller';
import { paymentWebHook } from '../controllers/qiwi';
import { verificationWebHook } from '../controllers/verifictionWebHooks';

bodyParserXML(bodyParser);

export default (app: Express) => {
    app.post('/payment-callback', bodyParser.xml(), paymentWebHook);
};
