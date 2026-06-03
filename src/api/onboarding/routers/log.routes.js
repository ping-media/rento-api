const express = require("express");
const User = require("../../../db/schemas/onboarding/user.schema");
const Logs = require("../../../db/schemas/onboarding/log");
const router = require("express").Router();
const mongoose = require("mongoose");

router.get("/logs", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

    const skip = (page - 1) * limit;
    const search = req.query.search?.trim();

    const filter = {};

    if (search) {
      filter.$or = [
        {
          message: {
            $regex: search,
            $options: "i",
          },
        },
        {
          functionName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          userId: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const [logs, total] = await Promise.all([
      Logs.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),

      Logs.countDocuments(filter),
    ]);

    const userIds = [
      ...new Set(
        logs
          .map((log) => log.userId)
          .filter(
            (userId) => userId && mongoose.Types.ObjectId.isValid(userId),
          ),
      ),
    ];

    let userMap = new Map();

    if (userIds.length) {
      const users = await User.find(
        {
          _id: { $in: userIds },
        },
        {
          firstName: 1,
          lastName: 1,
          contact: 1,
          role: 1,
          profileImage: 1,
        },
      ).lean();

      userMap = new Map(
        users.map((user) => [
          String(user._id),
          {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            contact: user.contact,
            role: user.role,
            profileImage: user.profileImage,
          },
        ]),
      );
    }

    const enrichedLogs = logs.map((log) => ({
      ...log,
      userId: userMap.get(log.userId) || log.userId,
    }));

    return res.status(200).json({
      success: true,
      data: enrichedLogs,
      pagination: {
        total,
        currentPage: Number(page),
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get Logs Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch logs",
    });
  }
});

module.exports = router;
