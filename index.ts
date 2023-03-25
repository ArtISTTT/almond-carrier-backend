import compression from 'compression';
import cookieSession from 'cookie-session';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import * as http from 'http';
import { ConnectOptions } from 'mongoose';
import * as socketio from 'socket.io';
import { getAdminJs } from './app/adminjs/index';
import { updateAWSConfig } from './app/aws-s3';
import { initializeDB } from './app/helpers/initialize';
import db from './app/models';
import authRoutes from './app/routes/auth.routes';
import chatRoutes from './app/routes/chat.routes';
import notificationRoutes from './app/routes/notification.routes';
import orderRoutes from './app/routes/order.routes';
import reviewRoutes from './app/routes/review.routes';
import userRoutes from './app/routes/user.routes';
import WebSockets from './app/socketio/index';

dotenv.config();

const connectionString = process.env.MONGO_URL as string;

const env = process.env.NODE_ENV || 'development';

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

app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
                baseUri: ["'self'"],
                fontSrc: ["'self'", 'https:', 'data:'],
            },
        },
    })
);

const { adminRouter, rootPath } = getAdminJs();

app.use(rootPath, adminRouter);

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

app.use(
    cookieSession({
        name: 'friendly-session',
        secret: process.env.SESSION_SECRET,
        httpOnly: true,
    })
);

app.use(
    '/uploads',
    helmet.crossOriginResourcePolicy({ policy: 'cross-origin' })
);

app.use('/uploads', express.static('uploads'));

app.use(cors(corsOptions));

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Friendly Carrier back-end application.' });
});

const server = http.createServer(app);
global.io = new socketio.Server(server);
global.io.on('connection', WebSockets.connection);

authRoutes(app);
userRoutes(app);
chatRoutes(app);
orderRoutes(app);
reviewRoutes(app);
notificationRoutes(app);

const start = async () => {
    await db.mongoose
        .connect(connectionString, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        } as ConnectOptions)
        .then(() => {
            console.log('Successfully connect to MongoDB.');
            initializeDB();
        })
        .catch((err: any) => {
            console.error('Connection error', err);
            process.exit();
        });

    server.listen(port, () => {
        updateAWSConfig();
        console.log(
            `⚡️[server]: Server is running at http://localhost:${port}`
        );
    });
};

start();
