const depManager = require("../core/depManager");
const responser = require("../core/responser");
const { generateTokens } = require("./token");

async function fetchMainData(req, res){
    try{
        
        const userID = req.userID;
        const roleID = req.roleID;

        if(roleID!='studio_owner'){
            const user = await depManager.USER.getUserModel().findById(userID);

            if(!user){
                return responser.error(res, "MAIN_E001");
            }

            const token = generateTokens({ userID, roleID });
            return responser.success(res, { user, token }, "MAIN_S001");
        }

        const [ user, studio ] = await Promise.all([
            depManager.USER.getUserModel().findById(userID),
            depManager.STUDIO.getStudioModel()
                .findOne({ createdBy: userID }).lean()
        ])

        if(!user){
            return responser.error(res, "MAIN_E001");
        }

        if(!studio){
            return responser.error(res, "MAIN_E002");
        }

        const [address, documents] = await Promise.all([
            studio.address
            ? depManager.ADDRESS.getAddressModel().findById(studio.address): null,
            studio.documents
            ? depManager.DOCUMENTS.getDocumentsModel().findById(studio.documents): null
        ]) 

        studio.address = address;
        studio.documents = documents;

        const token = generateTokens({ userID, roleID });

        return responser.success(res, { user, studio, token }, "MAIN_S001");
    }catch(e){
        console.log(e);
        return responser.error(res, "GLOBAL_E001");
    }
}

module.exports = {
    fetchMainData
}