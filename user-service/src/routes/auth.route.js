import express from 'express';
import {
     sendOTP,
     verifyOTP,
     login,
     rotateRefreshToken,
     verifyGoogleIdToken,
} from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
     sendOTPSchema,
     verifyOTPSchema,
     loginSchema,
     refreshTokenSchema,
     googleAuthSchema,
} from '../validations/auth.validation.js';

const router = express.Router();

router.post('/send-otp', validate(sendOTPSchema), sendOTP);
router.post('/verify-otp', validate(verifyOTPSchema), verifyOTP);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshTokenSchema), rotateRefreshToken);
router.post('/google-auth', validate(googleAuthSchema), verifyGoogleIdToken);

export default router;
