const cloudinary = require("cloudinary").v2;
// const { CloudinaryStorage } = require("multer-storage-cloudinary");
// const multer = require("multer");

cloudinary.config({
  // secure: true,
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
// Delete function
exports.deleteImageFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('Deleted:', result);
  } catch (error) {
    console.error('Cloudinary deletion error:', error);
  }
};

// const storage = new CloudinaryStorage({
//   cloudinary,
//   params: {
//     folder: "user_avatars",
//     allowed_formats: ["jpg", "png"],
//   },
// });

// const storage1 = new CloudinaryStorage({
//   cloudinary,
//   params: {
//     folder: 'parents',
//     allowed_formats: ['jpg', 'jpeg', 'png'],
//     public_id: (req, file) => `${Date.now()}-${file.originalname}`,
//   },
// });

module.exports = cloudinary
