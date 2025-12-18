import Link from "next/link";

export default function Home() {
  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="flex flex-col items-center gap-6 p-8 rounded-lg shadow-xl bg-white">
        <h1 className="text-3xl font-bold mb-4">Hello, Dunia!</h1>
        <div className="flex flex-col gap-4 w-full">
          <Link
            href="./login"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-3 rounded transition-colors text-center font-medium shadow"
          >
            Login Customer
          </Link>
          <Link
            href="./staff"
            className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-3 rounded transition-colors text-center font-medium shadow"
          >
            Login Staff
          </Link>
        </div>
      </div>
    </div>
  );
}
