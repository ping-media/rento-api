const { mongoose } = require("mongoose");
const General = require("../../../db/schemas/onboarding/general.schema");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
require("dotenv").config();

/**
 * Update general info safely — skips empty/null/undefined fields.
 * @param {Object} updates - An object containing fields to update inside `info`.
 * @returns {Promise<Object>} - The updated general document.
 */

const {
  AWS_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_BUCKET_NAME,
} = process.env;

// Configure AWS S3 Client
const s3 = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

const createAndUpdateGeneral = async (req, res) => {
  const {
    weakendPrice,
    weakendPriceType,
    specialDays,
    gstStatus,
    clearSpecialDays = false,
  } = req.body;

  const allowedTypes = ["+", "-"];

  const hasWeakend =
    typeof weakendPrice === "number" && allowedTypes.includes(weakendPriceType);

  const hasSpecialDays =
    Array.isArray(specialDays) &&
    specialDays.length > 0 &&
    !specialDays.some((day) => !allowedTypes.includes(day.PriceType));

  if (!hasWeakend && !hasSpecialDays && !clearSpecialDays && !gstStatus) {
    return res.status(200).json({
      status: 400,
      message: "Provide at least valid weakend or specialDays data to proceed.",
    });
  }

  try {
    const existingGeneral = await General.findOne();

    if (gstStatus && existingGeneral) {
      if (!["active", "inactive"].includes(gstStatus)) {
        return res.status(200).json({
          status: 400,
          message: "Provide valid flag",
        });
      }

      const updated = await General.findOneAndUpdate(
        {},
        { "GST.status": gstStatus },
        { new: true }
      );

      if (!updated) {
        return res.status(200).json({
          status: 400,
          message: "General settings document not found.",
        });
      }

      return res.status(200).json({
        status: 200,
        success: true,
        message: "status change successfully.",
      });
    }

    if (existingGeneral) {
      if (hasWeakend) {
        existingGeneral.weakend = {
          Price: weakendPrice,
          PriceType: weakendPriceType,
        };
      }

      if (clearSpecialDays) {
        existingGeneral.specialDays = [];
      } else if (hasSpecialDays) {
        existingGeneral.specialDays = specialDays;
      }

      const updated = await existingGeneral.save();

      return res.status(200).json({
        status: 200,
        success: true,
        message: clearSpecialDays
          ? "Special days cleared successfully."
          : "General settings updated successfully.",
        data: updated,
      });
    } else {
      const newGeneral = new General({
        weakend: hasWeakend
          ? {
              Price: weakendPrice,
              PriceType: weakendPriceType,
            }
          : undefined,
        specialDays: clearSpecialDays ? [] : hasSpecialDays ? specialDays : [],
      });

      const saved = await newGeneral.save();

      return res.status(200).json({
        status: 200,
        success: true,
        message: "General setting created successfully.",
        data: saved,
      });
    }
  } catch (err) {
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Something went wrong: " + err.message,
    });
  }
};

const updateGeneralInfo = async (req, res) => {
  const { updates } = req.body;

  try {
    const general = await General.findOne();
    if (!general) {
      return res.status(200).json({
        status: 400,
        message: "Settings Not found! try again",
      });
    }

    const existingInfo = general.info || {};

    general.info = {
      ...existingInfo,
      email: updates.email?.trim() || existingInfo.email,
      contact: Number(updates.contact) || existingInfo.contact,
      waContact: Number(updates.waContact) || existingInfo.waContact,
      address: updates.address?.trim() || existingInfo.address,
      socialmedia: {
        facebook:
          updates.facebook?.trim() || existingInfo.socialmedia?.facebook || "#",
        instagram:
          updates.instagram?.trim() ||
          existingInfo.socialmedia?.instagram ||
          "#",
        twitter:
          updates.twitter?.trim() || existingInfo.socialmedia?.twitter || "#",
      },
      appLink: {
        IOS: updates.IOS?.trim() || existingInfo.appLink?.IOS || "#",
        Android:
          updates.Android?.trim() || existingInfo.appLink?.Android || "#",
      },
    };

    general.markModified("info");
    await general.save({ validateModifiedOnly: true });

    return res.status(200).json({
      status: 200,
      success: true,
      message: "Settings updated successfully.",
    });
  } catch (err) {
    console.error("Error updating general info:", err.message);
    res.status(500).json({
      status: 500,
      success: false,
      message: "Server error while updating basic settings.",
      error: err.message,
    });
  }
};

