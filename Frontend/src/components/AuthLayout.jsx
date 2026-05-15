export default function AuthLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col md:flex-row bg-white md:bg-black">
        
            {/* Lado izquierdo (negro) */}
            <div className="hidden md:flex w-full md:w-1/2 bg-black text-white flex-col justify-center items-center px-4 py-8 md:p-10">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-3 md:mb-4 text-center">View</h1>
                <p className="text-base md:text-lg text-gray-300 text-center max-w-xs">
                    Tu mini red social 
                </p>
            </div>

            {/* Lado derecho (blanco) - En móvil es visible desde el inicio */}
                <div className="w-full md:w-1/2 bg-white  flex flex-col justify-center items-center px-3 py-6 sm:px-4 sm:py-8 md:p-10 min-h-screen">
                {/* Logo móvil */}
                <div className="md:hidden mb-6 sm:mb-8 text-center">
                    <h1 className="text-3xl sm:text-4xl font-bold text-black mb-1 sm:mb-2">View</h1>
                    <p className="text-xs sm:text-sm text-gray-600">Tu mini red social</p>
                </div>
                
                {children}
            </div>

        </div>
    );
}