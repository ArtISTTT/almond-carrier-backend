import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import authConfig from '../config/auth.config';
import db from '../models';

const { ROLES } = db;
const User = db.user;
const Role = db.role;

const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    const { token } =
        req.session as CookieSessionInterfaces.CookieSessionObject;

    if (!token) {
        return res.status(403).send({ message: 'No token provided!' });
    }

    jwt.verify(token, authConfig.secret, (err: any, decoded: any) => {
        if (err) {
            return res.status(401).send({ message: 'Unauthorized!' });
        }
        req.body.userId = decoded.id;
        next();
    });
};

const addUserIdToBodyIfTokenExists = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { token } =
        req.session as CookieSessionInterfaces.CookieSessionObject;

    if (!token) {
        return next();
    }

    jwt.verify(token, authConfig.secret, (err: any, decoded: any) => {
        if (err) {
            return next();
        }
        req.body.userId = decoded.id;
        next();
    });
};

const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    User.findById(req.body.userId).exec((err: any, user: any) => {
        if (err) {
            res.status(500).send({ message: err });
            return;
        }

        Role.find(
            {
                _id: { $in: user.roles },
            },
            (err: any, roles: any) => {
                if (err) {
                    res.status(500).send({ message: err });
                    return;
                }

                for (let i = 0; i < roles.length; i++) {
                    if (roles[i].name === 'admin') {
                        next();
                        return;
                    }
                }

                res.status(403).send({ message: 'Require Admin Role!' });
            }
        );
    });
};

const isModerator = (req: Request, res: Response, next: NextFunction) => {
    User.findById(req.body.userId).exec((err: any, user: any) => {
        if (err) {
            res.status(500).send({ message: err });
            return;
        }

        Role.find(
            {
                _id: { $in: user.roles },
            },
            (err: any, roles: any) => {
                if (err) {
                    res.status(500).send({ message: err });
                    return;
                }

                for (let i = 0; i < roles.length; i++) {
                    if (roles[i].name === 'moderator') {
                        next();
                        return;
                    }
                }

                res.status(403).send({ message: 'Require Moderator Role!' });
            }
        );
    });
};

export const authJwt = {
    verifyToken,
    isAdmin,
    isModerator,
    addUserIdToBodyIfTokenExists,
};
