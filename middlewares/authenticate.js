const responser = require("../core/responser");
const { verifyToken } = require("../services/token");

async function validateAccessToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return responser.error(res, "GLOBAL_E002", 401);
        }

        if (!authHeader.startsWith("Bearer ")) {
            return responser.error(res, "GLOBAL_E002", 401);
        }

        const accessToken = authHeader.split(' ').pop();

        
        if(accessToken=='public'){
            req.public = true;
            return next();
        }

        const decoded = verifyToken(accessToken);

        if (!decoded) {
            return responser.error(res, "GLOBAL_E002", 401);
        }

        const { userID, roleID, displayName } = decoded.sub;

        if (!userID || !roleID || !displayName) {
            return responser.error(res, "GLOBAL_E002", 401);
        }

        req.userID = userID;
        req.roleID = roleID;
        req.displayName = displayName;

        return next();
    } catch (error) {
        return responser.error(res, error.message || "GLOBAL_E002", 401);
    }
}

module.exports = { validateAccessToken };
