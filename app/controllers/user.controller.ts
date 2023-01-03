import { Request, Response } from 'express';
import db from '../models';
import * as core from 'express-serve-static-core';
import bcrypt from 'bcryptjs';
import { getFullUri } from '../services/getFullUri';

export const allAccess = (req: Request, res: Response) => {
    res.status(200).send('Public Content.');
};

const BRYPTO_KEY = process.env.BCRYPTO_KEY;

const User = db.user;
const Image = db.image;

export const userBoard = (req: Request, res: Response) => {
    User.findById(req.body.userId).exec(async (err, user) => {
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
            gender: user.gender,
            phoneNumber: user.phoneNumber,
            dateOfBirth: user.dateOfBirth,
            avatar: user.avatarImage,
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

export const updateUserInfo = async (req: IReqUpdateUser, res: Response) => {
    const user = await User.findByIdAndUpdate(
        { _id: req.body.userId },
        {
            $set: {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                dateOfBirth: req.body.dateOfBirth,
                gender: req.body.gender,
                phoneNumber: req.body.phoneNumber,
            },
        },
        { new: true, lean: true }
    );

    if (!user) {
        return res.status(404).send({ message: 'User Not found.' });
    }

    return res.status(200).send({
        user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            gender: user.gender,
            phoneNumber: user.phoneNumber,
            dateOfBirth: user.dateOfBirth,
            avatar: user.avatarImage,
        },
    });
};

type IReqUpdateUserPassword = Request<
    core.ParamsDictionary,
    {},
    {
        oldPassword: string;
        newPassword: string;
        userId: string;
    }
>;

export const updateUserPassword = async (
    req: IReqUpdateUserPassword,
    res: Response
) => {
    const user = await User.findById({ _id: req.body.userId });

    if (!user) {
        return res.status(404).send({
            message: 'User Not found!',
        });
    }

    const isValidOldPassword = bcrypt.compareSync(
        req.body.oldPassword,
        user.password
    );

    if (!isValidOldPassword) {
        return res.status(404).send({ message: 'Old password is not valid' });
    }

    const newPasswordHash = bcrypt.hashSync(
        req.body.newPassword,
        Number(BRYPTO_KEY)
    );

    await User.updateOne(
        { _id: req.body.userId },
        {
            $set: {
                password: newPasswordHash,
            },
        },
        { new: true }
    );

    return res.status(200).send({ ok: true });
};

export const adminBoard = (req: Request, res: Response) => {
    res.status(200).send('Admin Content.');
};

export const moderatorBoard = (req: Request, res: Response) => {
    res.status(200).send('Moderator Content.');
};

export const updateAvatar = async (req: Request, res: Response) => {
    if (req.file === undefined) return res.send('you must select a file.');

    const imageUri = `${getFullUri(req)}/${req.file.path}`;

    await User.updateOne(
        { _id: req.body.userId },
        {
            $set: {
                avatarImage: imageUri,
            },
        },
        { new: true }
    );

    res.status(200).send({
        message: 'Avatar successfully updated',
        avatar: imageUri,
    });
};
