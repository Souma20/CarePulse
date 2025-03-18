import 'regenerator-runtime/runtime';
import { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { MessageCircle, Mic, MicOff, Send, X } from 'lucide-react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

// Initialize GoogleGenerativeAI using your environment API key.
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// System prompt for structured responses.
const SYSTEM_PROMPT = `You are Doctor Assistant, a trusted medical guide for our India-based healthcare website. Respond to user queries about their symptoms in a clear, concise, and empathetic manner. Evaluate the user's symptoms to determine if they are minor or require urgent attention. For minor issues, offer brief self-care tips. For serious or worsening symptoms, advise immediate professional help and instruct users to use the "Book Appointment" button at the top right.

Guidelines for your responses:
-Prescribe medication for minor issues only.
- When required mention the emergency contacts directly
- Provide a clear, direct main answer.
- Use bullet points or numbered steps only when necessary.
- Avoid jargon and complex medical terms.
- Use a friendly, empathetic tone.
- Encourage users to seek professional help when needed and direct them to our appointments tab.
- When asked for guide redirect them to the Guides tab
- We have an emergency prompt for emergency cases so tell them that click the emergency button
- Offer general self-care tips for minor issues.
- Do not diagnose or prescribe medication.
- Do not provide emergency medical advice.
- Keep your responses short and to the point.
- Ask for clarification if needed.
- Do not include any formatting tags or labels in your output.
`;

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  
  const { transcript, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Text-to-speech function
  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    speechSynthesis.speak(utterance);
  };

  const handleVoiceInput = () => {
    if (!browserSupportsSpeechRecognition) {
      alert("Browser doesn't support speech recognition.");
      return;
    }

    if (isListening) {
      SpeechRecognition.stopListening();
      setIsListening(false);
      if (transcript) {
        setInput(transcript);
      }
    } else {
      resetTranscript();
      setIsListening(true);
      SpeechRecognition.startListening({ continuous: true });
    }
  };

  const handleSend = async () => {
    const messageToSend = input.trim() || transcript.trim();
    if (!messageToSend) return;

    // Add the user's message to the conversation.
    setMessages(prev => [...prev, { role: 'user', content: messageToSend }]);
    setInput('');
    resetTranscript();
    setIsLoading(true);

    try {
      // Use the gemini-1.5-flash model and generate content using the combined prompt.
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      // Combine the SYSTEM_PROMPT with the user's message.
      const prompt = `${SYSTEM_PROMPT}\nUser: ${messageToSend}`;
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      setMessages(prev => [...prev, { role: 'assistant', content: text }]);
      speak(text);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-yellow-400 text-black p-4 rounded-full shadow-lg hover:bg-yellow-500 transition-all duration-300 z-50"
      >
        <MessageCircle size={24} />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 w-96 h-[600px] bg-[#13142d] rounded-xl shadow-2xl flex flex-col z-50 border border-gray-700">
          {/* Header */}
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <h3 className="text-white font-bold">Med.AI Assistant</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-yellow-400 text-black'
                      : 'bg-gray-700 text-white'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-700 text-white p-3 rounded-lg">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Section */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center gap-2">
              <button
                onClick={handleVoiceInput}
                className="p-2 text-yellow-400 hover:bg-gray-700 rounded-full"
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              <input
                type="text"
                value={input || transcript}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isListening ? 'Listening...' : 'Type your message...'}
                className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
              <button
                onClick={handleSend}
                disabled={(!input.trim() && !transcript.trim()) || isLoading}
                className="p-2 text-yellow-400 hover:bg-gray-700 rounded-full disabled:text-gray-600 disabled:hover:bg-transparent"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
