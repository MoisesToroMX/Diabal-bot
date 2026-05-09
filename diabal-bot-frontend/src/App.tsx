import { Route, Routes, Navigate } from "react-router-dom";

import ChatContainer from "@/pages/chats/chatsContainer";
import ChatsIndex from "@/pages/chats/chatIndex";
import Chat from "@/pages/chats/chat";

function App() {
  return (
    <Routes>
      <Route element={<Navigate replace to="/chats" />} path="/" />
      <Route element={<ChatContainer />} path="/chats">
        <Route index element={<ChatsIndex />} />
        <Route element={<Chat />} path=":chatId" />
      </Route>

      <Route element={<Navigate replace to="/chats" />} path="*" />
    </Routes>
  );
}

export default App;
