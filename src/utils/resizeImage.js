const sharp = require("sharp");

const resizeImg = async (file) => {
  try {
    const imageBuffer = file.buffer;
    const quality = 80;
    const format = "webp";

    const compressedBuffer = await sharp(imageBuffer)
      [format]({ quality })
      .toBuffer();

    return compressedBuffer;
  } catch (error) {
    console.error("Error compressing image:", error);
    throw error;
  }
};

module.exports = { resizeImg };
