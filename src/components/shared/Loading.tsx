'use client';

import React, { useState, useEffect } from "react";

interface LoadingProps {
  size?: "small" | "medium" | "large";
  message?: string;
  fullScreen?: boolean;
  color?: "blue" | "green" | "white";
}

const Loading: React.FC<LoadingProps> = ({
  size = "medium",
  message = "Đang tải...",
  fullScreen = false,
  color = "blue",
}) => {
  // Size configurations
  const sizeConfig = {
    small: { container: "w-8 h-8", text: "text-sm" },
    medium: { container: "w-16 h-16", text: "text-base" },
    large: { container: "w-24 h-24", text: "text-lg" },
  };

  // Color configurations
  const colorConfig = {
    blue: "text-blue-600",
    green: "text-green-600",
    white: "text-white",
  };

  const DNAIcon = () => (
    <div className={`${sizeConfig[size].container} relative`}>
      <svg
        className={`w-full h-full ${colorConfig[color]}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        {/* DNA Animation Styles */}
        <defs>
          <style>
            {`
              .dna-strand1 {
                animation: dna-rotate 3s linear infinite;
                transform-origin: 12px 12px;
              }
              .dna-strand2 {
                animation: dna-rotate 3s linear infinite reverse;
                transform-origin: 12px 12px;
              }
              .dna-glow {
                filter: drop-shadow(0 0 6px currentColor);
                animation: dna-pulse 2s ease-in-out infinite;
              }
              .dna-connecting {
                animation: dna-fade 1.5s ease-in-out infinite;
              }
              @keyframes dna-rotate {
                0% { transform: rotateY(0deg); }
                100% { transform: rotateY(360deg); }
              }
              @keyframes dna-pulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.7; transform: scale(1.1); }
              }
              @keyframes dna-fade {
                0%, 100% { opacity: 0.4; }
                50% { opacity: 1; }
              }
            `}
          </style>
        </defs>

        <g className="dna-glow">
          {/* Left DNA Strand */}
          <g className="dna-strand1">
            <path
              d="M8 2c0 4-2 6-2 10s2 6 2 10"
              strokeLinecap="round"
              strokeWidth="2"
            />
            <circle cx="8" cy="4" r="1.5" fill="currentColor" />
            <circle cx="6" cy="8" r="1.5" fill="currentColor" />
            <circle cx="8" cy="12" r="1.5" fill="currentColor" />
            <circle cx="6" cy="16" r="1.5" fill="currentColor" />
            <circle cx="8" cy="20" r="1.5" fill="currentColor" />
          </g>

          {/* Right DNA Strand */}
          <g className="dna-strand2">
            <path
              d="M16 2c0 4 2 6 2 10s-2 6-2 10"
              strokeLinecap="round"
              strokeWidth="2"
            />
            <circle cx="16" cy="4" r="1.5" fill="currentColor" />
            <circle cx="18" cy="8" r="1.5" fill="currentColor" />
            <circle cx="16" cy="12" r="1.5" fill="currentColor" />
            <circle cx="18" cy="16" r="1.5" fill="currentColor" />
            <circle cx="16" cy="20" r="1.5" fill="currentColor" />
          </g>

          {/* Connecting Lines with Fade Animation */}
          <g className="dna-connecting">
            <line x1="8" y1="4" x2="16" y2="4" stroke="currentColor" strokeWidth="1" />
            <line x1="6" y1="8" x2="18" y2="8" stroke="currentColor" strokeWidth="1" />
            <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="1" />
            <line x1="6" y1="16" x2="18" y2="16" stroke="currentColor" strokeWidth="1" />
            <line x1="8" y1="20" x2="16" y2="20" stroke="currentColor" strokeWidth="1" />
          </g>
        </g>
      </svg>
    </div>
  );

  // Full screen loading overlay
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <div className="flex flex-col items-center justify-center space-y-2">
          <DNAIcon />
          {message && (
            <p
              className={`${sizeConfig[size].text} ${colorConfig[color]} font-medium animate-pulse text-center`}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Inline loading component
  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-2">
      <DNAIcon />
      {message && (
        <p
          className={`${sizeConfig[size].text} ${colorConfig[color]} font-medium animate-pulse text-center`}
        >
          {message}
        </p>
      )}
    </div>
  );
};

// Page Loading Component
export const PageLoading: React.FC<{ message?: string }> = ({
  message = "Đang tải trang...",
}) => <Loading size="large" message={message} fullScreen={true} color="blue" />;

// Button Loading Component
export const ButtonLoading: React.FC<{ message?: string }> = ({
  message = "Đang xử lý...",
}) => (
  <div className="flex items-center justify-center space-x-2">
    <Loading size="small" message="" color="white" />
    {message && <span className="text-sm text-white">{message}</span>}
  </div>
);

// Card Loading Component
export const CardLoading: React.FC<{ message?: string }> = ({
  message = "Đang tải dữ liệu...",
}) => (
  <div className="p-8 bg-white border border-gray-200 rounded-lg shadow-sm">
    <Loading size="medium" message={message} color="blue" />
  </div>
);

// Medical Data Loading (for healthcare theme)
export const MedicalLoading: React.FC<{ message?: string }> = ({
  message = "Đang xử lý dữ liệu y tế...",
}) => (
  <div className="p-8 border border-blue-200 rounded-lg bg-gradient-to-br from-blue-50 to-green-50">
    <Loading size="large" message={message} color="green" />
    <div className="mt-4 text-center">
      <p className="text-xs text-gray-500">
        Hệ thống đang bảo mật xử lý thông tin của bạn
      </p>
    </div>
  </div>
);

// Loading with Progress Dots
export const LoadingWithDots: React.FC<{ message?: string }> = ({
  message = "Đang tải",
}) => {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-2">
      <Loading size="medium" message="" color="blue" />
      <p className="text-base font-medium text-blue-600 min-h-6">
        {message}
        {dots}
      </p>
    </div>
  );
};

export default Loading;
