import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import db from '../models';
import authConfig from '../config/auth.config';

const User: mongoose.Model<any> = db.user;
const Role: mongoose.Model<any> = db.role;

export const signup = (req: Request, res: Response) => {
    const user = new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 8),
        dateOfBirth: req.body.dateOfBirth,
    });

    user.save((err: any, user: any) => {
        if (err) {
            res.status(500).send({ message: err });
            return;
        }

        if (req.body.roles) {
            Role.find(
                {
                    name: { $in: req.body.roles },
                },
                (err: any, roles: any) => {
                    if (err) {
                        res.status(500).send({ message: err });
                        return;
                    }

                    user.roles = roles.map((role: any) => role._id);
                    user.save((err: any) => {
                        if (err) {
                            res.status(500).send({ message: err });
                            return;
                        }

                        const token = jwt.sign(
                            { id: user.id },
                            authConfig.secret,
                            {
                                expiresIn: 86400, // 24 hours
                            }
                        );

                        (
                            req.session as CookieSessionInterfaces.CookieSessionObject
                        ).token = token;

                        // TODO: Double logic from sign in
                        const authorities = [];

                        for (let i = 0; i < user.roles.length; i++) {
                            authorities.push(
                                `ROLE_${user.roles[i].name.toUpperCase()}`
                            );
                        }

                        res.status(200).send({
                            id: user._id,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            email: user.email,
                            dateOfBirth: user.dateOfBirth,
                            roles: authorities,
                        });
                    });
                }
            );
        } else {
            Role.findOne({ name: 'user' }, (err: any, role: any) => {
                if (err) {
                    res.status(500).send({ message: err });
                    return;
                }

                user.roles = [role._id];
                user.save((err: any) => {
                    if (err) {
                        res.status(500).send({ message: err });
                        return;
                    }

                    res.send({ message: 'User was registered successfully!' });
                });
            });
        }
    });
};

export const signin = (req: Request, res: Response) => {
    User.findOne({
        email: req.body.email,
    })
        .populate('roles', '-__v')
        .exec((err, user) => {
            if (err != null) {
                res.status(500).send({ message: err });
                return;
            }

            if (!user) {
                return res.status(404).send({ message: 'User Not found.' });
            }

            const passwordIsValid = bcrypt.compareSync(
                req.body.password,
                user.password
            );

            if (!passwordIsValid) {
                return res.status(401).send({ message: 'Invalid Password!' });
            }

            const token = jwt.sign({ id: user.id }, authConfig.secret, {
                expiresIn: 86400, // 24 hours
            });

            const authorities = [];

            for (let i = 0; i < user.roles.length; i++) {
                authorities.push(`ROLE_${user.roles[i].name.toUpperCase()}`);
            }

            (req.session as CookieSessionInterfaces.CookieSessionObject).token =
                token;

            res.status(200).send({
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                dateOfBirth: user.dateOfBirth,
                roles: authorities,
            });
        });
};

export function signout(req: Request, res: Response) {
    try {
        req.session = null;
        return res.status(200).send({ message: "You've been signed out!" });
    } catch (err) {
        console.log(err);
    }
}
