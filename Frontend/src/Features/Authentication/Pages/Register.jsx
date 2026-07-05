import React, { useState } from 'react';
import useAuth from '../Hook/useAuth';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();
  const { registerHandler } = useAuth();
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    contact: '',
    password: '',
    role: 'buyer',
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const validate = () => {
    const newErrors = {};

    if (!formData.fullname || formData.fullname.length < 3) {
      newErrors.fullname = 'Fullname must be at least 3 characters long';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = 'Please provide a valid email address';
    }

    if (!formData.password || formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else if (!/\d/.test(formData.password)) {
      newErrors.password = 'Password must contain a number';
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!formData.contact || !phoneRegex.test(formData.contact)) {
      newErrors.contact = 'Contact number must be exactly 10 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fields = [
    { label: 'Full Name', name: 'fullname', type: 'text', placeholder: 'John Doe' },
    { label: 'Email Address', name: 'email', type: 'email', placeholder: 'hello@example.com' },
    { label: 'Contact Number', name: 'contact', type: 'tel', placeholder: '98765 43210' },
    { label: 'Password', name: 'password', type: 'password', placeholder: '••••••••' },
  ];

  const handleKeyDown = (e, index) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (index < fields.length - 1) {
        const nextInput = document.getElementsByName(fields[index + 1].name)[0];
        if (nextInput) {
          nextInput.focus();
        }
      } else {
        handleSubmit(e);
      }
    }
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
    const result = await registerHandler(formData);
    if (!result?.success) {
      setSubmitError(result?.message || 'Unable to create account');
      return;
    }
    setSubmitError('');
    const dest = sessionStorage.getItem('postLoginRedirect');
    sessionStorage.removeItem('postLoginRedirect');
    if (dest === '/customCake') {
      navigate('/customCake');
      return;
    }

    if (result?.user?.role === 'admin') {
      navigate('/admin');
      return;
    }

    if (result?.user?.role === 'seller') {
      navigate('/product/dashboard');
      return;
    }

    navigate('/');
  };

  const perks = [
    'Early access to new seasonal flavours',
    'Members-only pricing & offers',
    'Free delivery on eligible orders',
    'Custom cake design uploads',
  ];

  return (
    <div className="font-poppins min-h-screen flex bg-[#F9E0D6] antialiased">
      {/* ── LEFT PANEL ── */}
      <div className="grain hidden lg:flex w-[52%] relative flex-col justify-end p-12 bg-[#5A1A2B] overflow-hidden shrink-0">
        {/* Photo overlay gradient */}
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            backgroundImage: `url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRQalgjZbtbJ529rhY3K3K8TFa4d41SFFivVLO1bVJN1g&s=10')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center bottom',
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
          Exclusive Access
        </div>

        {/* Headline */}
        <h2 className="font-baloo text-[clamp(38px,4vw,58px)] leading-[1.12] font-light text-white tracking-[-0.01em] mb-5 relative z-[2] [text-shadow:0_2px_20px_rgba(0,0,0,0.6),0_1px_4px_rgba(0,0,0,0.8)]">
          Celebrate the<br />
          <em className="not-italic italic font-light text-[#F5C9BE] [text-shadow:0_2px_20px_rgba(0,0,0,0.5),0_0_40px_rgba(196,160,120,0.3)]">sweetness.</em>
        </h2>

        {/* Subtext */}
        <p className="relative z-[2] text-[13px] font-light leading-[1.7] text-white/70 max-w-[320px] mb-10 [text-shadow:0_1px_8px_rgba(0,0,0,0.7)]">
          Join thousands of dessert lovers who trust Cakeology for freshly baked cakes crafted to celebrate every moment.
        </p>


        {/* Divider */}
        <div className="relative z-[2] w-12 h-px bg-[rgba(196,160,120,0.4)] mb-8" />

        {/* Perks — frosted glass card */}
        <div className="relative z-[2] flex flex-col gap-3.5 px-6 py-5 rounded-md
                        bg-white/[0.06] backdrop-blur-xl border border-white/10">
          {perks.map((perk) => (
            <div key={perk} className="flex items-center gap-3 [text-shadow:0_1px_6px_rgba(0,0,0,0.5)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F5C9BE] shrink-0" />
              <span className="text-[13px] font-light text-white/[0.82]">{perk}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="relative flex flex-1 items-center justify-center px-6 pt-10 bg-[#F9E0D6] overflow-y-auto">
        <img src="/logo.png" alt="Cakeology" onClick={() => navigate('/')} className="absolute top-4 left-1/2 -translate-x-1/2 h-12 w-auto cursor-pointer z-10" />
        <div className="w-full max-w-[380px] pt-6">

          {/* Heading */}
          <h1 className="font-baloo text-[42px] font-light text-[#5A1A2B] leading-[1.1] tracking-[-0.01em] mb-1.5">
            Create your<br />
            <em className="not-italic italic text-[#F37966]">account.</em>
          </h1>
          <p className="text-[13px] font-light text-[#6B7280] leading-relaxed mb-9">
            Join the Cakeology community today
          </p>

          <form onSubmit={handleSubmit} noValidate>
            {submitError && (
              <div className="mb-5 rounded border border-[#d9383a]/20 bg-[#d9383a]/8 px-4 py-3 text-[12px] text-[#b42b2d]">
                {submitError}
              </div>
            )}
            {fields.map((field, index) => {
              const isPasswordField = field.name === 'password';
              const inputType = isPasswordField ? (showPassword ? 'text' : 'password') : field.type;

              return (
                <div key={field.name} className="mb-5">
                  <label className="block text-[10px] font-medium uppercase tracking-[0.14em] text-[#6B7280] mb-2">
                    {field.label}
                  </label>
                  <div className="relative">
                    <input
                      type={inputType}
                      name={field.name}
                      placeholder={field.placeholder}
                      value={formData[field.name]}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      required
                      className={`bg-transparent border-0 border-b-[1.5px] rounded-none outline-none transition-colors duration-200 w-full py-[10px] pr-10 font-poppins text-[15px] font-light text-[#5A1A2B] placeholder:text-[#C9B5A8] ${errors[field.name] ? 'border-b-[#d9383a] focus:border-b-[#d9383a]' : 'border-[#F3D9CB] focus:border-b-[#F37966]'
                        }`}
                    />
                    {isPasswordField && (
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
                    )}
                  </div>
                  {errors[field.name] && (
                    <span className="text-[11px] text-[#d9383a] font-light mt-1 block">
                      {errors[field.name]}
                    </span>
                  )}
                </div>
              );
            })}

            {/* Submit */}
            <button
              type="submit"
              className="font-poppins w-full py-4 px-5 mt-2 bg-[#5A1A2B] text-[#F9E0D6] rounded
                         text-[12px] font-medium uppercase tracking-[0.2em] cursor-pointer
                         transition-colors duration-200 hover:bg-[#43121F] active:scale-[0.99]"
            >
              Get Started
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-[12.5px] font-light text-[#6B7280] mt-7">
            Already have an account?{' '}
            <a
              href="/login"
              className="text-[#F37966] font-medium no-underline border-b border-[rgba(138,110,82,0.3)]
                         pb-px transition-colors duration-200 hover:border-[#F37966]"
            >
              Sign In
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;