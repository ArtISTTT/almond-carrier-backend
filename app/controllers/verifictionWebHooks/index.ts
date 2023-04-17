import { Request, Response } from 'express';
import db from '../../models';

const User = db.user;

export const verificationWebHook = async (req: Request, res: Response) => {
    const verificationResult = req.body;

    console.log(verificationResult);

    const user = await User.findOneAndUpdate(
        { email: verificationResult.email },
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

    if (!user) {
        return res.status(404).send({
            ok: false,
        });
    }

    return;
};
