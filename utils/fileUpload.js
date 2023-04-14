
import multer from "multer";
import crypto from "crypto";
import { getFileExtension } from "./util.js";

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            let filePath = `./autoTestFiles/`;
            cb(null, filePath);
        },
        filename: (req, file, cb) => {
            const customFileName = crypto.randomBytes(18).toString('hex').substr(0, 8);
            const fileExtension = getFileExtension(file.originalname);
            cb(null, customFileName + '.' + fileExtension);
        },
    }),
    limits: {
        fileSize: 1024*1024,
        files: 1
    }
});

export { upload };