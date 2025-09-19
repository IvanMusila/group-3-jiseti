export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="h-8 w-8 bg-gray-300 rounded-md"></div>
                <span className="ml-2 text-xl font-bold text-black">Jiseti</span>
              </div>
            </div>
            <div className="flex items-center">
              {!token ? (
                <div className="space-x-3">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-black font-medium rounded-md hover:text-yellow-950 hover:bg-orange-50 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="px-4 py-2 bg-black text-white font-medium rounded-md hover:bg-yellow-950 transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <span className="text-black">Hello, <span className="font-semibold">{user?.name}</span></span>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-red-600 font-medium rounded-md hover:text-red-800 hover:bg-red-50 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    );
}