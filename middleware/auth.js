const jwt = require ("jsonwebtoken")
const config = require("../config/setting-dev")

const auth = async (req,res,next)=>{
   try {
    const authHeader = req.headers.authorization
    if (!authHeader){
        return res.status(401).json({
            code : 41,
            msg : "no token provided"
        })
    }
    const token = authHeader.split(" ")[1]
    if (authHeader && token){
        const decoded = jwt.decode(token,config.secretKey) 
        if (!decoded){
            return res.status(401).json({
                code : 41,
                msg : "invalid token provided"
            })
        }
        req.users = decoded
    }
    next()
   }catch (err) {
    console.log(err)
   }
}

module.exports = auth