// src/socket.js
import { io } from "socket.io-client";

// create ONCE, reuse everywhere
export const socket = io("https://astracare-backend.onrender.com/", {
  transports: ["websocket"],
});
