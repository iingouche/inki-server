const multer = require('multer');

const MB = 1024 * 1024;

const toPositiveNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const maxUploadFileMb = toPositiveNumber(process.env.MAX_UPLOAD_FILE_MB, 1024);

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: maxUploadFileMb * MB,
    files: 4,
    fields: 20,
    parts: 40,
  },
});

module.exports = upload;
