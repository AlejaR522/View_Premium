export default function Input({ placeholder, type = "text", value, onChange }) {
    return (
        <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            className="w-full border border-gray-300 px-3 py-2.5 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition sm:px-4 sm:py-3 md:px-5 md:py-3.5"
        />
    );
}