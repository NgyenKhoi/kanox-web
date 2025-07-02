    import React from "react";
    import ReactDOM from "react-dom/client";
    import "bootstrap/dist/css/bootstrap.min.css";
    import "bootstrap-icons/font/bootstrap-icons.css";
    import "./index.css"; // Đặt sau Bootstrap
    import App from "./App";
    import reportWebVitals from "./reportWebVitals";
    import { GoogleOAuthProvider } from "@react-oauth/google";
    
    // Polyfill process
    import process from 'process';
    window.process = process;

    const root = ReactDOM.createRoot(document.getElementById("root"));
    if (!root) {
        console.error("Root element not found");
        throw new Error("Root element not found");
    }

    root.render(
        <React.StrictMode>
            <GoogleOAuthProvider clientId="233866118973-t26ue94egg2v1reebqpe684kglf0bjej.apps.googleusercontent.com">
                <App />
            </GoogleOAuthProvider>
        </React.StrictMode>
    );

    reportWebVitals();