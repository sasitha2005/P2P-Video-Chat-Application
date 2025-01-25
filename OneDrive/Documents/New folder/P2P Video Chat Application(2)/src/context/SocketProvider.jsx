// context/SocketProvider.js
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext).socket;
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const socketIo = io("http://localhost:3001"); // Replace with your server address
        setSocket(socketIo);

        return () => {
            socketIo.disconnect();
        };
    }, []);

    const value = useMemo(() => ({ socket }), [socket]);

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};
