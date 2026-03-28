import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Icon from '../../components/AppIcon';

const UserLogin = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }
        if (!formData.password) {
            newErrors.password = 'Password is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            // Mock login — store session in localStorage
            await new Promise(resolve => setTimeout(resolve, 1200));
            localStorage.setItem('nutriswap_user', JSON.stringify({
                email: formData.email,
                name: formData.email.split('@')[0],
                loggedInAt: new Date().toISOString()
            }));
            navigate('/dashboard');
        } catch (error) {
            console.error('Login error:', error);
            setErrors({ email: 'Invalid email or password' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialLogin = (provider) => {
        console.log(`Social login with ${provider}`);
        localStorage.setItem('nutriswap_user', JSON.stringify({
            name: `${provider} User`,
            email: `user@${provider.toLowerCase()}.com`,
            loggedInAt: new Date().toISOString()
        }));
        setTimeout(() => navigate('/dashboard'), 800);
    };

    return (
        <div className="min-h-screen bg-[#050505] font-sans text-white">
            <Header />

            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
                <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }}></div>
            </div>

            <main className="relative z-10 flex items-center justify-center min-h-screen px-6 pt-20 pb-12">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-md"
                >
                    {/* Logo / Header */}
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Icon name="Zap" size={28} className="text-white" />
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                            Welcome Back
                        </h1>
                        <p className="text-gray-400 mt-2">Sign in to your NutriSwap account</p>
                    </div>

                    {/* Login Form Card */}
                    <div className="backdrop-blur-xl bg-white/[0.03] rounded-2xl p-8 border border-white/[0.06] shadow-2xl">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <Input
                                    label="Email Address"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    error={errors.email}
                                    required
                                />
                            </div>

                            <div className="relative">
                                <Input
                                    label="Password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={(e) => handleInputChange('password', e.target.value)}
                                    error={errors.password}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-9 text-gray-500 hover:text-white transition-colors"
                                >
                                    <Icon name={showPassword ? 'EyeOff' : 'Eye'} size={18} />
                                </button>
                            </div>

                            {/* Remember / Forgot */}
                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 text-gray-400 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-white/10 bg-white/5 text-emerald-500 focus:ring-emerald-500/30"
                                    />
                                    <span className="group-hover:text-gray-300 transition-colors">Remember me</span>
                                </label>
                                <button
                                    type="button"
                                    className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                                >
                                    Forgot password?
                                </button>
                            </div>

                            {/* Submit */}
                            <Button
                                type="submit"
                                variant="default"
                                size="lg"
                                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold py-3 rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Icon name="Loader2" size={18} className="animate-spin" />
                                        Signing in...
                                    </span>
                                ) : (
                                    'Sign In'
                                )}
                            </Button>
                        </form>

                        {/* Divider */}
                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/[0.06]"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-[#0a0a0a] text-gray-500">or continue with</span>
                            </div>
                        </div>

                        {/* Social Login */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => handleSocialLogin('Google')}
                                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-gray-300 hover:bg-white/[0.06] hover:text-white transition-all duration-200"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#EA4335" d="M5.27 9.76A7.08 7.08 0 0 1 12 5.04c1.69 0 3.22.59 4.42 1.56l3.31-3.31A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.24 6.65l4.03 3.11Z" />
                                    <path fill="#34A853" d="M16.04 18.01A7.4 7.4 0 0 1 12 19.08a7.08 7.08 0 0 1-6.73-4.84l-4.03 3.11A12 12 0 0 0 12 24c3.02 0 5.8-1.1 7.93-2.92l-3.89-3.07Z" />
                                    <path fill="#4A90D9" d="M19.93 21.08C22.18 19.07 24 15.88 24 12c0-.71-.08-1.47-.24-2.18H12v4.64h6.7a5.83 5.83 0 0 1-2.66 3.55l3.89 3.07Z" />
                                    <path fill="#FBBC05" d="M5.27 14.24A7.12 7.12 0 0 1 4.89 12c0-.78.14-1.54.38-2.24L1.24 6.65A12.01 12.01 0 0 0 0 12c0 1.92.46 3.74 1.24 5.35l4.03-3.11Z" />
                                </svg>
                                <span className="text-sm font-medium">Google</span>
                            </button>
                            <button
                                onClick={() => handleSocialLogin('Apple')}
                                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-gray-300 hover:bg-white/[0.06] hover:text-white transition-all duration-200"
                            >
                                <Icon name="Apple" size={20} />
                                <span className="text-sm font-medium">Apple</span>
                            </button>
                        </div>
                    </div>

                    {/* Sign Up Link */}
                    <p className="text-center text-gray-400 text-sm mt-8">
                        Don't have an account?{' '}
                        <Link
                            to="/user-registration"
                            className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
                        >
                            Create one for free
                        </Link>
                    </p>
                </motion.div>
            </main>
        </div>
    );
};

export default UserLogin;
