import { Request, Response } from 'express';
import db from '../../models';

const User = db.user;

export const verificationWebHook = async (req: Request, res: Response) => {
    const verificationResult = req.body;

    const user = await User.findByIdAndUpdate(
        { _id: verificationResult.reference },
        {
            $set: {
                idVerification: {
                    ...verificationResult,
                    isVerificated:
                        verificationResult.result.face_match === 'pass' &&
                        verificationResult.result.data_match === 'pass',
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
