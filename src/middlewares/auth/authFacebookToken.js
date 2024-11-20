exports.checkFacebookToken = async (req, res, next) => {
  try {
    next();
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};
