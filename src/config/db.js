const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  const retryDelayMs = 3000;
  const maxRetries = 10;
  let attempt = 0;

  const connectWithRetry = async () => {
    try {
      await mongoose.connect(uri);
      console.log('MongoDB connected');
    } catch (error) {
      attempt += 1;
      console.error(`DB connection error (attempt ${attempt}/${maxRetries}):`, error);
      if (attempt >= maxRetries) {
        console.error('Max DB connection attempts reached. Will keep retrying.');
        attempt = 0;
      }
      setTimeout(connectWithRetry, retryDelayMs);
    }
  };

  if (!uri) {
    console.error('MONGO_URI is not set. Skipping DB connection.');
    return;
  }

  connectWithRetry();
};

module.exports = connectDB;
