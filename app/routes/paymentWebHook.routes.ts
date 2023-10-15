import { Express } from 'express';

import bodyParser from 'body-parser';
import bodyParserXML from 'body-parser-xml';
import { paymentWebHook } from '../controllers/qiwi';

bodyParserXML(bodyParser);

// web hook
export default (app: Express) => {
    app.post('/payment-callback', bodyParser.xml(), paymentWebHook);
};
