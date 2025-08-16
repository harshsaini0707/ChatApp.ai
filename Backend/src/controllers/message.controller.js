import connection from "../lib/dbConnection.js";

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
