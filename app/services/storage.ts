import multer from 'multer';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(
            null,
            `${new Date().toISOString()}_${
                req.body.userId
            }_${file.originalname.replace(' ', '')}`
        );
    },
});

const storageMemory = multer.memoryStorage();

export const upload = multer({ storage: storageMemory });
