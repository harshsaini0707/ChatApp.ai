import express from 'express';
const app = express();
import dotenv from 'dotenv';
import cors from 'cors'
import { initTables } from './models/DB.model.js';
import cookieParser from 'cookie-parser'
import { authRouter } from './routes/auth.routes.js';
dotenv.config();
const PORT = process.env.PORT;


app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin:"*",
    credentials:true
}))

initTables();

app.use("/auth" , authRouter);



app.listen(PORT,()=>{
    console.log('Server Started!!');  
})