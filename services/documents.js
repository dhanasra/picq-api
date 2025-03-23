const depManager = require("../core/depManager");
const responser = require("../core/responser");
const { uploadFile } = require("../core/utils");


async function create(req, res) {
  try {
    const { userID } = req;

    const { identityType, bankInfo, panNumber, gstin } = req.body;

    const identity = req?.files?.identityPicture;
    const pancard = req?.files?.pancardPicture;
    const businessCertificate = req?.files?.businessCertificate;

    const [ identityPicture, pancardPicture, businessCertificatePicture ] = await Promise.all([
        identity ? uploadFile(`${userID}/picture/`, identity) : null,
        pancard ? uploadFile(`${userID}/picture/`, pancard) : null,
        businessCertificate ? uploadFile(`${userID}/picture/`, businessCertificate) : null
    ]) 
     
    const data = {
        identity: {
            type: identityType,
            picture: identityPicture
        },
        gstin: {
            isRegistered: gstin!=null,
            number: gstin
        },
        panCard: {
            number: panNumber,
            picture: pancardPicture
        },
        businessCertificate: businessCertificatePicture,
        bankInfo,
        createdAt: Date.now()
    }

    const document = await depManager.DOCUMENTS.getDocumentsModel().create(data);

    return responser.success(res, document, "STUDIO_S001");
  } catch (error) {
    console.error("Error creating studio:", error);
    return responser.error(res, null, "R001");
  }
}

async function update(req, res) {
    try {
        const { documentID } = req.params;
        const { identityType, bankInfo, panNumber, gstin } = req.body;
        const document = await depManager.DOCUMENTS.getDocumentsModel().findById(documentID);

        if (!document) return responser.error(res, null, "DOCUMENT_NOT_FOUND");

        const files = req?.files || {};
        const uploadPaths = {
            identity: files.identityPicture ? uploadFile(`${userID}/picture/`, files.identityPicture) : null,
            pancard: files.pancardPicture ? uploadFile(`${userID}/picture/`, files.pancardPicture) : null,
            businessCertificate: files.businessCertificate ? uploadFile(`${userID}/picture/`, files.businessCertificate) : null,
        };

        const [identityPicture, pancardPicture, businessCertificatePicture] = await Promise.all(Object.values(uploadPaths));

        document.identity = {
            identityType: identityType ?? document.identity?.identityType,
            picture: identityPicture ?? document.identity?.picture
        };
        document.panCard = {
            number: panNumber ?? document.panCard?.number,
            picture: pancardPicture ?? document.panCard?.picture
        };
        if (gstin) document.gstin = { isRegistered: true, number: gstin };
        if (businessCertificatePicture) document.businessCertificate = businessCertificatePicture;
        if (bankInfo) document.bankInfo = bankInfo;

        await document.save();
        return responser.success(res, document, "STUDIO_S001");
    } catch (error) {
        console.error("Error updating document:", error);
        return responser.error(res, null, "R001");
    }
}


module.exports = {
    create,
    update
}