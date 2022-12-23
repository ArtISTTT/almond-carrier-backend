import express, { Express, Request, Response } from 'express';
import cors from "cors";
import cookieSession from "cookie-session";
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import db from './app/models';
import authRoutes from './app/routes/auth.routes';
import userRoutes from './app/routes/user.routes';

dotenv.config();

const connectionString = process.env.ATLAS_URI as string;

const corsOptions = {
    origin: 'http://localhost:8000'
};

const app: Express = express();
const port = process.env.PORT;

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

app.use(
    cookieSession({
      name: "friendly-session",
      secret: "COOKIE_SECRET", // should use as secret environment variable
      httpOnly: true
    })
  );

const initial = () => {
    Role.estimatedDocumentCount((err: any, count: any) => {
      if (!err && count === 0) {
        new Role({
          name: "user"
        }).save((err: any) => {
          if (err) {
            console.log("error", err);
          }
  
          console.log("added 'user' to roles collection");
        });
  
        new Role({
          name: "moderator"
        }).save((err: any) => {
          if (err) {
            console.log("error", err);
          }
  
          console.log("added 'moderator' to roles collection");
        });
  
        new Role({
          name: "admin"
        }).save((err: any) => {
          if (err) {
            console.log("error", err);
          }
  
          console.log("added 'admin' to roles collection");
        });
      }
    });
  }

const Role = db.role;

console.log(connectionString);
db.mongoose
    .connect(connectionString, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => {
        console.log("Successfully connect to MongoDB.");
        initial();
    })
    .catch((err: any) => {
        console.error("Connection error", err);
        process.exit();
    });

    app.get("/", (req, res) => {
        res.json({ message: "Welcome to Friendly Carrier application." });
    });

authRoutes(app);
userRoutes(app);

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});