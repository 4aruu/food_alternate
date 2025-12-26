import React, { useState } from 'react';
import { Sparkles, Loader, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

// Use your configured API URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const SmartSwapButton = ({ originalName, alternativeName }) => {
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAskAI = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/foods/explain-swap`, {
        original: originalName,
        alternative: alternativeName
      });
      setExplanation(response.data.explanation);
    } catch (error) {
      console.error("AI Error:", error);
      setExplanation("This is a smarter choice for your health goals!");
    }
    setLoading(false);
  };

  return (
    <div className="mt-2">
      {!explanation ? (
        <button
          onClick={handleAskAI}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 text-black px-3 py-1.5 rounded-full hover:opacity-90 transition-all shadow-lg shadow-emerald-500/20"
        >
          {loading ? <Loader className="animate-spin" size={14} /> : <Sparkles size={14} />}
          {loading ? 'Asking AI...' : 'Why is this better?'}
        </button>
      ) : (
        <div className="bg-surface border border-emerald-500/30 p-3 rounded-lg mt-2 animate-fade-in">
          <p className="text-sm text-gray-300 flex gap-2 items-start">
            <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={16} />
            "{explanation}"
          </p>
        </div>
      )}
    </div>
  );
};

export default SmartSwapButton;