
import express from 'express';
import { wrapAsync } from '../utils/util.js';
import { functionTest, apiTest } from '../controllers/autoTest_controller.js';
import { upload } from '../utils/fileUpload.js';

const router = express.Router();

router.route('/autotest/functiontest').post(upload.single('testfile'), wrapAsync(functionTest));
router.route('/autotest/apitest').post(wrapAsync(apiTest));

export {
    router as autoTestRouter
}