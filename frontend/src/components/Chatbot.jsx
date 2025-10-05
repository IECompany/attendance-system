import React, { useState, useEffect, useRef } from 'react';
import { 
    FaComments, FaRobot, FaUser, FaPaperPlane, FaXmark, FaMinus,
    FaUserClock, FaFileInvoiceDollar, FaUsers, FaHeadset 
} from 'react-icons/fa6';
import { motion, AnimatePresence } from 'framer-motion';

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [responsesDB, setResponsesDB] = useState({});
    const [language, setLanguage] = useState('en');
    const messagesEndRef = useRef(null);

    const languageContent = {
        en: { placeholder: "Type your message...", welcome: "Hello! I'm your AIHRMS assistant. How can I help you today?" },
        hi: { placeholder: "अपना संदेश टाइप करें...", welcome: "नमस्ते! मैं आपका AIHRMS सहायक हूं। आज मैं आपकी कैसे मदद कर सकता हूं?" }
    };

    const quickActionsData = [
        { action: 'attendance', icon: <FaUserClock />, en: 'Attendance', hi: 'अटेंडेंस' },
        { action: 'salary', icon: <FaFileInvoiceDollar />, en: 'Salary', hi: 'वेतन' },
        { action: 'employee', icon: <FaUsers />, en: 'Employees', hi: 'कर्मचारी' },
        { action: 'support', icon: <FaHeadset />, en: 'Support', hi: 'सहायता' },
    ];

    useEffect(() => {
        fetch('/data/responses.json')
            .then(response => response.json())
            .then(data => setResponsesDB(data))
            .catch(error => console.error('Error loading responses:', error));
    }, []);

    useEffect(() => {
        setMessages([{
            type: 'bot',
            text: languageContent[language].welcome,
            time: new Date()
        }]);
    }, [language]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const toggleChat = () => {
        if (!isOpen) {
            setIsOpen(true);
            setIsMinimized(false);
        } else {
            setIsMinimized(!isMinimized);
        }
    };

    const addMessage = (type, text) => {
        const newMessage = { type, text, time: new Date() };
        setMessages(prev => [...prev, newMessage]);
        return newMessage;
    };
    
    const generateBotResponse = (userMessageText) => {
        const message = userMessageText.toLowerCase();
        const langResponses = responsesDB[language] || responsesDB['en'];
        
        if (!langResponses) return "I'm having trouble connecting to my knowledge base.";

        for (const category in langResponses) {
            for (const keyword in langResponses[category]) {
                if (message.includes(keyword)) {
                    const responses = langResponses[category][keyword];
                    return responses[Math.floor(Math.random() * responses.length)];
                }
            }
        }
        
        return language === 'hi' 
            ? "मैं AIHRMS में आपकी मदद कर सकता हूँ। अटेंडेंस, सैलरी, या कर्मचारी के बारे में पूछें।" 
            : "I can help with AIHRMS. Ask me about attendance, salary, or employees.";
    };

    const handleSendMessage = () => {
        if (inputValue.trim() === '') return;
        const userMsg = inputValue;
        addMessage('user', userMsg);
        setInputValue('');

        setTimeout(() => {
            const botResponseText = generateBotResponse(userMsg);
            addMessage('bot', botResponseText);
        }, 1200);
    };

    const handleQuickAction = (actionText) => {
        addMessage('user', actionText);
        setTimeout(() => {
            const botResponseText = generateBotResponse(actionText);
            addMessage('bot', botResponseText);
        }, 1200);
    };

    return (
        <div id="chatbot-container">
            <style jsx="true">{`
                #chatbot-container {
                    /* New styling for the container */
                    position: relative;
                    width: 70px;
                    height: 70px;
                    margin-left: auto; /* Pushes the container to the right */
                    margin-right: 24px; /* Space from the right edge of the page content */
                    margin-bottom: 24px; /* Space from the footer */
                }

                .chat-bubble {
                    width: 70px;
                    height: 70px;
                    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 28px;
                    cursor: pointer;
                    box-shadow: 0 8px 30px rgba(59, 130, 246, 0.5);
                    transition: all 0.3s ease;
                    position: relative;
                }

                .chat-bubble:hover {
                    transform: scale(1.1);
                    box-shadow: 0 12px 40px rgba(59, 130, 246, 0.7);
                }
                
                .notification-dot {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    width: 12px;
                    height: 12px;
                    background: #ef4444;
                    border-radius: 50%;
                    border: 2px solid white;
                    animation: pulse 2s infinite;
                }
                
                .chat-window {
                    /* Changed from absolute to fixed to maintain its position on scroll */
                    position: fixed;
                    bottom: 90px;
                    right: 24px;
                    width: 400px;
                    height: 600px;
                    background: white;
                    border-radius: 20px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    z-index: 1000;
                }
                
                .chat-window.minimized {
                    height: 70px;
                }

                .chat-header {
                    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                    color: white;
                    padding: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-shrink: 0;
                }
                
                .chat-bot-info { display: flex; align-items: center; gap: 12px; }
                .bot-avatar {
                    width: 45px; height: 45px; background: rgba(255, 255, 255, 0.2);
                    border-radius: 50%; display: flex; align-items: center; justify-content: center;
                    font-size: 20px;
                }
                .bot-details h3 { font-size: 16px; font-weight: 600; margin-bottom: 4px; margin-top: 0; }
                .bot-details p { font-size: 12px; display: flex; align-items: center; gap: 6px; opacity: 0.9; margin: 0; }
                .status-dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; animation: status-pulse 2s infinite; }
                
                .chat-actions { display: flex; gap: 8px; align-items: center; }
                .language-selector select {
                    background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.3);
                    border-radius: 6px; color: white; padding: 6px 10px; font-size: 12px; cursor: pointer; outline: none;
                }
                .language-selector select option { background: white; color: #333; }
                .action-btn {
                    width: 32px; height: 32px; border: none; background: rgba(255, 255, 255, 0.1); color: white;
                    border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center;
                    transition: all 0.2s;
                }
                .action-btn:hover { background: rgba(255, 255, 255, 0.2); transform: scale(1.1); }
                
                .chat-messages { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; }
                .chat-messages::-webkit-scrollbar { width: 6px; }
                .chat-messages::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
                .chat-messages::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }

                .message { display: flex; gap: 12px; max-width: 100%; }
                .message.user-message { flex-direction: row-reverse; }
                .message-avatar {
                    width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center;
                    justify-content: center; font-size: 14px; flex-shrink: 0;
                }
                .bot-message .message-avatar { background: #e0f2fe; color: #0369a1; }
                .user-message .message-avatar { background: #dbeafe; color: #1d4ed8; }
                .message-content { flex: 1; display: flex; flex-direction: column; gap: 8px; }
                .message-bubble { padding: 12px 16px; border-radius: 18px; word-wrap: break-word; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); }
                .message-bubble p { margin: 0; }
                .bot-message .message-bubble { background: #f1f5f9; color: #334155; border-bottom-left-radius: 6px; }
                .user-message .message-bubble { background: #3b82f6; color: white; border-bottom-right-radius: 6px; }
                .message-time { font-size: 11px; color: #64748b; padding: 0 8px; }
                .user-message .message-time { text-align: right; }
                
                .quick-actions {
                    padding: 16px 20px; border-top: 1px solid #e2e8f0; background: #f8fafc;
                    display: grid; grid-template-columns: 1fr 1fr; gap: 8px; flex-shrink: 0;
                }
                .quick-btn {
                    padding: 10px 12px; background: white; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 12px;
                    color: #475569; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px; justify-content: center;
                }
                .quick-btn:hover { background: #3b82f6; color: white; border-color: #3b82f6; transform: translateY(-2px); }
                
                .chat-input-container { padding: 16px 20px; border-top: 1px solid #e2e8f0; background: white; flex-shrink: 0; }
                .chat-input-wrapper {
                    display: flex; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0;
                    border-radius: 24px; padding: 4px; transition: all 0.2s;
                }
                .chat-input-wrapper:focus-within { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
                .chat-input { flex: 1; border: none; outline: none; padding: 8px 16px; font-size: 14px; background: transparent; color: #374151; }
                .send-btn {
                    width: 36px; height: 36px; background: #3b82f6; color: white; border: none; border-radius: 50%;
                    cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;
                }
                .send-btn:hover { background: #2563eb; transform: scale(1.05); }

                @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.2); opacity: 0.7; } }
                @keyframes status-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                
                @media (max-width: 480px) {
                    .chat-window {
                        width: calc(100vw - 40px);
                        right: 20px;
                        height: 70vh;
                        bottom: 80px;
                    }
                }
            `}</style>
            
            <motion.div 
                id="chat-bubble" 
                className="chat-bubble" 
                onClick={toggleChat}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                <FaComments />
                <span className="notification-dot"></span>
            </motion.div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        id="chat-window"
                        className={`chat-window ${isMinimized ? 'minimized' : ''}`}
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                        <div className="chat-header">
                            <div className="chat-bot-info">
                                <div className="bot-avatar"><FaRobot /></div>
                                <div className="bot-details">
                                    <h3 className="bot-name">AIHRMS Assistant</h3>
                                    <p className="bot-status"><span className="status-dot"></span>Online</p>
                                </div>
                            </div>
                            <div className="chat-actions">
                                <div className="language-selector">
                                    <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                                        <option value="en">🇺🇸 English</option>
                                        <option value="hi">🇮🇳 Hindi</option>
                                    </select>
                                </div>
                                <button onClick={() => setIsMinimized(true)} className="action-btn" title="Minimize"><FaMinus /></button>
                                <button onClick={() => setIsOpen(false)} className="action-btn" title="Close"><FaXmark /></button>
                            </div>
                        </div>

                        <div id="chat-messages" className="chat-messages">
                            {messages.map((msg, index) => (
                                <div key={index} className={`message ${msg.type}-message`}>
                                    <div className="message-avatar">{msg.type === 'bot' ? <FaRobot /> : <FaUser />}</div>
                                    <div className="message-content">
                                        <div className="message-bubble"><p>{msg.text}</p></div>
                                        <div className="message-time">{msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        <div id="quick-actions" className="quick-actions">
                            {quickActionsData.map(({ action, icon, en, hi }) => (
                                <button key={action} className="quick-btn" onClick={() => handleQuickAction(language === 'hi' ? hi : en)}>
                                    {icon}
                                    <span className="btn-text">{language === 'hi' ? hi : en}</span>
                                </button>
                            ))}
                        </div>

                        <div className="chat-input-container">
                            <div className="chat-input-wrapper">
                                <input
                                    type="text"
                                    id="chat-input"
                                    placeholder={languageContent[language].placeholder}
                                    className="chat-input"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                />
                                <button id="send-btn" className="send-btn" title="Send" onClick={handleSendMessage}>
                                    <FaPaperPlane />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Chatbot;
