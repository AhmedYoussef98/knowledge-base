import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, User, Bot } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { KnowledgeItem } from '../types';

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
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'assistant', text: `Hello! I'm your AI Assistant for ${tenantName}. I have access to the knowledge base and can help answer your questions. How can I help you today?` }
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
- Keep responses friendly and professional`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', text: response.text() };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                text: 'Sorry, I am having trouble connecting right now. Please check the API key configuration or try again later.'
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
                className={`fixed bottom-6 right-6 p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all z-40 ${isOpen ? 'hidden' : 'flex'} items-center gap-2`}
            >
                <Sparkles className="w-6 h-6" />
                <span className="font-bold hidden md:inline">Ask AI</span>
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col">

                    {/* Header */}
                    <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-2xl flex justify-between items-center text-white">
                        <div className="flex items-center gap-2">
                            <div className="bg-white/20 p-1.5 rounded-lg">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">AI Assistant</h3>
                                <p className="text-xs text-blue-100 flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                    {knowledgeBase.length > 0 ? `${knowledgeBase.length} articles loaded` : 'Online'}
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex gap-2 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-gray-200' : 'bg-blue-100'}`}>
                                        {msg.role === 'user' ? <User className="w-5 h-5 text-gray-500" /> : <Bot className="w-5 h-5 text-blue-600" />}
                                    </div>
                                    <div className={`p-3 rounded-2xl text-sm whitespace-pre-wrap ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : 'bg-white border border-gray-200 text-gray-700 rounded-tl-none shadow-sm'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="flex gap-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                        <Bot className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-tl-none shadow-sm">
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-gray-100 bg-white rounded-b-2xl">
                        <form
                            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                            className="flex gap-2"
                        >
                            <input
                                type="text"
                                className="flex-grow bg-gray-100 border-0 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                                placeholder="Ask about the knowledge base..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
