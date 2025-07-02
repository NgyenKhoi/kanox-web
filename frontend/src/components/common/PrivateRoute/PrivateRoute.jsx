import { useContext } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { Navigate } from "react-router-dom";

function PrivateRoute({ children }) {
    const { token, loading } = useContext(AuthContext);

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center min-vh-100">
            <div className="spinner-border text-primary" role="status" />
        </div>
    ); 

    return token ? children : <Navigate to="/" replace />;
}

export default PrivateRoute;
