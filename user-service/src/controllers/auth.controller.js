import { asyncHandler } from '../utils/asyncHandler.js';
import { config } from '../config/index.js';
import authService from '../services/auth.service.js';
import { getDeviceFingerprint } from '../utils/deviceFingerprint.js';

const isProd = process.env.NODE_ENV === 'production';

const cookieOptions = (maxAge) => ({
     httpOnly: true,
     secure: isProd,
     sameSite: isProd ? 'strict' : 'lax',
     maxAge,
});

export const sendOTP = asyncHandler(async (req, res) => {
     const { firstName, lastName, email, password } = req.body;

     const { otpSessionId } = await authService.sendOTP(
          firstName,
          lastName,
          email,
          password
     );
     res.cookie('otp_session', otpSessionId, cookieOptions(config.OTP_TTL * 1000))
          .status(200)
          .json({
               success: true,
               message: 'OTP sent successfully',
          });
});

export const verifyOTP = asyncHandler(async (req, res) => {
     const { otp } = req.body;
     const otpSessionId = req.cookies.otp_session;

     const user = await authService.verifyOTP(otp, otpSessionId);
     res.clearCookie('otp_session');
     return res.status(201).json({
          success: true,
          message: 'User Account created successfully',
          data: user,
     });
});

export const login = asyncHandler(async (req, res) => {
     const { email, password } = req.body;
     const deviceId = getDeviceFingerprint(req);
     const { accessToken, refreshToken, loggedInUser } = await authService.login(
          email,
          password,
          deviceId
     );
     res.cookie(
          'accessToken',
          accessToken,
          cookieOptions(config.ACCESS_TOKEN_EXP_SEC * 1000)
     );
     res.cookie(
          'refreshToken',
          refreshToken,
          cookieOptions(config.REFRESH_TOKEN_EXP_SEC * 1000)
     )
          .status(200)
          .json({
               success: true,
               message: 'Logged in successfully',
               loggedInUser,
          });
});

export const rotateRefreshToken = asyncHandler(async (req, res) => {
     const refreshToken = req.cookies.refreshToken;
     const deviceId = getDeviceFingerprint(req);
     const { newAccessToken, newRefreshToken } =
          await authService.rotateRefreshToken(refreshToken, deviceId);
     res.cookie(
          'accessToken',
          newAccessToken,
          cookieOptions(config.ACCESS_TOKEN_EXP_SEC * 1000)
     );
     res.cookie(
          'refreshToken',
          newRefreshToken,
          cookieOptions(config.REFRESH_TOKEN_EXP_SEC * 1000)
     )
          .status(200)
          .json({
               success: true,
               message: 'Access and Refresh token reissued',
          });
});

export const verifyGoogleIdToken = asyncHandler(async (req, res) => {
     const { idToken } = req.body;
     const deviceId = getDeviceFingerprint(req);

     const { accessToken, refreshToken, loggedInUser } =
          await authService.verifyGoogleIdToken(idToken, deviceId);

     res.cookie(
          'accessToken',
          accessToken,
          cookieOptions(config.ACCESS_TOKEN_EXP_SEC * 1000)
     );
     res.cookie(
          'refreshToken',
          refreshToken,
          cookieOptions(config.REFRESH_TOKEN_EXP_SEC * 1000)
     )
          .status(200)
          .json({
               success: true,
               message: 'Logged in successfully',
               loggedInUser,
          });
});

export default {
     sendOTP,
     verifyOTP,
     login,
     rotateRefreshToken,
     verifyGoogleIdToken,
};