const addAndDeleteTestimonial = async (req, res) => {
  const { action, data } = req.body;

  try {
    const general = await General.findOne();
    if (!general) {
      return res.status(404).json({
        success: false,
        message: "Settings not found.",
      });
    }

    if (action === "add") {
      if (!data.name || !data.message) {
        return res.status(400).json({
          success: false,
          message: "Name and message are required for a testimonial.",
        });
      }

      // Limit check
      if (general.testimonial.length >= 10) {
        return res.status(400).json({
          success: false,
          message: "Cannot add more than 10 testimonials.",
        });
      }

      general.testimonial.push({
        _id: new mongoose.Types.ObjectId(),
        name: data.name.trim(),
        message: data.message.trim(),
        rating: data.rating || 5,
      });
    } else if (action === "delete") {
      if (!data._id) {
        return res.status(400).json({
          success: false,
          message: "_id is required to delete a testimonial.",
        });
      }

      general.testimonial = general.testimonial.filter(
        (item) => item._id.toString() !== data._id
      );
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Use 'add' or 'delete'.",
      });
    }

    general.markModified("testimonial");
    await general.save({ validateModifiedOnly: true });

    return res.status(200).json({
      success: true,
      message: `Testimonial ${
        action === "add" ? "added" : "deleted"
      } successfully.`,
      testimonial: general.testimonial,
    });
  } catch (error) {
    console.error("Error updating testimonial:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while updating testimonial.",
      error: error.message,
    });
  }
};

const addAndDeleteSlides = async (req, res) => {
  const image = req.file;
  const { action, _id } = req.body;
  console.log(image);

  try {
    const general = await General.findOne();
    if (!general) {
      return res.status(404).json({
        success: false,
        message: "Settings not found.",
      });
    }

    if (action === "add") {
      if (!image) {
        return res.status(404).json({
          success: false,
          message: "Banner not found.",
        });
      }

      const getMilliseconds = () => new Date().getTime();
      const fileName = `Banner_${getMilliseconds()}`;
      const params = {
        Bucket: AWS_BUCKET_NAME,
        Key: fileName,
        Body: image.buffer,
        ContentType: image.mimetype,
      };

      // Upload to S3
      await s3.send(new PutObjectCommand(params));

      // Construct the S3 File URL
      const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
      // Limit check
      if (general.slides.length >= 10) {
        return res.status(400).json({
          success: false,
          message: "Cannot add more than 10 Banners.",
        });
      }

      general.slides.push({
        _id: new mongoose.Types.ObjectId(),
        link: imageUrl,
      });
    } else if (action === "delete") {
      if (!_id) {
        return res.status(400).json({
          success: false,
          message: "id is required to delete a Banner.",
        });
      }

      general.slides = general.slides.filter(
        (item) => item._id.toString() !== _id
      );
    } else {
      return res.status(400).json({
        success: false,
        message: "Unable to delete banner! try again",
      });
    }

    general.markModified("slides");
    await general.save({ validateModifiedOnly: true });

    return res.status(200).json({
      success: true,
      message: `Banner ${action === "add" ? "added" : "deleted"} successfully.`,
      data: general.slides,
    });
  } catch (error) {
    console.error("Error updating banner:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while updating banner.",
      error: error.message,
    });
  }
};

