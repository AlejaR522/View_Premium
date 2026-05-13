import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Admin from "./pages/Admin";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import MyProfile from "./pages/MyProfile";
import ProtectedRoute from "./components/ProtectedRoute"; 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* Rutas públicas */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Rutas Users */}
        <Route path="/home" element={<Home/>}/>
        <Route path="/profile/:id" element={<Profile />}/>
        <Route path="/me" element={<MyProfile />}/>

        {/* Ruta admin */}
        <Route
          path="/Admin"
            element={
          <ProtectedRoute>
            <Admin />
          </ProtectedRoute>}/>

        {/* Redirección si no existe la ruta */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
