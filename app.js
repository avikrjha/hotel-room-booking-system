const express = require("express")
const server = require("./config/setting-dev")
const router = require("./routes/index")
const app = express()


// for body parser
app.use(express.json())
app.use(express.urlencoded({ extended: true }));

// importing index
app.use("/api/v1",router)


app.listen(server.port,()=>{
    console.log(` server is listioning on localhost ${server.port}`)
})