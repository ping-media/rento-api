const forge = require("node-forge");

function generateCfSignature() {
  const clientId = process.env.CASHFREE_CLIENT_ID;
  const timestamp = Math.floor(Date.now() / 1000);
  const data = `${clientId}.${timestamp}`;

  // Decode the base64 pem from environment variable
  const pemBuffer = Buffer.from(process.env.CF_PUBLIC_KEY_BASE64, "base64");
  const publicKeyPem = pemBuffer.toString("utf8");

  const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
  const encrypted = publicKey.encrypt(data, "RSAES-PKCS1-V1_5");
  return forge.util.encode64(encrypted);
}

module.exports = generateCfSignature;
