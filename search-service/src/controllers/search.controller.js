import { asyncHandler } from '../utils/asyncHandler.js';
import * as searchService from '../services/search.service.js';

// Request shape is validated by zod (see validations/search.validation.js)

export const searchTrains = asyncHandler(async (req, res) => {
     const { from, to, date } = req.query;
     const results = await searchService.searchTrains(from, to, date || null);
     res.json({ success: true, data: results });
});

export const autocomplete = asyncHandler(async (req, res) => {
     const { q } = req.query;
     const suggestions = await searchService.autocompleteStation(q);
     res.json({ success: true, data: suggestions });
});

export const debugStations = asyncHandler(async (req, res) => {
     const data = await searchService.getAllStations();
     res.json({ success: true, count: data.length, data });
});

export const debugTrains = asyncHandler(async (req, res) => {
     const data = await searchService.getAllTrains();
     res.json({ success: true, count: data.length, data });
});
