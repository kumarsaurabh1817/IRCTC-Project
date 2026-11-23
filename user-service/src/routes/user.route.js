import express from 'express';
import { getUserContext } from '../middlewares/getUserContext.middleware.js';
import { internalAuth } from '../middlewares/internalAuth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
     getUserInternalSchema,
     updateProfileSchema,
} from '../validations/user.validation.js';
import {
     getProfile,
     updateProfile,
     deleteProfile,
     getUserInternal,
} from '../controllers/user.controller.js';

const router = express.Router();

router.get('/profile', getUserContext, getProfile);
router.put('/profile', getUserContext, validate(updateProfileSchema), updateProfile);
router.delete('/profile', getUserContext, deleteProfile);

router.get(
     '/internal/:userId',
     internalAuth,
     validate(getUserInternalSchema),
     getUserInternal
);

export default router;
