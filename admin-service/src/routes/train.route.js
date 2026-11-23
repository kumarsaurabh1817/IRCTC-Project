import express from 'express';
import { createTrain, createRoute, getAllTrains, getTrainById } from '../controllers/train.controller.js';
import { getUserContext } from '../middlewares/getUserContext.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
     createTrainSchema,
     createRouteSchema,
     trainIdParamSchema,
} from '../validations/train.validation.js';

const router = express.Router();

router.post('/train', getUserContext, validate(createTrainSchema), createTrain);
router.get('/train', getUserContext, getAllTrains);
router.get('/train/:trainId', getUserContext, validate(trainIdParamSchema), getTrainById);
router.post('/route', getUserContext, validate(createRouteSchema), createRoute);

export default router;
