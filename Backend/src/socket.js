import { Server } from "socket.io";
import connection from "./lib/dbConnection.js";

let onlineUsers = {}; // { userId: socketId }

export const initSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: ["http://localhost:5173", "https://chat-app-mj9inp6il-harsh-sainis-projects.vercel.app","http://localhost:5174" ,"https://chat-app-ai-self.vercel.app"],
        }
    });

    io.on("connection", (socket) => {
        console.log(`User connected: ${socket.id}`);

        socket.on("join", (userId) => {
            onlineUsers[userId] = socket.id;
            io.emit("online_users", Object.keys(onlineUsers));
        });

   socket.on("private_message", ({ sender_id, receiver_id, message }) => {
    if (!message.trim()) return;

    const query = "INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)";
    connection.query(query, [sender_id, receiver_id, message], (err, result) => {
        if (err) {
            console.error("DB Error:", err);
            return;
        }

        const newMsg = {
            id: result.insertId,   // ✅ return DB id
            sender_id,
            receiver_id,
            message,
            created_at: new Date()
        };

        // ✅ Emit to receiver if online
        if (onlineUsers[receiver_id]) {
            io.to(onlineUsers[receiver_id]).emit("receive_message", newMsg);
        }

        // ✅ Also emit back to sender (so both see same DB message)
        if (onlineUsers[sender_id]) {
            io.to(onlineUsers[sender_id]).emit("receive_message", newMsg);
        }
    });
});


        socket.on("disconnect", () => {
            for (let userId in onlineUsers) {
                if (onlineUsers[userId] === socket.id) {
                    delete onlineUsers[userId];
                    break;
                }
            }
            io.emit("online_users", Object.keys(onlineUsers));
            console.log(`User disconnected: ${socket.id}`);
        });
    });
};
