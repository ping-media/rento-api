const escapeRegex = (str = "") =>
  String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function normalizeIndianPhone(value = "") {
  const raw = String(value).trim();

  if (raw.startsWith("+91")) {
    return raw.slice(3).replace(/\D/g, "");
  }

  if (raw.startsWith("0")) {
    return raw.slice(1).replace(/\D/g, "");
  }

  return raw.replace(/\D/g, "");
}

module.exports = {
  normalizeIndianPhone,
  escapeRegex,
};
