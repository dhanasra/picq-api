const JWT = require("jsonwebtoken");
const responser = require("../core/responser");

const accessTokenSecret = "e913335d263a473e3d822d5c59b2f4116ea683d66660a7d2aa874c78bda03c0d";

function generateTokens({ userID, roleID }) {
  const accessToken = JWT.sign({ sub: { userID, roleID } }, accessTokenSecret, {
    expiresIn: "1d",
  });
  const refreshToken = JWT.sign({ sub: { userID, roleID } }, accessTokenSecret, {
    expiresIn: "30d",
  });

  return { accessToken, refreshToken };
}

function verifyToken(token) {
  try {
    const decoded = JWT.verify(token, accessTokenSecret);
    return decoded;
  } catch (error) {
    return null;
  }
}

function getAccessToken(req, res) {
  const { refreshToken } = req.body;
  try {
    const decoded = verifyToken(refreshToken, accessTokenSecret);
    if (!decoded) {
      return responser.success(res, null, "TOKEN_E001");
    }
    const response = decoded.sub;
    const token = generateTokens(response);
    return responser.success(res, token, "TOKEN_S001");
  } catch (error) {
    console.log(error);
    return responser.error(res, error, "GLOBAL_E001");
  }
}

module.exports = {
  generateTokens,
  verifyToken,
  getAccessToken,
};
