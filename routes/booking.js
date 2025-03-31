const express = require("express")
const Router = express.Router()

const booking = require("../controller/booking")

const auth = require("../middleware/auth")

// create user
Router.post("/createUser" , booking.createUser)

// sighn in 
Router.post("/login" , booking.sighnIn)

// check hotels
Router.get("/checkHotels",auth,booking.checkHotels)

// book room
Router.post("/bookRoom",auth,booking.bookRoom )

// check booking with email
Router.get("/viewBooking", auth, booking.viewBooking)

// check booking with email
Router.get("/viewBooking", auth, booking.viewBooking)

// all guest
Router.get("/allGuest", auth, booking.allGuest)

// cancel room 
Router.patch("/canceledRoom", auth, booking.canceledRoom)

// Modefie Booking

Router.post("/modefiBooking", auth, booking.modefiBooking)

module.exports = Router
