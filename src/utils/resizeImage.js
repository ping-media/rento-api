const sharp = require('sharp');

// Resize and compress image using sharp
const reziseImg = async (file) => {
  try {
    // Convert the Buffer to a sharp instance
    const imageBuffer = file.buffer;

    const quality = 80; // Desired image quality (for WebP and JPEG formats)
    const width = 800; // Example width (can be auto or based on your needs)
    const height = 600; // Example height (can be auto or based on your needs)
    const format = 'webp'; // Convert image to WebP format

    // Resize and convert the image using sharp
    const resizedBuffer = await sharp(imageBuffer)
      .resize(width, height) // Resize to the specified width and height
      .webp({ quality }) // Convert to WebP format with the specified quality
      .toBuffer(); // Output as a Buffer

    // You can now upload the resized image (resizedBuffer) to S3 or process further.
    //console.log('Resized image buffer:', resizedBuffer);
    return resizedBuffer; // Return the resized image buffer if needed

  } catch (error) {
    console.error("Error resizing image:", error);
    throw error;
  }
};

module.exports = { reziseImg };
