import connection from "../lib/dbConnection.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const genAI =  new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export const getChatHistory = (req, res) => {
    const { sender_id, receiver_id } = req.params;

    const query = `
        SELECT * FROM messages 
        WHERE (sender_id = ? AND receiver_id = ?) 
           OR (sender_id = ? AND receiver_id = ?)
        ORDER BY created_at ASC
    `;

    connection.query(query, [sender_id, receiver_id, receiver_id, sender_id], (err, results) => {
        if (err) {
            console.error("DB Error:", err);
            return res.status(500).json({ message: "Database error" });
        }
        res.status(200).json({ messages: results });
    });
};

export const getAllUsers = (req, res) => {
  const currentUserId = req.user.id; 

  const query = "SELECT id, name, email, created_at FROM User WHERE id != ?";
  connection.query(query, [currentUserId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error", error: err });
    }
    res.status(200).json({ users: results });
  });
};

export const aiChat = async (req, res) => {
  try {
    const { id } = req.user;
    const { text } = req.body;
    let history = "";

    const query1 = "SELECT message, ai_response FROM aiChat WHERE user_id = ? ";
    connection.query(query1, [id], async (err, results) => {
      if (err) {
        return res.status(500).json({ message: "Database fetching Error!!" });
      }


      if (results.length > 0) {
        history = results
          .map(
            (row) => `User: ${row.message}\nAI: ${row.ai_response}`
          )
          .join("\n");
      }

      if (!text || !text.trim()) {
        return res.status(404).json({ message: "Prompt Required!!" });
      }

      let prompt = `
        you are a friendly chatbot that acts as a friend of user and helps them in queries. 
        If user asks to act or chat like a certain character you must act like that character. 
        Otherwise act like a normal friend. 
        Don't just give answer in plain text — ,* , => , $ , # , & , !  use bullet points and also cool emojis. 
        Context:\n${history || "No history, treat as new chat."}
      `;

      try {
        const ai_response = genAI.getGenerativeModel({
          model: "gemini-1.5-flash",
        });
        const result = await ai_response.generateContent(prompt);
        const reply = result.response.text();

       
        const query2 =
          "INSERT INTO aiChat (user_id, message, ai_response) VALUES (?, ?, ?)";
        connection.query(query2, [id, text, reply], (err) => {
          if (err) {
            console.error("DB Insert Error:", err);
            return res.status(500).json({ message: "Database Error!" });
          }

          return res.status(200).json({
            message: "Chat saved successfully!!",
            data: { id, message: text, ai_response: reply },
          });
        });
      } catch (error) {
        return res.status(500).json({ message: "AI Generation Error!!" });
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error!!" });
  }
};


export const aiChatHistory = async(req,res)=>{
  try {
    const {id} =  req.user;

    const query = 'SELECT id , user_id , message, ai_response ,  created_at FROM aiChat Where user_id = ? ORDER BY created_at ASC ';
    connection.query(query , [id] , (err ,  response)=>{
      if(err) return res.status(500).json({message : 'DB query Error!!'});

      else return res.status(200).json({chat : response })
    })

    
  } catch (error) {
    return res.status(500).json({message:"Internal Server Error!!"})
  }
}