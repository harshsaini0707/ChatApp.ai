import connection from "../lib/dbConnection.js";

const createUserTable =`
CREATE TABLE IF NOT EXISTS User(
id INT AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(200) ,
email VARCHAR(200)  NOT NULL UNIQUE,
password VARCHAR(200) NOT NULL CHECK(CHAR_LENGTH(password) >=2),
created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
`;

const createMessageTable =`
  CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT  PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id     INT NOT NULL,
    message TEXT NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES User(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES User(id) ON DELETE CASCADE
  )

`;

const createAIChatTable = `
  CREATE TABLE IF NOT EXISTS aiChat(
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    ai_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE
  )
`;


export function initTables(){
    
    connection.query(createUserTable , (err)=>{
        if(err)console.log('Error while creating User Table' , err);
        else console.log("User Table Created Successfullyy"); 
    });

    connection.query(createMessageTable , (err)=>{
        if(err)console.log('Error while creatin message Table' , err);
        else console.log("message Table Created Successfullyy");      
    });

    connection.query(createAIChatTable , (err)=>{
        if(err)console.log('Error while creating ai Table' , err);
        else console.log("ai Table Created Successfullyy"); 
    });

}