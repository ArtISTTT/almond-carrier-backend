import { Express } from 'express';
import { verificationWebHook } from '../controllers/verifictionWebHooks';

export default (app: Express) => {
    app.post('/shufti-pro/webhook', verificationWebHook);
};
