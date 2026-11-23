import express from 'express';
import {
     createStation,
     getAllStations,
     getStationById,
     getStationByIdInternal,
} from '../controllers/station.controller.js';
import { getUserContext } from '../middlewares/getUserContext.middleware.js';
import { internalAuth } from '../middlewares/internalAuth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
     createStationSchema,
     getAllStationsSchema,
     stationIdParamSchema,
} from '../validations/station.validation.js';

const router = express.Router();

router.get('/station/internal/:stationId', internalAuth, validate(stationIdParamSchema), getStationByIdInternal);

router.get('/station', getUserContext, validate(getAllStationsSchema), getAllStations);
router.get('/station/:stationId', getUserContext, validate(stationIdParamSchema), getStationById);
router.post('/station', getUserContext, validate(createStationSchema), createStation);

export default router;
