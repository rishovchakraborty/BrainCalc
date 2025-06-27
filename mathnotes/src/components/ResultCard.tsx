import { useEffect, useRef } from 'react';

interface ResultCardProps {
  expression: string;
  answer: string;
}

export function ResultCard({ expression, answer }: ResultCardProps) {
  const latexRef = useRef<HTMLDivElement>(null);
  const latex = `\\(\\LARGE{${expression} = ${answer}}\\)`;

  useEffect(() => {
    if (window.MathJax && latexRef.current) {
      window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub, latexRef.current]);
    }
  }, [latex]);

  return (
    <div className="my-4 p-6 bg-gray-800 rounded-xl shadow-lg flex flex-col items-center border border-gray-700">
      <div className="text-lg font-bold text-white mb-2">Result</div>
      <div
        ref={latexRef}
        className="latex-content text-white text-2xl text-center min-h-[2.5rem]"
        dangerouslySetInnerHTML={{ __html: latex }}
      />
    </div>
  );
} 