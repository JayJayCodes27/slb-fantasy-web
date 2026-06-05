import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const SignUpPage = () => {
  const [username, setUsername] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inviteCodeError, setInviteCodeError] = useState('');
  const navigate = useNavigate();

  const getPasswordStrength = (pwd) => {
    if (!pwd) return 0;
    let strength = 0;
    if (pwd.length >= 8) strength += 1;
    if (pwd.length >= 12) strength += 1;
    if (/[A-Z]/.test(pwd)) strength += 1;
    if (/[0-9]/.test(pwd)) strength += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) strength += 1;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInviteCodeError('');

    // Validate invite code
    if (inviteCode.toUpperCase() !== 'HRIS') {
      setInviteCodeError('Invalid invite code. Please contact us at hello@slbfantasy.co.uk to request access.');
      setLoading(false);
      return;
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      // Insert user into public users table
      const { error: userError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            email: email,
            username: username,
          },
        ]);

      if (userError) throw userError;

      navigate('/my-team');
    } catch (error) {
      if (error.message.includes('duplicate key')) {
        setError('Email or username already taken');
      } else {
        setError(error.message || 'Failed to create account');
      }
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
        <h1 className="text-white font-bold text-3xl mb-2">Create your account</h1>
        <p className="text-[#a0a0a0] text-sm mb-8">Join SLB Fantasy and start building your squad</p>

        {/* Form */}
        <form onSubmit={handleSignUp} className="space-y-4">
          {/* Username */}
          <div>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#242424] rounded-button px-4 py-3 text-white placeholder-[#555555] focus:outline-none focus:border-[#FF6B00] transition-colors"
              required
            />
          </div>

          {/* Invite Code */}
          <div>
            <input
              type="text"
              placeholder="Enter invite code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#242424] rounded-button px-4 py-3 text-white placeholder-[#555555] focus:outline-none focus:border-[#FF6B00] transition-colors"
              required
            />
            {inviteCodeError && (
              <p className="text-red-500 text-sm mt-1">{inviteCodeError}</p>
            )}
          </div>

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
          <div>
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
            {/* Password Strength Indicator */}
            {password && (
              <div className="mt-2">
                <div className="flex gap-1 h-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`flex-1 rounded-full ${
                        level <= passwordStrength
                          ? passwordStrength <= 2
                            ? 'bg-red-500'
                            : passwordStrength <= 3
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                          : 'bg-[#242424]'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[#555555] text-xs mt-1">
                  {passwordStrength <= 2 && 'Weak'}
                  {passwordStrength === 3 && 'Medium'}
                  {passwordStrength >= 4 && 'Strong'}
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#242424] rounded-button px-4 py-3 text-white placeholder-[#555555] focus:outline-none focus:border-[#FF6B00] transition-colors pr-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#555555] hover:text-white transition-colors"
            >
              {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          {/* Sign Up Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FF6B00] text-white font-bold py-3 rounded-button hover:bg-[#e05f00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="inline-block animate-spin">⏳</span>
            ) : (
              'Create Account'
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-[#242424]"></div>
            <span className="text-[#555555] text-sm">or</span>
            <div className="flex-1 h-px bg-[#242424]"></div>
          </div>

          {/* Sign In Link */}
          <div className="text-center">
            <span className="text-[#a0a0a0] text-sm">Already have an account? </span>
            <Link to="/signin" className="text-[#FF6B00] text-sm font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUpPage;
