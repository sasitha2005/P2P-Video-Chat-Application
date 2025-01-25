import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useSocket } from '@/context/SocketProvider';

const RoomScreen = () => {
    const router = useRouter();
    const { room } = router.query;
    const socket = useSocket();
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const [email, setEmail] = useState('');
    let localStream;
    let peerConnection;

    useEffect(() => {
        // Get local video and audio stream
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                localStream = stream;
                localVideoRef.current.srcObject = stream;
            })
            .catch(error => {
                console.error('Error accessing media devices.', error);
                alert('Camera and microphone access are required.');
            });

        // Join room on mount if socket is available
        if (socket && room) {
            const storedEmail = localStorage.getItem('email');
            setEmail(storedEmail);
            socket.emit('room:join', { email: storedEmail, room });

            // Socket event listeners
            socket.on('user:joined', data => {
                createPeerConnection(data.email);
            });

            socket.on('incoming:call', ({ from, offer }) => {
                createPeerConnection(from);
                peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
                    .then(() => peerConnection.createAnswer())
                    .then(answer => peerConnection.setLocalDescription(answer))
                    .then(() => {
                        socket.emit('call:accepted', { to: from, ans: peerConnection.localDescription });
                    });
            });

            socket.on('call:accepted', ({ from, ans }) => {
                peerConnection.setRemoteDescription(new RTCSessionDescription(ans));
            });

            socket.on('peer:nego:needed', ({ from, offer }) => {
                peerConnection.addIceCandidate(new RTCIceCandidate(offer));
            });

            socket.on('peer:nego:final', ({ from, ans }) => {
                peerConnection.addIceCandidate(new RTCIceCandidate(ans));
            });

            return () => {
                socket.off('user:joined');
                socket.off('incoming:call');
                socket.off('call:accepted');
                socket.off('peer:nego:needed');
                socket.off('peer:nego:final');
            };
        }
    }, [socket, room]);

    const createPeerConnection = (peerEmail) => {
        peerConnection = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        peerConnection.addStream(localStream);

        peerConnection.onicecandidate = event => {
            if (event.candidate) {
                socket.emit('peer:nego:needed', { to: peerEmail, offer: event.candidate });
            }
        };

        peerConnection.onaddstream = event => {
            remoteVideoRef.current.srcObject = event.stream;
        };

        createOffer(peerEmail);
    };

    const createOffer = (peerEmail) => {
        peerConnection.createOffer()
            .then(offer => peerConnection.setLocalDescription(offer))
            .then(() => {
                socket.emit('user:call', { to: peerEmail, offer: peerConnection.localDescription });
            })
            .catch(error => console.error('Error creating offer: ', error));
    };

    return (
        <div>
            <h1>Room: {room}</h1>  {/* Display the room number */}
            <video ref={localVideoRef} autoPlay playsInline></video>
            <video ref={remoteVideoRef} autoPlay playsInline></video>
        </div>
    );
};

export default RoomScreen;
