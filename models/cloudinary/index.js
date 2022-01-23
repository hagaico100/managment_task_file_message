const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_KEY,
    api_secret: process.env.CLOUD_SECRET,
});
const storage = new CloudinaryStorage({
    cloudinary,
    folder: 'managment_file',
    allowed_formats:['jpeg','png','gif','pdf','svg']
});
module.exports ={
    cloudinary,
    storage
}