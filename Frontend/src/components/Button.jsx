export default function Button({ text, onClick, disabled = false }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="w-full bg-black text-white px-4 py-2.5 text-sm sm:text-base rounded-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed sm:px-5 sm:py-3 md:px-6 md:py-3.5"
        >
            {text}
        </button>
    );
}