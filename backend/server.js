const app=require("./app");
const dotenv=require("dotenv")
const connectDatabase=require("./config/database")

//handling uncaught exception
process.on("uncaughtException",(err)=>{
    console.log(`Error:${err.message}`);
    console.log("Shutting down the server due to uncaught Exception");
    process.exit(1)
})

//config
dotenv.config({path:"backend/config/config.env"})

//connect to database
connectDatabase()


server=app.listen(process.env.PORT,()=>{
    console.log(`Server is working on https://localhost:${process.env.PORT}`)
})


//unhandledRejection
process.on("unhandledRejection",(err)=>{
    console.log(`Error:${err.message}`);
    console.log("Shutting down the server due to unhandled promise rejection");
    server.close(()=>{process.exit(1)})
})