'use strict';

const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movie.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const upload = require('../middleware/upload.middleware');

router.get('/', movieController.getMovies);

router.post(
  '/',
  authMiddleware,
  roleMiddleware('admin'),
  upload.fields([
    { name: 'preview', maxCount: 1 },
    { name: 'video', maxCount: 1 },
    { name: 'poster', maxCount: 1 },
    { name: 'movie', maxCount: 1 }
  ]),
  movieController.createMovie
);

module.exports = router;
