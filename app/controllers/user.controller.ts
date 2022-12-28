import { Request, Response } from 'express';
import mongoose from 'mongoose';
import db from '../models';

export const allAccess = (req: Request, res: Response) => {
    res.status(200).send('Public Content.');
};

const User = db.user;

export const userBoard = (req: Request, res: Response) => {
    User.findById(req.body.userId).exec((err, user) => {
        if (err != null) {
            res.status(500).send({ message: err });
            return;
        }

        if (!user) {
            return res.status(404).send({ message: 'User Not found.' });
        }

        res.status(200).send({
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            dateOfBirth: user.dateOfBirth,
        });
    });
};

export const adminBoard = (req: Request, res: Response) => {
    res.status(200).send('Admin Content.');
};

export const moderatorBoard = (req: Request, res: Response) => {
    res.status(200).send('Moderator Content.');
};
