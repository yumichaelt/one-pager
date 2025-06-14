'use client';

import { useState, useEffect } from 'react';
import { Suggestion } from '../../lib/content-analysis';

const severityConfig = {
    high: { icon: '🚨', color: 'text-red-600' },
    medium: { icon: '⚠️', color: 'text-yellow-600' },
    low: { icon: '💡', color: 'text-blue-600' },
};

interface ContentAnalysisWidgetProps {
  suggestions: Suggestion[];
}

export default function ContentAnalysisWidget({ suggestions }: ContentAnalysisWidgetProps) {
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (suggestions.length > 0) {
      setIsWidgetOpen(true);
    }
  }, [suggestions.length]);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {isWidgetOpen && (
        <div className="absolute bottom-full right-0 mb-4 w-80 bg-white rounded-lg shadow-xl border border-gray-200 origin-bottom-right transition-all duration-300 ease-in-out transform scale-100 opacity-100">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Content Analysis</h3>
            <button
              onClick={() => setIsWidgetOpen(false)}
              className="text-gray-500 hover:text-gray-800"
              aria-label="Close Content Analysis Widget"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-4 max-h-80 overflow-y-auto">
            {suggestions.length > 0 ? (
                <ul className="space-y-4">
                    {suggestions.map((suggestion) => {
                        const config = severityConfig[suggestion.severity];
                        return (
                            <li key={suggestion.id} className="flex items-start space-x-3">
                                <span className="text-xl mt-px">{config.icon}</span>
                                <p className={`text-sm ${config.color} flex-1`}>
                                    {suggestion.message}
                                </p>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <div className="text-center text-gray-600 py-4">
                    <div className="text-3xl mb-2">✅</div>
                    <p className="font-semibold">All clear!</p>
                    <p className="text-sm">Your one-pager looks great.</p>
                </div>
            )}
          </div>
        </div>
      )}
      <button
        onClick={() => setIsWidgetOpen(!isWidgetOpen)}
        className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors relative"
        aria-label="Toggle Content Analysis Widget"
      >
        {suggestions.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {suggestions.length}
            </span>
        )}
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </button>
    </div>
  );
} 