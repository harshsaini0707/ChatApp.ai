import connection from "../lib/dbConnection.js";
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
dotenv.config();

export const signUp = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password)
            return res.status(400).json({ message: "All fields required!" });

        const checkQuery = "SELECT * FROM User WHERE email = ?";
        connection.query(checkQuery, [email], async (err, result) => {
            if (err) return res.status(500).json({ message: "Internal Server Error!" });
            if (result.length > 0)
                return res.status(409).json({ message: "Email already exists!" });

        
            const hashedPassword = await bcrypt.hash(password, 10);

            const insertQuery = "INSERT INTO User (name, email, password, created_at) VALUES (?, ?, ?, NOW())";
            connection.query(insertQuery, [name, email, hashedPassword], (err, insertResult) => {
                if (err) return res.status(500).json({ message: "SQL Server Error!" });

                const newUserId = insertResult.insertId;

                const getUserQuery = "SELECT id, name, email, created_at FROM User WHERE id = ?";
                connection.query(getUserQuery, [newUserId], (err, userResult) => {
                    if (err) return res.status(500).json({ message: "Error fetching created user" });

                    const user = userResult[0];
                    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY, { expiresIn: '2d' });

                    res.cookie("token", token, {
                        httpOnly: true,
                        maxAge: 2 * 24 * 60 * 60 * 1000 
                    });

                    return res.status(201).json({
                        message: "User created and logged in successfully!",
                        user
                    });
                });
            });
        });
    } catch (error) {
        return res.status(500).send("Internal Server Error!!");
    }
};


export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(404).json({ message: "Invalid Credentials" });

        const query = "SELECT * FROM User WHERE email= ?";
        connection.query(query, [email], async (err, result) => {
            if (err) return res.status(500).json({ message: "Internal Server Error!"});
            if (result.length === 0) return res.status(404).json({ message: "No User Found!!" });

            const loggedInUser = result[0];

            const validPassword = await bcrypt.compare(password, loggedInUser.password);
            if (!validPassword) return res.status(401).json({ message: "Invalid Password!!" });

            const token = jwt.sign({ id: loggedInUser.id }, process.env.JWT_SECRET_KEY, { expiresIn: '2d' });
            if (!token) return res.status(500).json({ message: "Token creation failed" });

            res.cookie("token", token, {
                httpOnly: true,
                maxAge:2 * 24 * 60 * 60 * 1000
            });

            const { password:_, ...rest } = loggedInUser;
            return res.status(200).json({ message: "User LoggedIn Succfully!!", user: rest });
        });
    } catch (error) {
        return res.status(500).send("Internal Server Error!!");
    }
};

export const logout = async (req, res) => {
    try {
        res.cookie("token", null, {
            expires: new Date(Date.now())
        });
        return res.status(200).json({ message: "Logout Successful!!" });
    } catch (error) {
        return res.status(500).send("Internal Server Error!!");
    }
};
