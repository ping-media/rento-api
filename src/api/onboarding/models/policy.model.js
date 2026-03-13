const sanitizeHtml = require("sanitize-html");
const Policy = require("../../../db/schemas/onboarding/policy.schema");

const getPolicy = async (req, res) => {
  try {
    const type = req.params.type.toLowerCase().trim();

    const policy = await Policy.findOne({
      type: type,
    });

    if (!policy) {
      return res.status(404).json({ message: "Policy not found" });
    }

    res.status(200).json(policy);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const savePolicy = async (req, res) => {
  try {
    const { type, content } = req.body;

    if (!type || !content) {
      return res.status(400).json({ message: "Type & content required" });
    }

    if (typeof content !== "string") {
      return res.status(400).json({ message: "Content must be a string" });
    }

    // Size limit (e.g. 500KB)
    if (content.length > 500000) {
      return res
        .status(200)
        .json({ status: 400, success: false, message: "Content too large" });
    }

    // 3. Sanitize HTML — strips dangerous tags/attributes
    const sanitizedContent = sanitizeHtml(content, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat([
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "img",
        "u",
        "span",
        "div",
        "section",
        "table",
        "thead",
        "tbody",
        "tr",
        "th",
        "td",
      ]),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        "*": ["style", "class"], // allow style/class on any tag
        a: ["href", "target", "rel"],
        img: ["src", "alt", "width", "height"],
      },
      allowedSchemes: ["https", "http", "mailto"], // block javascript: URIs
      disallowedTagsMode: "discard", // silently remove bad tags
    });

    // Reject if sanitization stripped everything meaningful
    if (!sanitizedContent.trim()) {
      return res.status(200).json({
        status: 400,
        success: false,
        message: "Content is empty after sanitization",
      });
    }

    const normalizedType = type.toLowerCase().trim();

    const policy = await Policy.findOneAndUpdate(
      { type: normalizedType },
      { content: sanitizedContent },
      { new: true, upsert: true, runValidators: true },
    );

    res.status(200).json({
      success: true,
      policy,
    });
  } catch (error) {
    // Handle invalid enum value
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getPolicy, savePolicy };
