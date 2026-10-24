export const adminOnly = (req, res, next) => {
  if (req.user?.userType !== "admin") {
    return res.status(200).json({
      success: false,
      status: 403,
      message: "Only admin are allowed to do this operation!",
      data: [],
    });
  }
  next();
};
