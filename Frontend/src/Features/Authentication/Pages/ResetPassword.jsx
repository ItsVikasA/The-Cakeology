import React, { useState } from 'react';
import useAuth from '../Hook/useAuth';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const ResetPassword = () => {
    const navigate = useNavigate();
    const { token } = useParams();
    const { resetPasswordHandler, checkSessionIdHandler } = useAuth();

    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: '',
    });

    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const checkSessionId = async () => {
        const check = await checkSessionIdHandler(token);
        console.log(check);
        if (!check) {
            navigate("/");
            return;
        }
    }

    useEffect(() => {
        checkSessionId()
    }, []);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.newPassword.trim()) {
            newErrors.newPassword = 'New password is required';
        } else if (formData.newPassword.length < 8) {
            newErrors.newPassword = 'Password must be at least 8 characters';
        } else if (!/\d/.test(formData.newPassword)) { // ਨੰਬਰ ਚੈੱਕ ਕਰਨ ਲਈ regex
            newErrors.newPassword = 'Password must contain a number';
        }

        if (!formData.confirmPassword.trim()) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: '',
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        try {
            await resetPasswordHandler(formData.newPassword, formData.confirmPassword, token);
            setSuccessMessage('Password reset successfully! Redirecting...');
            setFormData({ newPassword: '', confirmPassword: '' });

            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (error) {
            setErrors((prev) => ({
                ...prev,
                submit: error.message || 'Failed to reset password. Please try again.',
            }));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="font-poppins min-h-screen flex bg-[#F9E0D6] antialiased items-center justify-center px-6 py-10">
            {/* ── RESET PASSWORD CONTAINER ── */}
            <div className="w-full max-w-[380px]">
                {/* CAKEOLOGY Header */}
                <div className="text-center mb-12">
                    <img src="/logo.png" alt="Cakeology" className="h-12 w-auto mx-auto mb-8" />

                    {/* Heading */}
                    <h2 className="font-baloo text-[42px] font-light text-[#5A1A2B] leading-[1.1] tracking-[-0.01em] mb-1.5">
                        Reset Your<br />
                        <em className="not-italic italic font-light text-[#F37966]">Password.</em>
                    </h2>
                    <p className="text-[13px] font-light text-[#6B7280] leading-relaxed">
                        Create a new password for your Cakeology account
                    </p>
                </div>

                {/* Success Message */}
                {successMessage && (
                    <div className="mb-6 p-4 bg-[#d4edda] border border-[#c3e6cb] rounded text-[#155724] text-[13px] font-light">
                        {successMessage}
                    </div>
                )}

                {/* Submit Error Message */}
                {errors.submit && (
                    <div className="mb-6 p-4 bg-[#f8d7da] border border-[#f5c6cb] rounded text-[#721c24] text-[13px] font-light">
                        {errors.submit}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* New Password */}
                    <div className="mb-[22px]">
                        <label className="block text-[10px] font-medium uppercase tracking-[0.14em] text-[#6B7280] mb-2">
                            New Password
                        </label>
                        <input
                            type="password"
                            name="newPassword"
                            placeholder="Enter new password"
                            value={formData.newPassword}
                            onChange={handleChange}
                            className={`bg-transparent border-0 border-b-[1.5px] rounded-none outline-none transition-colors duration-200 w-full py-[10px] font-poppins text-[15px] font-light text-[#5A1A2B] placeholder:text-[#C9B5A8] ${errors.newPassword
                                ? 'border-b-[#dc3545]'
                                : 'border-b-[#F3D9CB] focus:border-b-[#F37966]'
                                }`}
                        />
                        {errors.newPassword && (
                            <p className="text-[11px] text-[#dc3545] font-light mt-1.5">
                                {errors.newPassword}
                            </p>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className="mb-[22px]">
                        <label className="block text-[10px] font-medium uppercase tracking-[0.14em] text-[#6B7280] mb-2">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="Confirm your password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className={`bg-transparent border-0 border-b-[1.5px] rounded-none outline-none transition-colors duration-200 w-full py-[10px] font-poppins text-[15px] font-light text-[#5A1A2B] placeholder:text-[#C9B5A8] ${errors.confirmPassword
                                ? 'border-b-[#dc3545]'
                                : 'border-b-[#F3D9CB] focus:border-b-[#F37966]'
                                }`}
                        />
                        {errors.confirmPassword && (
                            <p className="text-[11px] text-[#dc3545] font-light mt-1.5">
                                {errors.confirmPassword}
                            </p>
                        )}
                    </div>

                    {/* Password Requirements Info */}
                    <div className="mb-6 p-3 rounded bg-[#fdf9f5] border border-[#F3D9CB]">
                        <p className="text-[11px] font-light text-[#6B7280] tracking-[0.02em]">
                            <strong className="font-medium">Password requirements:</strong>
                            <br />
                            • At least 8 characters
                            <br />
                            • Contains uppercase & lowercase letters
                            <br />
                            • Contains numbers & special characters
                        </p>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="font-poppins w-full py-4 px-5 bg-[#5A1A2B] text-[#F9E0D6] rounded
                                   text-[12px] font-medium uppercase tracking-[0.2em] cursor-pointer
                                   transition-all duration-200 hover:bg-[#43121F] active:scale-[0.99]
                                   disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>

                {/* Footer */}
                <p className="text-center text-[12.5px] font-light text-[#6B7280] mt-8">
                    Remember your password?{' '}
                    <a
                        href="/login"
                        className="text-[#F37966] font-medium no-underline border-b border-[rgba(138,110,82,0.3)]
                                   pb-px transition-colors duration-200 hover:border-[#F37966]"
                    >
                        Sign in
                    </a>
                </p>
            </div>
        </div>
    );
};

export default ResetPassword;
