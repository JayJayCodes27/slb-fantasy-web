import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const SignInPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      navigate('/my-team');
    } catch (error) {
      setError(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-4">
      <div className="card w-full max-w-[440px] p-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-white font-bold text-3xl">SLB</span>
            <span className="text-[#FF6B00] text-2xl">🏀</span>
          </div>
          <span className="text-[#FF6B00] text-sm font-bold uppercase tracking-wider">FANTASY</span>
        </div>

        {/* Heading */}
        <h1 className="text-white font-bold text-3xl mb-2">Welcome back</h1>
        <p className="text-[#a0a0a0] text-sm mb-8">Sign in to manage your squad</p>

        {/* Form */}
        <form onSubmit={handleSignIn} className="space-y-4">
          {/* Email */}
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#242424] rounded-button px-4 py-3 text-white placeholder-[#555555] focus:outline-none focus:border-[#FF6B00] transition-colors"
              required
            />
          </div>

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#242424] rounded-button px-4 py-3 text-white placeholder-[#555555] focus:outline-none focus:border-[#FF6B00] transition-colors pr-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#555555] hover:text-white transition-colors"
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FF6B00] text-white font-bold py-3 rounded-button hover:bg-[#e05f00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="inline-block animate-spin">⏳</span>
            ) : (
              'Sign In'
            )}
          </button>

          {/* Forgot Password */}
          <div className="text-center">
            <Link to="/forgot-password" className="text-[#a0a0a0] text-sm hover:text-white transition-colors">
              Forgot password?
            </Link>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-[#242424]"></div>
            <span className="text-[#555555] text-sm">or</span>
            <div className="flex-1 h-px bg-[#242424]"></div>
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <span className="text-[#a0a0a0] text-sm">Don't have an account? </span>
            <Link to="/signup" className="text-[#FF6B00] text-sm font-semibold hover:underline">
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignInPage;
