export const adminOnly = (req, res, next) => {
  if (req.user?.userType !== "admin") {
    return res.status(200).json({
      status: 403,
      message: "Only admin can update station weekly off",
      data: [],
    });
  }
  next();
};
