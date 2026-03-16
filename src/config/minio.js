const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  endpoint: 'http://localhost:9000',
  accessKeyId: process.env.MINIO_ROOT_USER || 'minioadmin',
  secretAccessKey: process.env.MINIO_ROOT_PASSWORD || 'minioadmin',
  s3ForcePathStyle: true,
  signatureVersion: 'v4'
});

module.exports = s3;