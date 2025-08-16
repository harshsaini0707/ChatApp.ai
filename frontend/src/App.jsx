import React from 'react';
import { BrowserRouter , Route , Routes } from 'react-router';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Chats from './pages/Chats';
const App = () => {
  return (
    <BrowserRouter>
    
    <Routes>
       <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login/>} />
      <Route path="/signup" element={<SignUp/>} />
      <Route path="/chat" element={<Chats/>} />
    </Routes>
    </BrowserRouter>
  );
};

export default App;
