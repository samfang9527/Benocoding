
import express from 'express';
import { wrapAsync } from '../utils/util.js';
import { callback } from '../controllers/github_controller.js';

const router = express.Router();

router.route('/github/callback').get(wrapAsync(callback));

export {
    router as gitHubRouter
}