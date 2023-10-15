import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Request, Response } from 'express';
import fs from 'fs';
import { s3 } from '.';
import db from '../models';

const User = db.user;

export const uploadFile = async (
    source: Express.Multer.File['path'],
    targetName: Express.Multer.File['filename'],
    req: Request,
    res: Response,
    data: Buffer,
    specificFolder?: string,
    ContentType?: string,
    ContentEncoding?: string,
    ContentDeposition?: string
): Promise<{ ok: boolean; Location?: string }> => {
    const putParams = {
        Bucket: 'img-bucket-friendly-carrier',
        Key: specificFolder ? `${specificFolder}/${targetName}` : targetName,
        Body: data,
        ACL: 'public-read-write',
        ContentType: ContentType ?? 'image/jpeg',
        ContentEncoding,
        ContentDeposition,
    };

    const resultPromise = new Promise<{ ok: boolean; Location?: string }>(
        (resolve, reject) => {
            s3.upload(putParams, undefined, async (err, data) => {
                if (err) {
                    resolve({
                        ok: false,
                    });
                } else {
                    fs.unlink(source, () => {});
                    fs.rm(source, () => {});

                    resolve({
                        ok: true,
                        Location: data.Location,
                    });
                }
            });
        }
    );

    const result = await resultPromise;

    return result;
};
