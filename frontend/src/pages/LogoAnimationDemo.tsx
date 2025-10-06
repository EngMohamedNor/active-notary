import React from 'react';
import longLogo from "../assets/long-logo.png";
import '../styles/logo-animations.css';

const LogoAnimationDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
        {/* Login Style Logo */}
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-8 text-gray-800 dark:text-white">Login Page Style</h3>
          <div className="flex items-center justify-center">
            <div className="relative group logo-container">
              {/* Animated background glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full blur-lg opacity-30 animate-pulse"></div>
              
              {/* Rotating ring around logo */}
              <div className="absolute inset-0 rounded-full border-2 border-transparent bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 animate-spin" style={{animationDuration: '8s'}}></div>
              
              {/* Pulsing inner ring */}
              <div className="absolute inset-2 rounded-full border border-blue-400/50 animate-ping"></div>
              
              {/* Orbiting particles */}
              <div className="absolute inset-0 w-full h-full">
                <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-blue-400 rounded-full particle-orbit opacity-60" style={{animationDelay: '0s'}}></div>
                <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-indigo-400 rounded-full particle-orbit-reverse opacity-60" style={{animationDelay: '1s'}}></div>
                <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-purple-400 rounded-full particle-orbit opacity-60" style={{animationDelay: '2s'}}></div>
              </div>
              
              {/* Main logo with custom animations */}
              <img 
                src={longLogo} 
                alt="Logo" 
                className="relative h-20 w-auto logo-float logo-glow-blue transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-3" 
              />
              
              {/* Static floating particles around logo */}
              <div className="absolute -top-2 -right-2 w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-60" style={{animationDelay: '0.5s'}}></div>
              <div className="absolute -bottom-2 -left-2 w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping opacity-60" style={{animationDelay: '1s'}}></div>
              <div className="absolute top-1/2 -left-3 w-1 h-1 bg-purple-400 rounded-full animate-ping opacity-60" style={{animationDelay: '1.5s'}}></div>
              <div className="absolute top-1/2 -right-3 w-1 h-1 bg-blue-300 rounded-full animate-ping opacity-60" style={{animationDelay: '2s'}}></div>
            </div>
          </div>
        </div>

        {/* Register Style Logo */}
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-8 text-gray-800 dark:text-white">Register Page Style</h3>
          <div className="flex items-center justify-center">
            <div className="relative group logo-container">
              {/* Animated background glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full blur-lg opacity-30 animate-pulse"></div>
              
              {/* Rotating ring around logo */}
              <div className="absolute inset-0 rounded-full border-2 border-transparent bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 animate-spin" style={{animationDuration: '8s'}}></div>
              
              {/* Pulsing inner ring */}
              <div className="absolute inset-2 rounded-full border border-green-400/50 animate-ping"></div>
              
              {/* Orbiting particles */}
              <div className="absolute inset-0 w-full h-full">
                <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-green-400 rounded-full particle-orbit opacity-60" style={{animationDelay: '0s'}}></div>
                <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-emerald-400 rounded-full particle-orbit-reverse opacity-60" style={{animationDelay: '1s'}}></div>
                <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-teal-400 rounded-full particle-orbit opacity-60" style={{animationDelay: '2s'}}></div>
              </div>
              
              {/* Main logo with custom animations */}
              <img 
                src={longLogo} 
                alt="Logo" 
                className="relative h-20 w-auto logo-float logo-glow-green transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-3" 
              />
              
              {/* Static floating particles around logo */}
              <div className="absolute -top-2 -right-2 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-60" style={{animationDelay: '0.5s'}}></div>
              <div className="absolute -bottom-2 -left-2 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping opacity-60" style={{animationDelay: '1s'}}></div>
              <div className="absolute top-1/2 -left-3 w-1 h-1 bg-teal-400 rounded-full animate-ping opacity-60" style={{animationDelay: '1.5s'}}></div>
              <div className="absolute top-1/2 -right-3 w-1 h-1 bg-green-300 rounded-full animate-ping opacity-60" style={{animationDelay: '2s'}}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoAnimationDemo;
