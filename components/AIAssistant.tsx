import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, User, Bot } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { KnowledgeItem } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../i18n/useTranslation';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    text: string;
}

interface Props {
    apiKey: string;
    knowledgeBase?: KnowledgeItem[];
    tenantName?: string;
}

export const AIAssistant: React.FC<Props> = ({ apiKey, knowledgeBase = [], tenantName = 'Knowledge Base' }) => {
    const { language, isRTL } = useLanguage();
    const { t } = useTranslation();

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            text: language === 'ar'
                ? `مرحباً! أنا مساعد الذكاء الاصطناعي الخاص بـ ${tenantName}. لدي إمكانية الوصول إلى قاعدة المعرفة ويمكنني المساعدة في الإجابة على أسئلتك. كيف يمكنني مساعدتك اليوم؟`
                : `Hello! I'm your AI Assistant for ${tenantName}. I have access to the knowledge base and can help answer your questions. How can I help you today?`
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    // Update greeting message when language changes
    useEffect(() => {
        setMessages([
            {
                id: '1',
                role: 'assistant',
                text: language === 'ar'
                    ? `مرحباً! أنا مساعد الذكاء الاصطناعي الخاص بـ ${tenantName}. لدي إمكانية الوصول إلى قاعدة المعرفة ويمكنني المساعدة في الإجابة على أسئلتك. كيف يمكنني مساعدتك اليوم؟`
                    : `Hello! I'm your AI Assistant for ${tenantName}. I have access to the knowledge base and can help answer your questions. How can I help you today?`
            }
        ]);
    }, [language, tenantName]);

    // Build knowledge base context string
    const buildKnowledgeContext = (): string => {
        if (knowledgeBase.length === 0) {
            return 'No knowledge base content is currently available.';
        }

        // Group by category for better organization
        const byCategory: Record<string, KnowledgeItem[]> = {};
        knowledgeBase.forEach(item => {
            if (!byCategory[item.category]) {
                byCategory[item.category] = [];
            }
            byCategory[item.category].push(item);
        });

        let context = `KNOWLEDGE BASE CONTENT FOR ${tenantName.toUpperCase()}:\n\n`;

        Object.entries(byCategory).forEach(([category, items]) => {
            context += `## ${category}\n`;
            items.forEach(item => {
                context += `\nQ: ${item.question}\n`;
                context += `A: ${item.answer}\n`;
                if (item.keywords) {
                    context += `Keywords: ${item.keywords}\n`;
                }
            });
            context += '\n';
        });

        return context;
    };

    const handleSend = async () => {
        if (!input.trim() || !apiKey) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

            const knowledgeContext = buildKnowledgeContext();

            const prompt = `You are a helpful customer service assistant for "${tenantName}".
You have access to the following knowledge base content. Use this information to answer user questions accurately.
If the answer is in the knowledge base, provide it. If not, you can give general helpful advice but mention that it's not from the official knowledge base.

${knowledgeContext}

---

User Question: ${input}

Instructions:
- Answer based on the knowledge base content above when possible
- Be concise and helpful
- If the question relates to content in the knowledge base, quote or reference the relevant information
- If you're not sure, say so honestly
- Keep responses friendly and professional
${language === 'ar' ? '- Respond in Arabic' : '- Respond in English'}`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', text: response.text() };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error(error);
            const errorText = language === 'ar'
                ? 'عذراً، أواجه مشكلة في الاتصال الآن. يرجى التحقق من إعدادات مفتاح API أو المحاولة مرة أخرى لاحقاً.'
                : 'Sorry, I am having trouble connecting right now. Please check the API key configuration or try again later.';
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                text: errorText
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed ${isRTL ? 'left-6' : 'right-6'} bottom-6 p-4 bg-daleel-gradient text-daleel-deep-space rounded-full shadow-lg hover:shadow-xl transition-all z-40 ${isOpen ? 'hidden' : 'flex'} items-center gap-2 glow-neon font-semibold`}
            >
                <Sparkles className="w-6 h-6" />
                <span className="hidden md:inline">{t('ai.askAI')}</span>
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className={`fixed ${isRTL ? 'left-6' : 'right-6'} bottom-6 w-96 h-[500px] bg-daleel-tech-slate rounded-2xl shadow-2xl border border-daleel-cyan/30 z-50 flex flex-col glow-cyan`} dir={isRTL ? 'rtl' : 'ltr'}>

                    {/* Header */}
                    <div className="p-4 bg-daleel-gradient rounded-t-2xl flex justify-between items-center text-daleel-deep-space">
                        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <div className="bg-daleel-deep-space/20 p-1.5 rounded-lg">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div className={isRTL ? 'text-right' : ''}>
                                <h3 className="font-bold text-sm">{t('ai.assistant')}</h3>
                                <p className={`text-xs text-daleel-deep-space/70 flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                    <span className="w-2 h-2 bg-daleel-green rounded-full animate-pulse"></span>
                                    {knowledgeBase.length > 0
                                        ? `${knowledgeBase.length} ${t('ai.articlesLoaded')}`
                                        : t('ai.online')
                                    }
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-daleel-deep-space/20 rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-daleel-deep-space">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? (isRTL ? 'justify-start' : 'justify-end') : (isRTL ? 'justify-end' : 'justify-start')}`}>
                                <div className={`flex gap-2 max-w-[80%] ${msg.role === 'user' ? (isRTL ? 'flex-row' : 'flex-row-reverse') : (isRTL ? 'flex-row-reverse' : 'flex-row')}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-daleel-neon/20 border border-daleel-neon/30' : 'bg-daleel-cyan/20 border border-daleel-cyan/30'}`}>
                                        {msg.role === 'user' ? <User className="w-5 h-5 text-daleel-neon" /> : <Bot className="w-5 h-5 text-daleel-cyan" />}
                                    </div>
                                    <div className={`p-3 rounded-2xl text-sm whitespace-pre-wrap ${msg.role === 'user'
                                        ? `bg-daleel-neon text-daleel-deep-space font-medium ${isRTL ? 'rounded-tl-none' : 'rounded-tr-none'} glow-neon`
                                        : `bg-daleel-tech-slate border border-daleel-cyan/30 text-daleel-pure-light ${isRTL ? 'rounded-tr-none' : 'rounded-tl-none'} shadow-sm`
                                        } ${isRTL ? 'text-right' : 'text-left'}`}>
                                        {msg.text}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className={`flex ${isRTL ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                    <div className="w-8 h-8 rounded-full bg-daleel-cyan/20 border border-daleel-cyan/30 flex items-center justify-center">
                                        <Bot className="w-5 h-5 text-daleel-cyan" />
                                    </div>
                                    <div className="bg-daleel-tech-slate border border-daleel-cyan/30 p-3 rounded-2xl rounded-tl-none shadow-sm">
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 bg-daleel-cyan rounded-full animate-bounce"></span>
                                            <span className="w-2 h-2 bg-daleel-cyan rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                                            <span className="w-2 h-2 bg-daleel-cyan rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-daleel-cyan/20 bg-daleel-tech-slate rounded-b-2xl">
                        <form
                            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                            className="flex gap-2"
                        >
                            <input
                                type="text"
                                className={`flex-grow bg-daleel-deep-space border border-daleel-cyan/30 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-daleel-neon focus:border-daleel-neon transition-all text-daleel-pure-light placeholder-daleel-pure-light/40 ${isRTL ? 'text-right' : 'text-left'}`}
                                placeholder={t('ai.placeholder')}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="p-2.5 bg-daleel-neon text-daleel-deep-space rounded-xl hover:bg-daleel-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed glow-neon font-semibold"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </div>

                </div>
            )}
        </>
    );
};
