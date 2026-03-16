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

    if (req.files?.preview) {
      previewUrl = await uploadFile(req.files.preview[0], 'previews');
    }

    if (req.files?.video) {
      videoUrl = await uploadFile(req.files.video[0], 'videos');
    }

    const movie = await Movie.create({
      title,
      description,
      price,
      isPaid: price > 0,
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
    // const movies = await Movie.find().select();
    const movies = [
      {title: 'Movie', description: 'some description for movie 1'},
      {title: 'Movie 2', description: 'some description for movie 1'},
    ]

    res.json(movies);
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