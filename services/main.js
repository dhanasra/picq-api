const depManager = require("../core/depManager");
const responser = require("../core/responser");
const { generateTokens } = require("./token");

async function fetchMainData(req, res){
    try{
        
        const userID = req.userID;
        const roleID = req.roleID;

        const [ user, studio ] = await Promise.all([
            depManager.USER.getUserModel().findById(userID),
            depManager.STUDIO.getStudioModel()
                .findOne({ createdBy: userID }).lean()
        ])

        if(studio.address){
            studio.address = await depManager.ADDRESS.getAddressModel().findById(studio.address)
        }   

        const token = generateTokens({ userID, roleID });

        return responser.success(res, { user, studio, token }, "_S001");
    }catch(e){
        console.log(e);
        return responser.error(res, "GLOBAL_E001");
    }
}

module.exports = {
    fetchMainData
}