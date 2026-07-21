"use client";

import React from "react";

export interface MultiTokenFilterInputProps {
  label?: string;
  placeholder?: string;
  tokens: string[];
  inputValue: string;
  suggestions: string[];
  onInputChange: (value: string) => void;
  onAddToken: (value: string) => void;
  onRemoveToken: (value: string) => void;
}

export default function MultiTokenFilterInput({
  label,
  placeholder,
  tokens,
  inputValue,
  suggestions,
  onInputChange,
  onAddToken,
  onRemoveToken,
}: MultiTokenFilterInputProps) {
  const normalizedInput = inputValue.trim().toLowerCase();
  const tooltipText =
    tokens.length > 0
      ? tokens.map((token, index) => `+${index + 1}: ${token}`).join("\n")
      : "";
  const filteredSuggestions = suggestions
    .filter((item) => {
      const normalizedItem = item.toLowerCase();
      const alreadyAdded = tokens.some(
        (token) => token.toLowerCase() === normalizedItem,
      );
      return (
        !alreadyAdded &&
        normalizedInput.length > 0 &&
        normalizedItem.includes(normalizedInput)
      );
    })
    .slice(0, 6);

  return (
    <div className="relative min-w-0">
      {label && (
        <label className="block text-[10px] font-semibold tracking-wider text-v3-text opacity-70 mb-1.5 uppercase ml-1">
          {label}
        </label>
      )}
      <div
        className="w-full h-10 px-3 text-xs border border-v3-border rounded-xl bg-black/5 dark:bg-black/20 flex items-center gap-1.5 overflow-x-auto focus-within:border-blue-500/50 focus-within:bg-black/5 dark:focus-within:bg-black/20 transition-all shadow-inner"
        title={tooltipText}
      >
        {tokens.map((token, index) => (
          <span
            key={`${token}-${index}`}
            className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-600 dark:text-blue-300"
            title={`+${index + 1}: ${token}`}
          >
            <span className="opacity-70 text-[10px]">+{index + 1}</span>
            <span className="font-medium">{token}</span>
            <button
              type="button"
              className="text-blue-600 dark:text-blue-300 hover:text-red-400 ml-0.5 opacity-70 hover:opacity-100 transition-opacity"
              onClick={() => onRemoveToken(token)}
              title="Kaldır"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          </span>
        ))}
        <input
          placeholder={placeholder}
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAddToken(inputValue);
            }
            if (
              e.key === "Backspace" &&
              inputValue.length === 0 &&
              tokens.length > 0
            ) {
              onRemoveToken(tokens[tokens.length - 1]);
            }
          }}
          className="flex-1 min-w-[80px] h-full bg-transparent outline-none text-v3-text placeholder:text-v3-text opacity-70"
        />
      </div>
      {filteredSuggestions.length > 0 && (
        <div className="absolute z-20 mt-2 w-full bg-v3-surface backdrop-blur-xl border border-v3-border rounded-xl shadow-2xl max-h-48 overflow-y-auto overflow-hidden custom-scrollbar">
          {filteredSuggestions.map((suggestion) => (
            <button
              type="button"
              key={suggestion}
              className="w-full text-left px-4 py-2.5 text-xs font-medium text-v3-text hover:bg-blue-500/20 hover:text-blue-600 dark:text-blue-300 transition-colors border-b border-v3-border last:border-0"
              onClick={() => onAddToken(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
