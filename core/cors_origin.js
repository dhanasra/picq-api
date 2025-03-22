
function cors_origin() {
    return async (req, res, next) => {
        try {
            // res.setHeader("X-XSS-Protection", "1; mode=block");

            // const _whitelist = process.env.ORIGIN_WHITELIST.toString().replace(/\s/g, "");
            // const allowedOrigins = _whitelist.split(',');
            // const origin = req.headers.origin ?? req.headers.host;

            // // Check if the origin matches any of the allowed origins
            // const originMatches = allowedOrigins.some(allowedOrigin => {
            //     if (allowedOrigin === origin || allowedOrigin === `https://${origin}` ||
            //         allowedOrigin === `http://${origin}`) {
            //         return true;
            //     }
            //     // You can use regex to match subdomains
            //     const regex = new RegExp(allowedOrigin.replace("*", ".*"));
            //     return regex.test(origin);
            // });
            // if (originMatches) {
            //     res.setHeader('Access-Control-Allow-Origin', origin);
            // } else {
            //     const _errorResponse = {
            //         status: "error",
            //         message: "Not allowed by CORS",
            //         messageCode: "G_E001",
            //     }
            //     return res.status(403).send(_errorResponse);
            // }
            
            res.setHeader('Access-Control-Allow-Origin', '*');

            next();
        } catch (err) {
            next(err);
        }
    };
}

module.exports = cors_origin;