const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads/tmp');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    cb(null, `${unique}_${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: {
    files: 4,
    fields: 20,
    parts: 40,
  },
});

module.exports = upload;
