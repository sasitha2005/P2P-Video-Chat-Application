const { Server } = require('socket.io');
const express = require('express');
const cors = require('cors');
const http = require('http');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = ["http://localhost:3001", "https://phl94w16-3002.usw2.devtunnels.ms"];

const io = new Server(server, {
    cors: {
        origin: function (origin, callback) {
            if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type"],
        credentials: true
    }
});

app.use(cors({
    origin: function (origin, callback) {
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));

app.get("/", (req, res) => {
    res.send("Hello World");
});

const emailToSocket = new Map();
const socketToEmail = new Map();

io.on("connection", (socket) => {
    console.log(`Socket Connected: ${socket.id}`);

    socket.on("room:join", data => {
        const { email, room } = data;
        emailToSocket.set(email, socket.id);
        socketToEmail.set(socket.id, email);

        socket.join(room);
        io.to(room).emit("user:joined", { email, id: socket.id });

        // emits a 'room:joined' event back to the client 
        // that just joined the room.
        io.to(socket.id).emit("room:join", data);
    });

    socket.on("user:call", ({ to, offer }) => {
        io.to(to).emit("incoming:call", { from: socket.id, offer });
    });

    socket.on("call:accepted", ({ to, ans }) => {
        io.to(to).emit("call:accepted", { from: socket.id, ans });
    });

    socket.on("peer:nego:needed", ({ to, offer }) => {
        io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
    });

    socket.on("peer:nego:done", ({ to, ans }) => {
        io.to(to).emit("peer:nego:final", { from: socket.id, ans });
    });

    socket.on("call:end", ({ to }) => {
        io.to(to).emit("call:end", { from: socket.id });
    });

    socket.on("call:initiated", ({ to }) => {
        io.to(to).emit("call:initiated", { from: socket.id });
    });
});

server.listen(3001, () => console.log(`Server has started.`));
