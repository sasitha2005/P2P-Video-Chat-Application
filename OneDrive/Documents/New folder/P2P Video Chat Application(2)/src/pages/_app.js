// pages/_app.js
import { SocketProvider } from '@/context/SocketProvider';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
    return (
        <SocketProvider>
            <Component {...pageProps} />
        </SocketProvider>
    );
}

export default MyApp;
