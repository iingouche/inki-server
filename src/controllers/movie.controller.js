const Movie = require('../models/Movie');
const s3 = require('../config/minio');

const uploadFile = async (file, folder) => {
  const params = {
    Bucket: 'cinema',
    Key: `${folder}/${Date.now()}_${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype
  };

  const uploaded = await s3.upload(params).promise();
  return uploaded.Location;
};

exports.createMovie = async (req, res) => {
  try {
    const { title, description, price } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description required' });
    }

    let previewUrl = null;
    let videoUrl = null;

    const previewFile =
      req.files?.poster?.[0] || req.files?.preview?.[0] || null;
    const videoFile =
      req.files?.movie?.[0] || req.files?.video?.[0] || null;

    if (previewFile) {
      const folder = req.files?.poster ? 'posters' : 'previews';
      previewUrl = await uploadFile(previewFile, folder);
    }

    if (videoFile) {
      videoUrl = await uploadFile(videoFile, 'videos');
    }

    const movie = await Movie.create({
      title,
      description,
      price,
      isPaid: Number(price) > 0,
      previewImage: previewUrl,
      videoUrl
    });

    res.status(201).json({ message: 'Movie created', movie });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error creating movie', error: error.message });
  }
};

exports.getMovies = async (req, res) => {
  try {
    const movies = await Movie.find().select();
    return res.json(movies);

  } catch (error) {
    res.status(500).json({
      message: "Error fetching movies",
      error: error.message
    });
  }
};


exports.getMovieById = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    res.json(movie);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching movie",
      error: error.message
    });
  }
};
