const depManager = require("../core/depManager");
const responser = require("../core/responser");

async function create(req, res){
    try{
        const userID = req.userID; 
        const { addressLine1, addressLine2, city, region, country, zipcode, locationLink, studioID } = req.body;

        const address = await depManager.ADDRESS.getAddressModel().create({
            userID,
            studioID,
            addressLine1,
            addressLine2,
            city,
            region,
            country,
            zipcode,
            locationLink,
            createdAt: Date.now()   
        })

        return responser.success(res, address, "ADDRESS_S001");
    }catch(e){
        console.log(e);
        return responser.error(res, "GLOBAL_E001");
    }
}

async function update(req, res){
    try{
        const { addressID } = req.params;

        const { addressLine1, addressLine2, city, region, country, zipcode, locationLink } = req.body;

        const address = await depManager.ADDRESS.getAddressModel().findById(addressID);

        if(!address){
            return responser.error(res, null, "TOKEN_E001");
        }

        if(addressLine1){
            address.addressLine1 = addressLine1;
        }
        if(addressLine2){
            address.addressLine2 = addressLine2;
        }
        if(city){
            address.city = city;
        }
        if(region){
            address.region = region;
        }
        if(country){
            address.country = country;
        }
        if(zipcode){
            address.zipcode = zipcode;
        }
        if(locationLink){
            address.locationLink = locationLink;
        }
        
        await address.save();

        return responser.success(res, address, "ADDRESS_S001");
    }catch(e){
        console.log(e);
        return responser.error(res, "GLOBAL_E001");
    }
}

async function get(req, res){
    try{
        const { addressID } = req.params;

        const address = await depManager.ADDRESS.getAddressModel().findById(addressID);

        return responser.success(res, address, "ADDRESS_S001");
    }catch(e){
        console.log(e);
        return responser.error(res, "GLOBAL_E001");
    }
}

async function clear(req, res){
    try{
        const { addressID } = req.params;

        await depManager.ADDRESS.getAddressModel().deleteOne({_id: addressID });

        return responser.success(res, true, "ADDRESS_S001");
    }catch(e){
        console.log(e);
        return responser.error(res, "GLOBAL_E001");
    }
}

module.exports = {
    create,
    update,
    get,
    clear
}