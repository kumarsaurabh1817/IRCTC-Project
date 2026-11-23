import { Router } from 'express';
import * as ctrl from '../controllers/search.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { searchTrainsSchema, autocompleteSchema } from '../validations/search.validation.js';

const router = Router();

// GET /search/trains?from=Delhi&to=Mumbai&date=2025-07-15
router.get('/trains', validate(searchTrainsSchema), ctrl.searchTrains);

// GET /search/autocomplete?q=del
router.get('/autocomplete', validate(autocompleteSchema), ctrl.autocomplete);

// Debug endpoints
router.get('/debug/stations', ctrl.debugStations);
router.get('/debug/trains', ctrl.debugTrains);

export default router;
