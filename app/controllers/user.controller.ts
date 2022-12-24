import { Request, Response } from 'express';
import mongoose from 'mongoose';
import db from '../models';

export const allAccess = (req: Request, res: Response) => {
    res.status(200).send('Public Content.');
};

const User: mongoose.Model<any> = db.user;

export const userBoard = (req: Request, res: Response) => {
    User.findById({ email: req.body.id }).exec((err, user) => {
        if (err != null) {
            res.status(500).send({ message: err });
            return;
        }

        if (!user) {
            return res.status(404).send({ message: 'User Not found.' });
        }

        const authorities = [];

        for (let i = 0; i < user.roles.length; i++) {
            authorities.push(`ROLE_${user.roles[i].name.toUpperCase()}`);
        }

        res.status(200).send({
            id: user._id,
            username: user.username,
            email: user.email,
            dateOfBirth: user.dateOfBirth,
            roles: authorities,
        });
    });

    res.status(200).send('User Content.');
};

export const adminBoard = (req: Request, res: Response) => {
    res.status(200).send('Admin Content.');
};

export const moderatorBoard = (req: Request, res: Response) => {
    res.status(200).send('Moderator Content.');
};
