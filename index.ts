import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import cookieSession from 'cookie-session';
import dotenv from 'dotenv';
import db from './app/models';
import authRoutes from './app/routes/auth.routes';
import userRoutes from './app/routes/user.routes';
import { initializeRoles } from './app/helpers/initilizeRoles';
import compression from 'compression';
import helmet from 'helmet';

dotenv.config();

const connectionString = process.env.MONGO_URL as string;

const corsOptions = {
    origin: function (_: any, callback: any) {
        return callback(null, true);
    },
    optionsSuccessStatus: 200,
    credentials: true,
};

const app: Express = express();
const port = process.env.PORT;

app.use(compression());
app.use(helmet());

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

app.use(
    cookieSession({
        name: 'friendly-session',
        secret: process.env.SESSION_SECRET,
        httpOnly: true,
        secure: false,
    })
);

app.use(cors(corsOptions));

db.mongoose
    .connect(connectionString, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log('Successfully connect to MongoDB.');
        initializeRoles();
    })
    .catch((err: any) => {
        console.error('Connection error', err);
        process.exit();
    });

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Friendly Carrier back-end application.' });
});

authRoutes(app);
userRoutes(app);

app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
