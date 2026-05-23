import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';

const Welcome = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col items-center space-y-10">
        
        {/* Logo Section */}
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-20 h-20 bg-[#2D6A4F] rounded-full flex items-center justify-center shadow-lg">
            <Leaf className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">KisanMart</h1>
          <p className="text-lg text-gray-500 text-center px-4">
            Direct from farms to your doorstep. Fresh, organic, and affordable.
          </p>
        </div>

        {/* Buttons Section */}
        <div className="w-full space-y-4">
          <Link
            to="/login"
            className="w-full flex items-center justify-center px-6 py-4 border border-transparent text-lg font-semibold rounded-xl text-white bg-[#2D6A4F] hover:bg-[#1b4332] shadow-md transition-all duration-200 transform hover:scale-[1.02]"
          >
            Login
          </Link>
          
          <Link
            to="/signup"
            className="w-full flex items-center justify-center px-6 py-4 border-2 border-[#2D6A4F] text-lg font-semibold rounded-xl text-[#2D6A4F] bg-white hover:bg-green-50 transition-all duration-200 transform hover:scale-[1.02]"
          >
            Create Account
          </Link>
        </div>

        {/* Guest Link */}
        <div className="mt-8">
          <Link to="/" className="text-gray-500 hover:text-gray-900 font-medium transition-colors">
            Continue as Guest
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Welcome;
