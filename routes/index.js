const express = require("express")

const Router = express.Router()

const booking = require("./booking")

Router.get("/status", (req,res)=>{
    res.send("routes index is running")
})
// booking router
Router.use("/bookings",booking )

module.exports = Router