import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import longLogo from "../assets/long-logo.png";
import '../styles/logo-animations.css';

interface LoginFormData {
  username: string;
  password: string;
}

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    
    const success = await login(data.username, data.password);
    if (success) {
      navigate('/');
    } else {
      setError('Invalid username or password');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Floating geometric shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-4 h-4 bg-blue-500 rounded-full opacity-60 animate-bounce" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-40 right-20 w-6 h-6 bg-indigo-500 rounded-full opacity-40 animate-bounce" style={{animationDelay: '3s'}}></div>
        <div className="absolute bottom-40 left-20 w-3 h-3 bg-purple-500 rounded-full opacity-50 animate-bounce" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 right-10 w-5 h-5 bg-blue-400 rounded-full opacity-30 animate-bounce" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="relative flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header Section */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
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
                  className="relative h-16 w-auto logo-float logo-glow-blue transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-3" 
                />
                
                {/* Static floating particles around logo */}
                <div className="absolute -top-2 -right-2 w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-60" style={{animationDelay: '0.5s'}}></div>
                <div className="absolute -bottom-2 -left-2 w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping opacity-60" style={{animationDelay: '1s'}}></div>
                <div className="absolute top-1/2 -left-3 w-1 h-1 bg-purple-400 rounded-full animate-ping opacity-60" style={{animationDelay: '1.5s'}}></div>
                <div className="absolute top-1/2 -right-3 w-1 h-1 bg-blue-300 rounded-full animate-ping opacity-60" style={{animationDelay: '2s'}}></div>
              </div>
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Welcome Back
            </h2>
            <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">
              Sign in to access your notary dashboard
            </p>
          </div>

          {/* Login Card */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl blur-lg opacity-20"></div>
            <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm py-10 px-8 shadow-2xl rounded-2xl border border-white/20 dark:border-gray-700/50">
          {error && (
            <div className="mb-6 p-4 bg-red-50/80 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl backdrop-blur-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-1">
              <label htmlFor="username" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Username
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl blur opacity-0 group-focus-within:opacity-20 transition-opacity duration-300"></div>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  {...register('username', { required: 'Username is required' })}
                  className="relative w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white transition-all duration-300 backdrop-blur-sm"
                  placeholder="Enter your username"
                />
                {errors.username && (
                  <p className="mt-2 text-sm text-red-500 dark:text-red-400 flex items-center">
                    <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                    {errors.username.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl blur opacity-0 group-focus-within:opacity-20 transition-opacity duration-300"></div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('password', { required: 'Password is required' })}
                  className="relative w-full px-4 py-3 pr-12 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white transition-all duration-300 backdrop-blur-sm"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-100 dark:hover:bg-gray-600 rounded-r-xl transition-colors duration-200"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200" />
                  )}
                </button>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-500 dark:text-red-400 flex items-center">
                    <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center items-center py-4 px-6 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:transform-none disabled:shadow-lg"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                <div className="relative flex items-center">
                  {isLoading ? (
                    <div className="animate-spin -ml-1 mr-3 h-6 w-6 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <LogIn className="h-6 w-6 mr-3 group-hover:scale-110 transition-transform duration-300" />
                  )}
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </div>
              </button>
            </div>

            {/* Additional decorative elements */}
            <div className="relative pt-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white/80 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 backdrop-blur-sm rounded-full">
                  Secure Access
                </span>
              </div>
            </div>
          </form>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Protected by enterprise-grade security
            </p>
            <div className="flex justify-center space-x-4 mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

