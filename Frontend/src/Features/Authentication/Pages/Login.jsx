import React, { useState, useRef } from 'react';
import useAuth from '../Hook/useAuth';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const { loginHandler } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef(null);

  const validate = () => {
    const newErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = 'Please provide a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitError('');
    setSubmitting(true);
    const result = await loginHandler(formData);
    setSubmitting(false);

    if (result?.success) {
      // Everyone lands on the home (Landing) page after logging in — except a
      // guest who was headed to the custom-cake form, who is returned there.
      const dest = sessionStorage.getItem('postLoginRedirect');
      sessionStorage.removeItem('postLoginRedirect');
      navigate(dest === '/customCake' ? '/customCake' : '/');
      return;
    }

    setSubmitError(result?.message || 'Unable to sign in');
  };

  return (
    <div className="font-poppins min-h-screen flex bg-[#F9E0D6] antialiased">
      {/* ── LEFT PANEL ── */}
      <div className="grain hidden lg:flex w-[52%] relative flex-col justify-end p-12 bg-[#5A1A2B] overflow-hidden shrink-0">
        {/* Photo overlay gradient */}
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1571386630001-d8394dd7b8db?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        {/* Ambient glows */}
        <div
          className="absolute -top-20 -right-20 w-[360px] h-[360px] rounded-full pointer-events-none z-[1]"
          style={{ background: 'radial-gradient(circle, rgba(196,160,120,0.18) 0%, transparent 70%)' }}
        />
        <div
          className="absolute -left-[60px] bottom-[120px] w-[280px] h-[280px] rounded-full pointer-events-none z-[1]"
          style={{ background: 'radial-gradient(circle, rgba(196,160,120,0.1) 0%, transparent 70%)' }}
        />

        {/* Tag pill */}
        <div
          className="relative z-[2] inline-flex items-center gap-2 mb-7 w-fit px-[14px] py-[7px] rounded-sm
                      text-[10px] font-medium uppercase tracking-[0.18em] text-[#F5C9BE]
                      backdrop-blur-md border border-[rgba(196,160,120,0.45)] bg-[rgba(196,160,120,0.18)]
                      [text-shadow:0_1px_4px_rgba(0,0,0,0.5)]"
        >
          <span className="w-[5px] h-[5px] rounded-full bg-[#F5C9BE] shrink-0" />
          New Seasonal Flavours
        </div>

        {/* Headline */}
        <h2 className="font-baloo text-[clamp(38px,4vw,58px)] leading-[1.12] font-light text-white tracking-[-0.01em] mb-5 relative z-[2] [text-shadow:0_2px_20px_rgba(0,0,0,0.6),0_1px_4px_rgba(0,0,0,0.8)]">
          Celebrations,<br />
          <em className="not-italic italic font-light text-[#F5C9BE] [text-shadow:0_2px_20px_rgba(0,0,0,0.5),0_0_40px_rgba(196,160,120,0.3)]">sweetened.</em>
        </h2>

        {/* Subtext */}
        <p className="relative z-[2] text-[13px] font-light leading-[1.7] text-white/70 max-w-[320px] mb-10 [text-shadow:0_1px_8px_rgba(0,0,0,0.7)]">
          Freshly baked cakes and desserts crafted to make every celebration sweeter.
        </p>

        {/* Divider */}
        <div className="relative z-[2] w-12 h-px bg-[rgba(196,160,120,0.4)] mb-8" />

        {/* Stats — frosted glass card */}
        <div className="relative z-[2] flex gap-10 w-fit px-6 py-[18px] rounded-md
                        bg-white/[0.06] backdrop-blur-xl border border-white/10">
          {[['50+', 'Flavours'], ['1.2M', 'Customers'], ['4.9★', 'Rating']].map(([val, lbl]) => (
            <div key={lbl}>
              <span
                className="font-baloo block text-[28px] font-semibold text-white leading-none mb-1 [text-shadow:0_1px_6px_rgba(0,0,0,0.4)]"
              >
                {val}
              </span>
              <span className="block text-[10px] uppercase tracking-[0.12em] font-normal text-white/55">
                {lbl}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="relative flex flex-1 items-center justify-center px-6 py-10 bg-[#F9E0D6]">
        <img src="/logo.png" alt="Cakeology" onClick={() => navigate('/')} className="absolute top-5 left-1/2 -translate-x-1/2 h-12 w-auto cursor-pointer" />
        <div className="w-full max-w-[380px] pt-5">

          {/* Heading */}
          <h1 className="font-baloo text-[42px] font-light text-[#5A1A2B] leading-[1.1] tracking-[-0.01em] mb-1.5">
            Welcome <br />
            <em className="not-italic italic font-light text-[#F37966]">back.</em>
          </h1>
          <p className="text-[13px] font-light text-[#6B7280] leading-relaxed mb-10">
            Sign in to your Cakeology account
          </p>

          <form onSubmit={handleSubmit} noValidate>
            {submitError && (
              <div className="mb-5 rounded border border-[#d9383a]/20 bg-[#d9383a]/8 px-4 py-3 text-[12px] text-[#b42b2d]">
                {submitError}
              </div>
            )}

            {/* Email */}
            <div className="mb-[22px]">
              <label className="block text-[10px] font-medium uppercase tracking-[0.14em] text-[#6B7280] mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                placeholder="hello@example.com"
                value={formData.email}
                onChange={handleChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    passwordRef.current?.focus();
                  }
                }}
                required
                className={`bg-transparent border-0 border-b-[1.5px] rounded-none outline-none transition-colors duration-200 w-full py-[10px] font-poppins text-[15px] font-light text-[#5A1A2B] placeholder:text-[#C9B5A8] ${errors.email ? 'border-b-[#d9383a] focus:border-b-[#d9383a]' : 'border-[#F3D9CB] focus:border-b-[#F37966]'
                  }`}
              />
              {errors.email && (
                <span className="text-[11px] text-[#d9383a] font-light mt-1 block">
                  {errors.email}
                </span>
              )}
            </div>

            {/* Password */}
            <div className="mb-[22px]">
              <label className="block text-[10px] font-medium uppercase tracking-[0.14em] text-[#6B7280] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  ref={passwordRef}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className={`bg-transparent border-0 border-b-[1.5px] rounded-none outline-none transition-colors duration-200 w-full py-[10px] pr-10 font-poppins text-[15px] font-light text-[#5A1A2B] placeholder:text-[#C9B5A8] ${errors.password ? 'border-b-[#d9383a] focus:border-b-[#d9383a]' : 'border-[#F3D9CB] focus:border-b-[#F37966]'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#5A1A2B] focus:outline-none transition-colors p-1"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <span className="text-[11px] text-[#d9383a] font-light mt-1 block">
                  {errors.password}
                </span>
              )}
            </div>

            <div className="flex justify-center mb-6">
              <button
                type="button"
                className="text-[12px] font-light text-[#F37966] tracking-[0.04em] 
                           border-b border-[rgba(138,110,82,0.3)] pb-1
                           transition-all duration-200 hover:border-[#F37966] hover:text-[#6b5940]
                           active:scale-[0.98] cursor-pointer"
                onClick={() => { navigate('/forgotPassword') }}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="font-poppins w-full py-4 px-5 mt-2 bg-[#5A1A2B] text-[#F9E0D6] rounded
                         text-[12px] font-medium uppercase tracking-[0.2em] cursor-pointer
                         transition-colors duration-200 hover:bg-[#43121F] active:scale-[0.99]
                         disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-[12.5px] font-light text-[#6B7280] mt-8">
            Don't have an account?{' '}
            <a
              href="/register"
              className="text-[#F37966] font-medium no-underline border-b border-[rgba(138,110,82,0.3)]
                         pb-px transition-colors duration-200 hover:border-[#F37966]"
            >
              Create one
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;