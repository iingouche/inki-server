const Movie = require('../models/Movie');
const s3 = require('../config/minio');

const toSafeObjectName = (originalName) => {
  if (!originalName) {
    return `file_${Date.now()}`;
  }

  // Strip any path parts and normalize to safe ASCII
  const base = originalName.split(/[\\/]/).pop();
  const safe = base
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  return safe || `file_${Date.now()}`;
};

const uploadFile = async (file, folder) => {
  const safeName = toSafeObjectName(file.originalname);
  const params = {
    Bucket: 'cinema',
    Key: `${folder}/${Date.now()}_${safeName}`,
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

exports.getMovieVideo = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie || !movie.videoUrl) {
      return res.status(404).json({ message: "Movie video not found" });
    }

    let bucket = 'cinema';
    let key = '';

    try {
      const url = new URL(movie.videoUrl);
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length >= 2) {
        bucket = parts[0];
        key = parts.slice(1).join('/');
      }
    } catch (err) {
      return res.status(400).json({ message: "Invalid video URL" });
    }

    if (!key) {
      return res.status(404).json({ message: "Movie video not found" });
    }

    const range = req.headers.range;
    const head = await s3.headObject({ Bucket: bucket, Key: key }).promise();
    const total = head.ContentLength || 0;
    const contentType = head.ContentType || 'application/octet-stream';

    if (range) {
      const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
      const start = parseInt(startStr, 10) || 0;
      const end = endStr ? parseInt(endStr, 10) : total - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${total}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
      });

      s3.getObject({ Bucket: bucket, Key: key, Range: `bytes=${start}-${end}` })
        .createReadStream()
        .pipe(res);
      return;
    }

    res.writeHead(200, {
      'Content-Length': total,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
    });

    s3.getObject({ Bucket: bucket, Key: key })
      .createReadStream()
      .pipe(res);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching movie video",
      error: error.message
    });
  }
};

exports.getMoviePreview = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie || !movie.previewImage) {
      return res.status(404).json({ message: "Movie preview not found" });
    }

    let bucket = 'cinema';
    let key = '';

    try {
      const url = new URL(movie.previewImage);
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length >= 2) {
        bucket = parts[0];
        key = parts.slice(1).join('/');
      }
    } catch (err) {
      return res.status(400).json({ message: "Invalid preview URL" });
    }

    if (!key) {
      return res.status(404).json({ message: "Movie preview not found" });
    }

    const head = await s3.headObject({ Bucket: bucket, Key: key }).promise();
    const total = head.ContentLength || 0;
    const contentType = head.ContentType || 'image/jpeg';

    res.writeHead(200, {
      'Content-Length': total,
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000',
    });

    s3.getObject({ Bucket: bucket, Key: key })
      .createReadStream()
      .pipe(res);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching movie preview",
      error: error.message
    });
  }
};
