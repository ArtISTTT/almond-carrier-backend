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

export const upload = multer({ storage });
