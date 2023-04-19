import { Request, Response } from 'express';
import db from '../../models';

const User = db.user;

export const verificationWebHook = async (req: Request, res: Response) => {
    const verificationResult = req.body;

    await User.findOneAndUpdate(
        {
            email: verificationResult.email,
            idVerification: {
                isVerificated: false,
            },
        },
        {
            $set: {
                idVerification: {
                    ...verificationResult,
                    isVerificated:
                        verificationResult.event === 'verification.accepted',
                },
            },
        },
        { new: true }
    );

    return;
};