const manageExtraAddOn = async (req, res) => {
  const { id, name, amount, maxAmount, status, delete: deleteFlag } = req.body;

  const isCreate =
    !id &&
    name &&
    typeof amount === "number" &&
    typeof maxAmount === "number" &&
    ["active", "inactive"].includes(status);

  const isUpdate =
    id &&
    (name ||
      typeof amount === "number" ||
      typeof maxAmount === "number" ||
      ["active", "inactive"].includes(status));

  const isDelete = id && deleteFlag === true;

  if (!isCreate && !isUpdate && !isDelete) {
    return res.status(400).json({
      status: 400,
      message: "Invalid request. No Data Found.",
    });
  }

  try {
    const general = await General.findOne();
    if (!general) {
      return res.status(404).json({
        status: 404,
        message: "General settings document not found.",
      });
    }

    if (isDelete) {
      const index = general.extraAddOn.findIndex(
        (item) => item._id.toString() === id
      );
      if (index === -1) {
        return res
          .status(404)
          .json({ status: 404, message: "Add-on not found." });
      }

      general.extraAddOn.splice(index, 1);
      await general.save();

      return res.status(200).json({
        status: 200,
        message: `Add-on deleted successfully.`,
      });
    }

    if (isUpdate) {
      const addOn = general.extraAddOn.find(
        (item) => item._id.toString() === id
      );
      if (!addOn) {
        return res
          .status(404)
          .json({ status: 404, message: "Add-on not found." });
      }

      if (name) addOn.name = name;
      if (typeof amount === "number") addOn.amount = amount;
      if (typeof maxAmount === "number") addOn.maxAmount = maxAmount;
      if (["active", "inactive"].includes(status)) addOn.status = status;

      await general.save();

      return res.status(200).json({
        status: 200,
        message: `Add-on updated successfully.`,
      });
    }

    if (isCreate) {
      const alreadyExists = general.extraAddOn.some(
        (item) => item.name === name
      );
      if (alreadyExists) {
        return res.json({
          status: 400,
          message: `Add-on with name '${name}' already exists.`,
        });
      }

      general.extraAddOn.push({
        _id: new mongoose.Types.ObjectId(),
        name,
        amount,
        maxAmount,
        status,
      });

      const saved = await general.save();
      const newAddOn = saved.extraAddOn[saved.extraAddOn.length - 1];

      return res.status(200).json({
        status: 200,
        message: `Add-on '${name}' created successfully.`,
        data: newAddOn,
      });
    }
  } catch (err) {
    return res.json({
      status: 500,
      message: "Server error: " + err.message,
    });
  }
};

const getGeneral = async (req, res) => {
  try {
    const generalSettings = await General.findOne();
    if (!generalSettings) {
      return res.status(200).json({
        status: 404,
        success: false,
        message: "General settings not found.",
      });
    }
    const { extraAddOn, __v, ...rest } = generalSettings.toObject();

    res.status(200).json({
      status: 200,
      success: true,
      message: "General settings fetched successfully.",
      data: rest,
    });
  } catch (error) {
    console.error("Error fetching general settings:", error);
    res.status(500).json({
      status: 500,
      success: false,
      message: "Server error while fetching general settings.",
      error: error.message,
    });
  }
};

const getExtraAddOns = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  try {
    const general = await General.findOne(
      {},
      {
        GST: 1,
        extraAddOn: 1,
        info: 1,
        slides: 1,
        testimonial: 1,
        appInfo: 1,
        maintenance: 1,
        testMode: 1,
      }
    );

    if (!general || !general.extraAddOn || !general.GST) {
      return res.status(404).json({
        status: 404,
        message: "No extra add-ons found.",
        data: [],
      });
    }

    // const total = general.extraAddOn.length;
    const paginated = general.extraAddOn.slice(skip, skip + limit);
    const GST = general.GST;
    const info = general.info || {};
    const slides = general.slides || [];
    const testimonial = general.testimonial || [];
    const maintenance = general.maintenance || false;
    const appInfo = general.appInfo || {};
    const testMode = general.testMode || false;

    return res.status(200).json({
      status: 200,
      message: "General settings fetched successfully.",
      data: paginated,
      GST: GST,
      info: info,
      slides: slides,
      testimonial: testimonial,
      appInfo,
      maintenance: maintenance,
      testMode: testMode,
      // pagination: {
      //   total,
      //   page,
      //   limit,
      //   totalPages: Math.ceil(total / limit),
      // },
    });
  } catch (err) {
    return res.status(500).json({
      status: 500,
      message: "Server error: " + err.message,
    });
  }
};

module.exports = {
  createAndUpdateGeneral,
  manageExtraAddOn,
  getExtraAddOns,
  getGeneral,
  updateGeneralInfo,
  addAndDeleteSlides,
  addAndDeleteTestimonial,
};
