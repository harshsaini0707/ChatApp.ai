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

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Prompt required!" });
    }

  
    const query = "SELECT message, ai_response FROM aiChat WHERE user_id = ? ORDER BY created_at ASC";
    connection.query(query, [id], async (err, rows) => {
      if (err) {
        console.error("DB Fetch Error:", err);
        return res.status(500).json({ message: "Database fetching Error!!" });
      }

      let history = rows
        .map(r => `User: ${r.message}\nAI: ${r.ai_response}`)
        .join("\n");

      
     let prompt = `
You are a friendly chatbot who acts like a supportive friend. 

# Rules for Behavior:
- If the user asks you to act like a specific character (e.g. Dora, Elon Musk, SpongeBob, etc.), 
  you must **stay fully in that character** throughout the conversation.
- Always use fun styles like bullet points (*, -, #) and emojis 🎉😄✨ to make replies lively.
- Keep answers natural, conversational, and context-aware.
- If someone asks "how are you built?" or similar, always reply: "I am built by Harsh Saini." 👨‍💻
- Use the past conversation for context, and continue from where it left off.

# Conversation so far:
${history}

# Now continue the chat
User: ${text}
AI:
`;


      const ai_response = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await ai_response.generateContent(prompt);
      const reply = result.response.text();

     
      const insert = "INSERT INTO aiChat (user_id, message, ai_response) VALUES (?, ?, ?)";
      connection.query(insert, [id, text, reply], (err) => {
        if (err) {
          console.error("DB Insert Error:", err);
          return res.status(500).json({ message: "Database Error!" });
        }

        return res.status(200).json({
          message: "Chat saved successfully!!",
          data: { id, message: text, ai_response: reply }
        });
      });
    });
  } catch (error) {
    console.error("AI Chat Error:", error);
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