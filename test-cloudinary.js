const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: '.env' });

console.log("Key:", process.env.CLOUDINARY_API_KEY);
console.log("Secret length:", process.env.CLOUDINARY_API_SECRET?.length);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

cloudinary.uploader.upload("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", { folder: "novel_platform" })
  .then(res => console.log("Success:", res.secure_url))
  .catch(err => console.error("Error:", err.message));
