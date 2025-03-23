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

        console.log(decoded);

        if (!decoded) {
            return responser.error(res, "GLOBAL_E002", 401);
        }

        const { userID, roleID } = decoded.sub;

        if (!userID || !roleID) {
            return responser.error(res, "GLOBAL_E002", 401);
        }

        req.userID = userID;
        req.roleID = roleID;

        return next();
    } catch (error) {
        return responser.error(res, error.message || "GLOBAL_E002", 401);
    }
}

module.exports = { validateAccessToken };
