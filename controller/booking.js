const express = require("express")
const Router = express.Router()
const joi = require("joi")
const { PrismaClient } = require('@prisma/client')
const config = require("../config/setting-dev")
const bcrypt = require("bcrypt")
const Joi = require("joi")
const jwt = require("jsonwebtoken")
const moment = require("moment-timezone");

const prisma = new PrismaClient()

module.exports = {

    // create user
  async createUser(req,res){
        const schema = joi.object({
            name : joi.string().required(),
            contact_no: joi.string().required(),
            email :  joi.string().required(),
            password : joi.string().required(),
        })
        const data = req.body
        const {error,value } = schema.validate(data)
        if (error){
            console.log("error",error.details[0].message)
            res.status(400).json({
                err : error.details[0].message
            })
            return
        }
        const {name, contact_no, email, password} = value
   
        try {

            // user check
            const userCheck = await prisma.users.findFirst({
                select : {
                    name : true,
                    email : true,
                    contact_no : true
                },
                where : {
                    OR : [
                        {
                            email : email
                        },
                        {
                            contact_no : contact_no
                        }
                    ]
                }
            })

            if (userCheck){

                // if email is same
                if (userCheck.email == email){
                    return res.status(400).json({
                        code : 31,
                        msg : "user already exist with same email ", 
                    })
                }

                  // if mobile is same
                  if (userCheck.contact_no == contact_no){
                    return res.status(400).json({
                        code : 31,
                        msg : "user already exist with same mobile ", 
                    })
                }
            }
            const hasPassword = await bcrypt.hash(password,parseInt(config.saltRounds))
            data.password = hasPassword           
           // create user
            const userCreate = await prisma.users.create({
                data : data
            })
     
            res.status(200).json({
                code : 20,
                msg : "user created succesfully",
                data : userCreate
            })
        }
        catch (err) {
            console.log(err)
        } 
    },

    // sighn in 

    async sighnIn(req,res){
        const schema = Joi.object({
            email : joi.string().required(),
            password : joi.string().required()
        })

        const data = req.body
        const {value, error} = schema.validate(data)
        if (error){
            console.log("error in log in schema", error.message[0].details)
            return res.status(400).json({
                code : 41,
                err : error.message[0].details
            })
        }

        const {email, password} = value
       try {

        // check user 
        const checkUser = await prisma.users.findFirst({
            where : {
                email : email
            }
        })
        // if no user
        if (!checkUser){
            return res.status(400).json({
                code : 42,
                msg : "no user found"
            })
        }
        // if wrong password

        const checkPassword = await bcrypt.compare(password,checkUser.password)
        if (checkPassword == false){
            return res.status(400).json({
                code : 43,
                msg : "invalid credential"
            })
        }

        // generate tocken 
        const token = jwt.sign(
            {
                user_id : checkUser.id,
                email : checkUser.email,
                is_active : checkUser.is_actuve,
                mobile: checkUser.contact_no
            },
            config.secretKey,
            {
                expiresIn : config.jwtExpiry
            }
        )
        checkUser.token = token
        delete checkUser.password
        delete checkUser.is_actuve
        delete checkUser.id
  
 
        return res.status(200).json({
            code : 20,
            msg : "user sign in succesfully",
            data : checkUser
        })
       }
       catch (err){
        console.log("error in sign in api", err)
       }
    },

    // check hotels
    async checkHotels (req,res){
        const {city_id, checkIn, checkOut,date,hotel_id,room_id} = req.query
        const limit = req.query.limit || 10
        const offset = req.query.offset || 0
        if(!city_id){
            return res.status(400).json({
                code: 41,
                msg : "please pass city details"
            })
        }
                
        //
        // const checkInDateTimes = new Date(`${date.split("-").reverse().join("-")}T${checkIn}:00.000Z`); 
        // const checkOutDateTimes = new Date(`${date.split("-").reverse().join("-")}T${checkOut}:00.000Z`);

        // Convert booking date and time to UTC format using moment
        const checkInSplit = checkIn.split(":")
        const checkOutSplit = checkOut.split(":")
        const checkInDateTime = moment(date, "DD-MM-YYYY")
        .set({ hour: parseInt(checkInSplit[0]), minute: parseInt(checkInSplit[1]) || 0, second: parseInt(checkInSplit[2]) || 0})
        .utc()
        .toISOString();
        // const checkInDateTimes = moment(date, "DD-MM-YYYY")
        // .set({ hour: 6, minute: 0, second: 0, millisecond: 0 })
        // .utc()
        // .toISOString();


        const checkOutDateTime = moment(date, "DD-MM-YYYY")
        .set({ hour: parseInt(checkOutSplit[0]), minute: parseInt(checkOutSplit[1]) || 0, second: parseInt(checkOutSplit[2]) || 0})
        .utc()
        .toISOString();
        
        try {     
            // check assighn hotel 
            const checkAssignment = await prisma.guest.findMany({
                where : {
                    // room_id : parseInt(room_id),
                    // hotel_id : parseInt(hotel_id),
                    city_id : parseInt(city_id),
                    is_active: true,
                    check_in :{
                        lte : checkOutDateTime
                    },
                    check_out: {
                        gte : checkInDateTime
                    }
                },
                select: {
                   room_id : true,
                   hotel_id : true
                }
            })

           //  Group booked rooms per hotel
                const bookedRoomsByHotel = {};
                checkAssignment.forEach(({ hotel_id, room_id }) => {
                    if (!bookedRoomsByHotel[hotel_id]) {
                        bookedRoomsByHotel[hotel_id] = new Set();
                    }
                    bookedRoomsByHotel[hotel_id].add(room_id);
                });         
           
            // check all hotels 
            const allHotelRooms = await prisma.rom_hotel_assignment.findMany({
                select :{
                    room_id : true,
                    hotel_id : true,
                },
                where : {
                    city_id : parseInt(city_id),
                    is_active : true
                }
            }) 

            // check fully booked 
            const hotelRoomsMap  = new Set()
            allHotelRooms.forEach(({ hotel_id, room_id }) => {
                if (!hotelRoomsMap[hotel_id]) {
                    hotelRoomsMap[hotel_id] = new Set();
                }
                hotelRoomsMap[hotel_id].add(room_id);
            });


            // Identify fully booked hotels
            const fullyBookedHotels = new Set();
            for (const hotelId in bookedRoomsByHotel) {
                if (
                    hotelRoomsMap[hotelId] &&
                    bookedRoomsByHotel[hotelId].size === hotelRoomsMap[hotelId].size
                ) {
                    fullyBookedHotels.add(parseInt(hotelId)); // Mark hotel as fully booked
                }
        } 


           //  Fetch available hotels (excluding fully booked hotels)
                const checkHotel = await prisma.rom_hotel_assignment.findMany({
                    skip : parseInt(offset),
                    take : parseInt(limit),
                    distinct: ['hotel_id'],
                    orderBy : {
                        hotels : {
                            id : "desc"
                        }
                    },
                    select: {
                        hotels: {
                            select: {
                                id: true,
                                name: true,
                                details: true,
                                picture: true,
                                // rom_hotel_assignment: {
                                //     select: {
                                //         room_id: true,
                                //         room_details: true,
                                //         picture: true,
                                //         is_active: true
                                //     }
                                // }
                            }
                        }
                    },
                    where: {
                        hotel_id : { notIn: Array.from(fullyBookedHotels) },
                        city_id : parseInt(city_id),
                        NOT: {
                            AND: checkAssignment.map(({ room_id, hotel_id }) => ({
                                hotel_id: hotel_id,
                                room_id: room_id
                            }))
                        }
                    }
                });

       // count hotels 
       const countHotel = await prisma.rom_hotel_assignment.groupBy({
        by: ['hotel_id'],
        where: {
            hotel_id : { notIn: Array.from(fullyBookedHotels) },
            city_id : parseInt(city_id),
            NOT: {
                AND: checkAssignment.map(({ room_id, hotel_id }) => ({
                    hotel_id: hotel_id,
                    room_id: room_id
                }))
            }
        }
    });


            return res.status(200).json({
                code : 20,
                msg : "hotel found",
                totalHotels: countHotel.length || 0,
                data : checkHotel ,
            })
        }catch (err) {
            console.log("error in fetch hotel api ", err)
        }
    },

    // check Rooms

    async bookRoom (req,res){
        
        const schema = joi.object({
            city_id : joi.number().required(),
            hotel_id: joi.number().required(),
            checkIn : joi.any().required(),
            checkOut: joi.any().required(),
            date : joi.date().required()
        })
        const data = req.body
        const {value, error} = schema.validate(data)
        if (error){
            console.log(` error in schema ${error.details[0].message}`)
            return res.status(400).json({
                code : 41,
                msg : error.details[0].message
            })
        }
        const {city_id, checkIn, checkOut,date,hotel_id} = value
          // Convert booking date and time to UTC format using moment
        //   const checkInSplit = checkIn.split(":")
        //   const checkOutSplit = checkOut.split(":")
        //   const checkInDateTimes = moment(date, "DD-MM-YYYY")
        //   .set({ hour: parseInt(checkInSplit[0]), minute: parseInt(checkInSplit[1]) || 0, second: parseInt(checkInSplit[2]) || 0})
        //   .utc()
        //   .toISOString();
        
        //   const checkOutDateTimes = moment(date, "DD-MM-YYYY")
        //   .set({ hour: parseInt(checkOutSplit[0]), minute: parseInt(checkOutSplit[1]) || 0, second: parseInt(checkOutSplit[2]) || 0})
        //   .utc()
        //   .toISOString();
          const checkInDateTime = moment(checkIn).utc().toISOString()
          const checkOutDateTime = moment(checkOut).utc().toISOString()
        try {
            // fetch booked room 
             const bookedRoom = await prisma.guest.findMany({
                select : {
                    room_id : true,
                },
                where : {
                    hotel_id: parseInt(hotel_id),
                    city_id : parseInt(city_id),
                    is_active : true,
                    OR: [ 
                        { check_in: { lte: checkOutDateTime } }, 
                        { check_out: { gte: checkInDateTime } } 
                    ]
                }
             })

             console.log(bookedRoom, "bookedRoom" )
        // fetch unique room 
             const uniqueRoom = await prisma.rom_hotel_assignment.findMany({
                select : {
                    room_id : true
                },
                where : {
                    hotel_id : parseInt(hotel_id),
                    is_active : true,
                    city_id : parseInt(city_id),
                    room_id : {
                        notIn : bookedRoom.map((x)=> x.room_id)
                    }
                }
             })
             console.log(uniqueRoom, "uniqueRoom")

           
             
             // create booking 
             const data = {
                user_id : req.users.user_id,
                room_id : uniqueRoom[0].room_id,
                hotel_id: parseInt(hotel_id),
                city_id: parseInt(city_id),
                check_in : checkInDateTime,
                check_out : checkOutDateTime,
                booking_date: moment(date,"DD-MM-YYYY").toISOString()
             }

             const checkInMoment = moment(checkInDateTime);
             const checkOutMoment = moment(checkOutDateTime);
             const durationHours = checkOutMoment.diff(checkInMoment, 'hours', true);
            
             const createBooking = await prisma.guest.create({
                data ,
                select : {
                    users : {
                        select : {
                            name : true,
                            email : true,
                            contact_no : true
                        }
                    },
                    id : true,
                    hotels : {
                        select : {
                            name : true,
                            details : true
                        }
                    },
                    room_id : true,
                    check_in : true,
                    check_out : true
                }
             })
             createBooking.stayDuration = durationHours +" " +"Hours"
             return res.status(200).json({
                code: 20 ,
                msg : "hotel booked succesfully",
                data : createBooking
             })
        }catch(err){
            console.log (err, "error in room booking")
        }
    },

    // view Booking
    async viewBooking(req,res){
        const {email} = req.query
        if (!email){
            return res.status(400).json({
                code: 41,
                msg : "Emaail is required"
            })
        }
        try {
            // check booking 
              const booking = await prisma.guest.findMany({
                select :{
                    id: true,
                    city : true,
                    hotels : true,
                    room_id : true,  
                },
                where : {
                    is_active : true,
                    users : {
                        email : email
                    }
                }
              })

        // result 
        return res.status(200).json({
            code : 20,
            msg :"view all booking Succesfully ",
            data : booking
        })
        }catch (err){
            console.log(err)
        }
    },

    // all guest
    async allGuest(req,res){
        try {
            // all guest
            const allGuest = await prisma.guest.findMany({
                select : {
                    id : true,
                    city : true,
                    hotels : true,
                    room_id : true,
                    check_in: true,
                    check_out : true
                },
                where : {
                    is_active : true,
                    check_out : {
                      gte : moment()  
                    }
                }
            })

            return res.status(200).json({
                code : 20,
                msg : " All stayed gues in hotel",
                data : allGuest
            })
        }
        catch(err){
            console.log(err)
        }
    },

    // canceled room
    async canceledRoom (req, res){
        const {booking_id} = req.query
        if (!booking_id){
            return res.status(400).json({
                code : 41,
                msg : "Booking Id required"
            })
        }

        try{
            // cancel room 
             const checkRoom = await prisma.guest.findFirst({
                where : {
                    id : parseInt(booking_id),
                    is_active : true
                }
             })
            
             if (!checkRoom){
                return res.status(400).json({
                    code : 42,
                    msg : "no booking found"
                })
             }

             // cancel booking
             const cancelBooking = await prisma.guest.update({
                data : {
                    is_active : false
                },
                where : {
                    id : parseInt(booking_id)
                }
             })

             return res.status(200).json({
                code : 20,
                msg : "room cancelled succesfully",
                data : cancelBooking
             })
        }
        catch (err){
            console.log(err)
        }
    },

    // modefie Booking 
     async modefiBooking (req, res){
        const schema = joi.object({
            booking_id : joi.number().required(),
            checkIn : joi.any().required(),
            checkOut : joi.any().required()
        })

        const data = req.body
        const {value, error} = schema.validate(data)
        if (error){
            return res.status(400).json({
                code : 41,
                msg : error.details[0].message
            })
        }

        const {booking_id, checkIn, checkOut} = value

        try {
            // checkBooking 
            const checkBooking = await prisma.guest.findFirst({
                where : {
                    id : parseInt(booking_id),
                    is_active : true
                }
            })

            if (!checkBooking ){
            return res.status(400).json({
                    code : 42,
                    msg : "no booking found"
                })
            }

            //if same room  check booking than update 
             const checkRoom = await prisma.guest.findMany({
                where: {
                    NOT : {
                        id : checkBooking.id
                    },
                    hotel_id : checkBooking.hotel_id,
                    city_id : checkBooking.city_id,
                    is_active : true,
                    check_out : {
                        gte : moment(checkIn).utc().toISOString()
                    } 
                    
                }
             }) 
             // assighn same room if empty than updqte chechin
             if (checkRoom.length < 1){
                const result = await prisma.guest.update({
                    select : {
                        users : {
                            select : {
                                name : true,
                                email : true,
                                contact_no : true
                            }
                        },
                        id : true,
                        hotels : {
                            select : {
                                name : true,
                                details : true
                            }
                        },
                        room_id : true,
                        check_in : true,
                        check_out : true
                    },
                    data : {
                        check_in : moment(checkIn).utc().toISOString(),
                        check_out : moment(checkOut).utc().toISOString(),
                        updated_at : moment()
                    },
                    where : {
                        id : checkBooking.id 
                    }
                })
                return res.status(200).json({
                    code : 20 ,
                    msg : "Check In time updated succesfully",
                    result : result
                })
             }
            else
             // if not same room than check any available room 
             {
                 
                const availableRoom = await prisma.rom_hotel_assignment.findMany({
                    where: {
                        room_id: {
                            notIn: checkRoom.map((x) => x.room_id) 
                        },
                        hotel_id: checkRoom[0].hotel_id,
                        city_id: checkRoom[0].city_id,
                        is_active : true,
                    }
                 })  
                 // if no room is available 
                 if (availableRoom.length < 1){
                    console.log("no room is available for this time")
                    return res.status(200).json({
                        code : 25,
                        msg : "no room is available for this time"
                    })
                 }
                 // change room with new check in time
                 else {
                    const result = await prisma.guest.update({
                        select : {
                            users : {
                                select : {
                                    name : true,
                                    email : true,
                                    contact_no : true
                                }
                            },
                            id : true,
                            hotels : {
                                select : {
                                    name : true,
                                    details : true
                                }
                            },
                            room_id : true,
                            check_in : true,
                            check_out : true
                        },
                        data : {
                            check_in : moment(checkIn).utc().toISOString(),
                            check_out : moment(checkOut).utc().toISOString(),
                            room_id : availableRoom[0].room_id,
                            updated_at : moment()
                        },
                        where : {
                            id : checkBooking.id 
                        }
                    })
                    console.log("Check In time updated succesfully with different room")
                    return res.status(200).json({
                        code : 20 ,
                        msg : "Check In time updated succesfully with different room",
                        result : result
                    })
                 }
             }
        }
        catch (err){
            console.log(err)
        }
     }

}