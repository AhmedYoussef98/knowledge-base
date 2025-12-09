import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuth } from '../contexts/AuthContext';
import {
    Sparkles,
    Search,
    BarChart3,
    Users,
    Zap,
    Shield,
    Globe,
    ArrowRight,
    CheckCircle2,
    MessageSquare,
    BookOpen,
    Lightbulb,
    LayoutDashboard
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function Landing() {
    const { user } = useAuth();
    const heroRef = useRef<HTMLDivElement>(null);
    const featuresRef = useRef<HTMLDivElement>(null);
    const howItWorksRef = useRef<HTMLDivElement>(null);
    const ctaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Hero animations
            gsap.from('.hero-badge', {
                opacity: 0,
                y: 20,
                duration: 0.8,
                ease: 'power3.out',
            });

            gsap.from('.hero-title', {
                opacity: 0,
                y: 40,
                duration: 1,
                delay: 0.2,
                ease: 'power3.out',
            });

            gsap.from('.hero-subtitle', {
                opacity: 0,
                y: 30,
                duration: 0.8,
                delay: 0.4,
                ease: 'power3.out',
            });

            gsap.from('.hero-buttons', {
                opacity: 0,
                y: 30,
                duration: 0.8,
                delay: 0.6,
                ease: 'power3.out',
            });

            gsap.from('.hero-stats', {
                opacity: 0,
                y: 30,
                duration: 0.8,
                delay: 0.8,
                ease: 'power3.out',
            });

            gsap.from('.hero-visual', {
                opacity: 0,
                scale: 0.9,
                duration: 1.2,
                delay: 0.4,
                ease: 'power3.out',
            });

            // Floating animation for hero visual
            gsap.to('.floating-card', {
                y: -10,
                duration: 2,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
                stagger: 0.2,
            });

            // Features section animations
            gsap.from('.feature-card', {
                scrollTrigger: {
                    trigger: featuresRef.current,
                    start: 'top 80%',
                },
                opacity: 0,
                y: 50,
                duration: 0.8,
                stagger: 0.15,
                ease: 'power3.out',
            });

            // How it works animations
            gsap.from('.step-card', {
                scrollTrigger: {
                    trigger: howItWorksRef.current,
                    start: 'top 80%',
                },
                opacity: 0,
                x: -30,
                duration: 0.8,
                stagger: 0.2,
                ease: 'power3.out',
            });

            // CTA animation
            gsap.from('.cta-content', {
                scrollTrigger: {
                    trigger: ctaRef.current,
                    start: 'top 85%',
                },
                opacity: 0,
                y: 40,
                duration: 1,
                ease: 'power3.out',
            });

        }, heroRef);

        return () => ctx.revert();
    }, []);

    const features = [
        {
            icon: Search,
            title: 'Smart Search',
            description: 'AI-powered search helps your customers find answers instantly with natural language queries.',
            color: 'from-blue-500 to-cyan-500',
        },
        {
            icon: Sparkles,
            title: 'AI Assistant',
            description: 'Built-in chat assistant powered by Google Gemini provides intelligent, contextual responses.',
            color: 'from-purple-500 to-pink-500',
        },
        {
            icon: BarChart3,
            title: 'Analytics Dashboard',
            description: 'Track top questions, popular keywords, and user behavior to improve your content.',
            color: 'from-orange-500 to-red-500',
        },
        {
            icon: Users,
            title: 'Multi-Tenant',
            description: 'Each client gets their own isolated knowledge base with custom branding and settings.',
            color: 'from-green-500 to-emerald-500',
        },
        {
            icon: Globe,
            title: 'Bilingual Support',
            description: 'Full support for English and Arabic with RTL layout switching.',
            color: 'from-indigo-500 to-purple-500',
        },
        {
            icon: Shield,
            title: 'Secure & Private',
            description: 'Row-level security ensures complete data isolation between tenants.',
            color: 'from-slate-500 to-gray-600',
        },
    ];

    const steps = [
        {
            number: '01',
            title: 'Sign Up',
            description: 'Create your account in seconds with just an email and password.',
            icon: Users,
        },
        {
            number: '02',
            title: 'Configure',
            description: 'Name your knowledge base, add your Gemini API key, and choose your brand colors.',
            icon: Lightbulb,
        },
        {
            number: '03',
            title: 'Add Content',
            description: 'Create Q&A entries with our AI-powered auto-fill or manually add your content.',
            icon: BookOpen,
        },
        {
            number: '04',
            title: 'Go Live',
            description: 'Share your unique URL with customers and start reducing support tickets.',
            icon: Zap,
        },
    ];

    return (
        <div className="min-h-screen bg-white overflow-hidden" ref={heroRef}>
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gray-900">KnowledgeHub</span>
                        </div>
                        <div className="flex items-center gap-4">
                            {user ? (
                                <Link
                                    to="/dashboard"
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full hover:shadow-lg transition-all"
                                >
                                    <LayoutDashboard className="w-4 h-4" />
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        to="/signup"
                                        className="px-5 py-2.5 bg-gray-900 text-white font-semibold rounded-full hover:bg-gray-800 transition-all hover:shadow-lg"
                                    >
                                        Get Started Free
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-orange-50 -z-10" />
                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
                <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
                <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />

                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left content */}
                        <div className="text-center lg:text-left">
                            <div className="hero-badge inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100 mb-6">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-sm font-medium text-gray-600">Self-Service SaaS Platform</span>
                            </div>

                            <h1 className="hero-title text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6">
                                Build Your
                                <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 bg-clip-text text-transparent">
                                    AI Knowledge Base
                                </span>
                            </h1>

                            <p className="hero-subtitle text-xl text-gray-600 mb-8 max-w-lg mx-auto lg:mx-0">
                                Create a beautiful, AI-powered knowledge base for your customers in minutes.
                                No coding required. Self-service setup.
                            </p>

                            <div className="hero-buttons flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
                                <Link
                                    to="/signup"
                                    className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full hover:shadow-xl hover:shadow-purple-500/25 transition-all text-lg"
                                >
                                    Start Building Free
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link
                                    to="/login"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-700 font-semibold rounded-full border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all text-lg"
                                >
                                    Sign In
                                </Link>
                            </div>

                            <div className="hero-stats flex items-center justify-center lg:justify-start gap-8">
                                <div>
                                    <div className="text-3xl font-bold text-gray-900">5 min</div>
                                    <div className="text-sm text-gray-500">Setup Time</div>
                                </div>
                                <div className="w-px h-12 bg-gray-200" />
                                <div>
                                    <div className="text-3xl font-bold text-gray-900">100%</div>
                                    <div className="text-sm text-gray-500">Self-Service</div>
                                </div>
                                <div className="w-px h-12 bg-gray-200" />
                                <div>
                                    <div className="text-3xl font-bold text-gray-900">Free</div>
                                    <div className="text-sm text-gray-500">To Start</div>
                                </div>
                            </div>
                        </div>

                        {/* Right visual */}
                        <div className="hero-visual relative lg:pl-8">
                            <div className="relative">
                                {/* Main card */}
                                <div className="floating-card bg-white rounded-2xl shadow-2xl p-6 border border-gray-100">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                                            <MessageSquare className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900">AI Assistant</div>
                                            <div className="text-sm text-green-500 flex items-center gap-1">
                                                <span className="w-2 h-2 bg-green-500 rounded-full" /> Online
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600">
                                            How do I track my order?
                                        </div>
                                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-3 text-sm text-white">
                                            You can track your order by logging into your account and clicking on "My Orders". There you'll find real-time tracking information.
                                        </div>
                                    </div>
                                </div>

                                {/* Floating mini cards */}
                                <div className="floating-card absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-3 border border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <BarChart3 className="w-5 h-5 text-orange-500" />
                                        <span className="text-sm font-medium text-gray-700">+42% less tickets</span>
                                    </div>
                                </div>

                                <div className="floating-card absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-3 border border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <Search className="w-5 h-5 text-blue-500" />
                                        <span className="text-sm font-medium text-gray-700">Smart Search</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section ref={featuresRef} className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                            Everything You Need
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Powerful features to build, manage, and scale your customer support knowledge base.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="feature-card bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:border-gray-200 transition-all duration-300 group"
                            >
                                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    <feature.icon className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section ref={howItWorksRef} className="py-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                            Get Started in 4 Simple Steps
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            From sign up to live knowledge base in under 5 minutes.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {steps.map((step, index) => (
                            <div key={index} className="step-card relative">
                                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-all h-full">
                                    <div className="text-6xl font-bold bg-gradient-to-br from-blue-100 to-purple-100 bg-clip-text text-transparent mb-4">
                                        {step.number}
                                    </div>
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-4">
                                        <step.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                                    <p className="text-gray-600">{step.description}</p>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                                        <ArrowRight className="w-8 h-8 text-gray-300" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section ref={ctaRef} className="py-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="cta-content relative bg-gradient-to-br from-blue-600 via-purple-600 to-orange-500 rounded-3xl p-12 text-center overflow-hidden">
                        {/* Decorative elements */}
                        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
                        <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 rounded-full translate-x-1/4 translate-y-1/4" />

                        <div className="relative z-10">
                            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                                Ready to Transform Your Support?
                            </h2>
                            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                                Join teams who've reduced support tickets by up to 50% with AI-powered knowledge bases.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    to="/signup"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-900 font-semibold rounded-full hover:shadow-xl transition-all text-lg"
                                >
                                    Get Started Free
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                            </div>
                            <div className="flex items-center justify-center gap-6 mt-8 text-white/80 text-sm">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5" />
                                    No credit card required
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5" />
                                    5-minute setup
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5" />
                                    Cancel anytime
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-white">KnowledgeHub</span>
                        </div>
                        <div className="text-center md:text-right">
                            <p>&copy; {new Date().getFullYear()} KnowledgeHub. All rights reserved.</p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
