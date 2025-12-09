import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import {
    ArrowLeft, ExternalLink, Copy, Check, Key,
    ShieldCheck, Sparkles, ChevronRight, Laptop
} from 'lucide-react';

export default function GeminiGuide() {
    const headerRef = useRef<HTMLDivElement>(null);
    const stepsRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Header Animation
            gsap.from(headerRef.current, {
                y: -50,
                opacity: 0,
                duration: 1,
                ease: "power3.out"
            });

            // Steps Stagger Animation
            gsap.from(".step-card", {
                y: 50,
                opacity: 0,
                duration: 0.8,
                stagger: 0.2,
                ease: "back.out(1.7)",
                delay: 0.3
            });

            // Floating elements background
            gsap.to(".floating-bg", {
                y: "random(-20, 20)",
                x: "random(-20, 20)",
                duration: 4,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });

        }, containerRef);

        return () => ctx.revert();
    }, []);

    const steps = [
        {
            title: "Visit Google AI Studio",
            description: "Go to Google's official AI Studio platform. This is where you manage your Gemini API access.",
            action: {
                label: "Open Google AI Studio",
                url: "https://aistudio.google.com/app/apikey"
            },
            icon: <Laptop className="w-6 h-6 text-blue-600" />
        },
        {
            title: "Sign in with Google",
            description: "Log in using your standard Google account. No special developer account is required.",
            icon: <ShieldCheck className="w-6 h-6 text-emerald-600" />
        },
        {
            title: "Create API Key",
            description: "Click the blue 'Create API key' button. Select a project or let it create a new one automatically.",
            icon: <Key className="w-6 h-6 text-amber-600" />
        },
        {
            title: "Copy & Paste",
            description: "Copy your new key (starts with AIza...) and paste it back here in the settings.",
            icon: <Copy className="w-6 h-6 text-slate-600" />
        }
    ];

    return (
        <div ref={containerRef} className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 relative overflow-hidden">

            {/* Ambient Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="floating-bg absolute top-20 left-[10%] w-64 h-64 bg-blue-100/50 rounded-full blur-3xl mix-blend-multiply"></div>
                <div className="floating-bg absolute top-40 right-[10%] w-72 h-72 bg-emerald-100/50 rounded-full blur-3xl mix-blend-multiply"></div>
                <div className="floating-bg absolute -bottom-20 left-[20%] w-80 h-80 bg-amber-100/50 rounded-full blur-3xl mix-blend-multiply"></div>
            </div>

            {/* Navbar / Close */}
            <nav className="relative z-10 px-6 py-6 flex justify-between items-center max-w-6xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors group"
                >
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                        <ArrowLeft className="w-5 h-5" />
                    </div>
                    <span className="font-medium">Back</span>
                </button>
            </nav>

            <main className="relative z-10 max-w-5xl mx-auto px-6 pb-20">

                {/* Header Section */}
                <div ref={headerRef} className="text-center mb-16 max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full shadow-sm mb-6">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-semibold text-slate-700">Free Access</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight leading-tight">
                        Unlock Intelligence with <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">Gemini API</span>
                    </h1>
                    <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
                        Get your free API key from Google in less than 2 minutes. No credit card required for the free tier.
                    </p>
                </div>

                {/* Steps Grid */}
                <div ref={stepsRef} className="grid md:grid-cols-2 gap-6">
                    {steps.map((step, index) => (
                        <div
                            key={index}
                            className="step-card group bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-blue-200 transition-all duration-300 relative overflow-hidden"
                        >
                            {/* Step Number Background */}
                            <div className="absolute -right-4 -top-4 text-9xl font-bold text-slate-50 opacity-50 select-none group-hover:text-blue-50 transition-colors">
                                {index + 1}
                            </div>

                            <div className="relative z-10">
                                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-slate-100">
                                    {step.icon}
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                                    {step.title}
                                </h3>
                                <p className="text-slate-600 mb-6 leading-relaxed">
                                    {step.description}
                                </p>

                                {step.action && (
                                    <a
                                        href={step.action.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-blue-600 font-semibold group/link hover:gap-3 transition-all"
                                    >
                                        {step.action.label}
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom CTA */}
                <div className="text-center mt-16 step-card">
                    <p className="text-slate-500 mb-6">Once you have your key, copy it and return to the previous page.</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-8 py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center gap-3 mx-auto"
                    >
                        <Check className="w-5 h-5" />
                        I Have My Key
                    </button>
                </div>

            </main>
        </div>
    );
}
