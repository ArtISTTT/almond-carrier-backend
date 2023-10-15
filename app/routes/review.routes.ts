import { Express } from 'express';
import { getUserReviews, sendReview } from '../controllers/review.controller';
import middlewares from '../middlewares';

export default (app: Express) => {
    app.use((req, res, next) => {
        res.header(
            'Access-Control-Allow-Headers',
            'Origin, Content-Type, Accept'
        );
        next();
    });

    app.post('/api/review/send', [middlewares.authJwt.verifyToken], sendReview);
    app.get('/api/review/user', getUserReviews);
};
