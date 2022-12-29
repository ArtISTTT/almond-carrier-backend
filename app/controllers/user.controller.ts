import { Request, Response } from 'express';
import mongoose from 'mongoose';
import db from '../models';
import * as core from 'express-serve-static-core';

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

type IReqUpdateUser = Request<
    core.ParamsDictionary,
    {},
    {
        firstName: string;
        lastName: string;
        dateOfBirth: Date;
        gender: string;
        phoneNumber: string;
        userId: string;
    }
>;

export const updateUserInfo = (req: IReqUpdateUser, res: Response) => {
    User.findById(req.body.userId).exec((err, user) => {
        if (err != null) {
            res.status(500).send({ message: err });
            return;
        }

        if (!user) {
            return res.status(404).send({ message: 'User Not found.' });
        }

        user.update({
            $set: {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                dateOfBirth: req.body.dateOfBirth,
                gender: req.body.gender,
                phoneNumber: req.body.phoneNumber,
            },
        });

        user.save()
            .then(() => {
                return res.status(200).send({
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    dateOfBirth: user.dateOfBirth,
                });
            })
            .catch(() => {
                return res
                    .status(401)
                    .send({ message: 'Error while updating User' });
            });
    });
};

export const adminBoard = (req: Request, res: Response) => {
    res.status(200).send('Admin Content.');
};

export const moderatorBoard = (req: Request, res: Response) => {
    res.status(200).send('Moderator Content.');
};
