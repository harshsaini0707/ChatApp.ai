import express from 'express';
const app = express();
import dotenv from 'dotenv';
import cors from 'cors'
import { initTables } from './models/DB.model.js';
import cookieParser from 'cookie-parser'
import { authRouter } from './routes/auth.routes.js';
import http from 'http';
import { initSocket } from './socket.js';
import meesageRouter from './routes/message.routes.js';
dotenv.config();
const PORT = process.env.PORT;  

const server = http.createServer(app);
initSocket(server);

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin:["http://localhost:5173","http://localhost:5174" ,"https://chat-app-ai-self.vercel.app",
        "https://chat-app-mj9inp6il-harsh-sainis-projects.vercel.app",'http://localhost:5175'
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    credentials:true
}))

initTables();

app.use("/auth" , authRouter);
app.use("/messages", meesageRouter);



server.listen(PORT,()=>{
    console.log('Server Started!!');  
})