import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import authConfig from '../config/auth.config';
import { generateRandomCodeAsString } from '../helpers/initialize/generateRandomCode';
import {
    sendRecoverPasswordEmail,
    sendRecoverPasswordSuccessfullyEmail,
} from '../mailService/recoverPassword';
import { sendVerification } from '../mailService/verificationCode';
import db from '../models';

const User = db.user;
const Role = db.role;
const Token = db.token;

const BRYPTO_KEY = process.env.BCRYPTO_KEY;

export const signup = (req: Request, res: Response) => {
    const user = new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, Number(BRYPTO_KEY)),
        dateOfBirth: req.body.dateOfBirth,
    });

    user.save((err, user) => {
        if (err != null) {
            res.status(500).send({ message: err });
            return;
        }

        Role.findOne({ name: 'user' }, (err: any, role: any) => {
            if (err) {
                res.status(500).send({ message: err });
                return;
            }

            user.roles = [role._id];

            user.save(async (err: any) => {
                if (err) {
                    res.status(500).send({ message: err });
                    return;
                }

                const token = await Token.findOne({ userId: user._id });
                if (token != null) await token.deleteOne();
                const verificationToken = crypto
                    .randomBytes(32)
                    .toString('hex');
                const hash = await bcrypt.hash(
                    verificationToken,
                    Number(BRYPTO_KEY)
                );

                await new Token({
                    userId: user._id,
                    token: hash,
                    createdAt: Date.now(),
                }).save();

                const link = `${req.headers.origin}/verification?token=${verificationToken}&id=${user._id}`;

                console.log('LINK TO VERIFY: ', link);

                sendVerification(link, user.email);

                res.status(200).send({
                    email: user.email,
                });
            });
        });
    });
};

export const verify = async (req: Request, res: Response) => {
    const verificationToken = await Token.findOne({ userId: req.body.userId });

    if (verificationToken == null) {
        return res.status(404).send({ message: 'invalidOrExpiredToken' });
    }

    const isValid = await bcrypt.compare(
        req.body.token,
        verificationToken.token
    );

    if (!isValid) {
        return res.status(404).send({ message: 'invalidOrExpiredToken' });
    }

    const user = await User.findByIdAndUpdate(
        { _id: req.body.userId },
        { $set: { verificated: true } },
        { new: true }
    );

    if (user == null) {
        return res.status(404).send({
            ok: false,
        });
    }

    await verificationToken.deleteOne();

    const token = jwt.sign({ id: user.id }, authConfig.secret, {
        expiresIn: 2592000,
    });

    (req.session as CookieSessionInterfaces.CookieSessionObject).token = token;

    return res.status(200).send({
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        dateOfBirth: user.dateOfBirth,
        avatar: user.avatarImage,
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

            if (user == null) {
                return res.status(404).send({ message: 'User Not found.' });
            }

            if (!user.verificated) {
                return res.status(500).send({ notVerified: true });
            }

            const passwordIsValid = bcrypt.compareSync(
                req.body.password,
                user.password
            );

            if (!passwordIsValid) {
                return res.status(401).send({ message: 'Invalid Password!' });
            }

            const token = jwt.sign({ id: user.id }, authConfig.secret, {
                expiresIn: 2592000, // 24 hours
            });

            (req.session as CookieSessionInterfaces.CookieSessionObject).token =
                token;

            res.status(200).send({
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                dateOfBirth: user.dateOfBirth,
                avatar: user.avatarImage,
            });
        });
};

export function signout(req: Request, res: Response) {
    try {
        (req.session as any) = null;
        return res.status(200).send({ message: "You've been signed out!" });
    } catch (err) {
        console.log(err);
    }
}

export const recover = async (req: Request, res: Response) => {
    const user = await User.findOne({
        email: req.body.email,
    });

    if (user == null) {
        return res.status(404).send({ message: 'User Not found.' });
    }

    if (!user.verificated) {
        return res.status(500).send({ notVerified: true });
    }

    const token = await Token.findOne({ userId: user._id });
    if (token != null) await token.deleteOne();
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hash = await bcrypt.hash(resetToken, Number(BRYPTO_KEY));

    await new Token({
        userId: user._id,
        token: hash,
        createdAt: Date.now(),
    }).save();

    const link = `${req.headers.origin}/password-reset?token=${resetToken}&id=${user._id}`;

    sendRecoverPasswordEmail(link, req.body.email);

    res.status(200).send({
        message: 'Link to reset your password has been sent',
    });
};

export const processRecover = async (req: Request, res: Response) => {
    const passwordResetToken = await Token.findOne({ userId: req.body.userId });

    if (passwordResetToken == null) {
        return res
            .status(404)
            .send({ message: 'Invalid or expired password reset token.' });
    }

    const isValid = await bcrypt.compare(
        req.body.token,
        passwordResetToken.token
    );

    if (!isValid) {
        return res
            .status(404)
            .send({ message: 'Invalid or expired password reset token!' });
    }

    const hash = bcrypt.hashSync(
        req.body.password,
        Number(process.env.BCRYPTO_KEY)
    );

    await User.updateOne(
        { _id: req.body.userId },
        { $set: { password: hash } },
        { new: true }
    );
    const user = await User.findById({ _id: req.body.userId });

    if (user == null) {
        return res.status(404).send({
            message: 'User Not found!',
        });
    }

    sendRecoverPasswordSuccessfullyEmail(user.firstName, user.email);

    await passwordResetToken.deleteOne();

    res.status(200).send({
        message: 'Password has been changed!',
    });
};
