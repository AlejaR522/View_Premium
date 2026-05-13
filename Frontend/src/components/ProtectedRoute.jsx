import { getSession } from "../lib/auth";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
    const session = getSession();
    
    if (!session) return <Navigate to="/" />;
    
    return children;
}