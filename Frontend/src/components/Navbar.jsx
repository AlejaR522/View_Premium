import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Navbar() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault(); //evita que la pagina se recargue  
    navigate(`/search?q=${search}`);// Te envia a otra

  };

  return (
    <nav className="flex items-center justify-between px-6 py-3 bg-gray-900 text-white shadow-md">
      
      {/* Logo */}
      <h1 
        onClick={() => navigate("/")} 
        className="text-xl font-bold cursor-pointer"
      >
        ViewApp
      </h1>

      {/* Buscador */}
      <form onSubmit={handleSearch} className="flex">
        <input
          type="text"
          placeholder="Buscar usuarios..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-1 rounded-l-md text-black outline-none"
        />
        <button 
          type="submit"
          className="bg-blue-500 px-3 rounded-r-md hover:bg-blue-600"
        >
          🔍
        </button>
      </form>

      {/* Botones */}
      <div className="flex gap-3">
        <button 
          onClick={() => navigate("/profile")}
          className="bg-gray-700 px-3 py-1 rounded hover:bg-gray-600"
        >
          My Profile
        </button>

        <button 
          onClick={() => navigate("/")}
          className="bg-gray-700 px-3 py-1 rounded hover:bg-gray-600"
        >
          Home
        </button>

        <button 
          onClick={() => console.log("logout")}
          className="bg-red-500 px-3 py-1 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;