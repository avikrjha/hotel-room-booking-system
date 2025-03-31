const dotenv = require("dotenv")
dotenv.config()

module.exports = {
    port : process.env.PORT || 3000,
    saltRounds : process.env.SALT_ROUND,
    secretKey : process.env.SECRET_KEY,
    jwtExpiry : process.env.JWTEXPIRED
}