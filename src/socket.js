// src/socket.js
import { io } from "socket.io-client";

// create ONCE, reuse everywhere
export const socket = io("http://localhost:5000", {
  transports: ["websocket"],
});
