import { ColorSwatch, Group } from '@mantine/core';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import Draggable from 'react-draggable';
import { SWATCHES } from '@/constants';
import { ResultCard } from '@/components/ResultCard';
import { PlayIcon, TrashIcon } from '@heroicons/react/24/solid';

interface GeneratedResult {
    expression: string;
    answer: string;
}

interface Response {
    expr: string;
    result: string;
    assign: boolean;
}

export default function Home() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('rgb(255, 255, 255)');
    const [reset, setReset] = useState(false);
    const [dictOfVars, setDictOfVars] = useState({});
    const [result, setResult] = useState<GeneratedResult>();
    const [latexPosition, setLatexPosition] = useState({ x: 10, y: 200 });
    const [latexExpression, setLatexExpression] = useState<Array<string>>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (latexExpression.length > 0 && window.MathJax) {
            setTimeout(() => {
                window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
            }, 0);
        }
    }, [latexExpression]);

    useEffect(() => {
        if (result) {
            renderLatexToCanvas(result.expression, result.answer);
        }
    }, [result]);

    useEffect(() => {
        if (reset) {
            resetCanvas();
            setLatexExpression([]);
            setResult(undefined);
            setDictOfVars({});
            setReset(false);
        }
    }, [reset]);

    useEffect(() => {
        const canvas = canvasRef.current;

        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight - canvas.offsetTop;
                ctx.lineCap = 'round';
                ctx.lineWidth = 3;
            }
        }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js?config=TeX-MML-AM_CHTML';
        script.async = true;
        document.head.appendChild(script);

        script.onload = () => {
            window.MathJax.Hub.Config({
                tex2jax: { inlineMath: [['$', '$'], ['\\(', '\\)']] },
            });
        };

        return () => {
            document.head.removeChild(script);
        };

    }, []);

    const renderLatexToCanvas = (expression: string, answer: string) => {
        const latex = `\\(\\LARGE{${expression} = ${answer}}\\)`;
        setLatexExpression([...latexExpression, latex]);

        // Clear the main canvas
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    };

    const resetCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.style.background = 'black';
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.beginPath();
                ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                setIsDrawing(true);
            }
        }
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) {
            return;
        }
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.strokeStyle = color;
                ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                ctx.stroke();
            }
        }
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const runRoute = async () => {
        const canvas = canvasRef.current;

        if (canvas) {
            try {
                setLoading(true);
                const response = await axios({
                    method: 'post',
                    url: `${import.meta.env.VITE_API_URL}/calculate`,
                    data: {
                        image: canvas.toDataURL('image/png'),
                        dict_of_vars: dictOfVars
                    }
                });

                const resp = await response.data;
                console.log('Response:', resp);
                resp.data.forEach((data: Response) => {
                    if (data.assign === true) {
                        setDictOfVars({
                            ...dictOfVars,
                            [data.expr]: data.result
                        });
                    }
                });
                const ctx = canvas.getContext('2d');
                const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
                let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;

                for (let y = 0; y < canvas.height; y++) {
                    for (let x = 0; x < canvas.width; x++) {
                        const i = (y * canvas.width + x) * 4;
                        if (imageData.data[i + 3] > 0) {  // If pixel is not transparent
                            minX = Math.min(minX, x);
                            minY = Math.min(minY, y);
                            maxX = Math.max(maxX, x);
                            maxY = Math.max(maxY, y);
                        }
                    }
                }

                const centerX = (minX + maxX) / 2;
                const centerY = (minY + maxY) / 2;

                setLatexPosition({ x: centerX, y: centerY });
                // Set result immediately, no delay
                if (resp.data && resp.data.length > 0) {
                    const data = resp.data[0];
                    setResult({
                        expression: data.expr,
                        answer: data.result
                    });
                }
                setLoading(false);
            } catch (error) {
                setLoading(false);
                console.error('Error in runRoute:', error);
            }
        }
    };

    return (
        <div className="relative w-screen h-screen bg-gray-900 flex flex-col items-center">
            {/* Modern Header */}
            <header className="w-full py-8 flex flex-col items-center bg-gradient-to-b from-gray-900 to-gray-800 shadow-lg z-40">
                <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">BrainCalc</h1>
                <p className="text-lg text-gray-300 max-w-xl text-center">A modern, AI-powered math workspace. Draw, calculate, and visualize math with ease!</p>
            </header>
            {/* Modern Toolbar */}
            <div className="relative z-30 w-full flex flex-col items-center">
                <div className="mt-6 mb-4 flex flex-row items-center justify-center gap-8 bg-gray-800/80 rounded-xl px-8 py-4 shadow-lg border border-gray-700">
                    {/* Color Palette */}
                    <div className="flex flex-col items-center mr-8">
                        <span className="text-gray-300 text-sm mb-2">Pencil Colors</span>
                        <div className="flex flex-row gap-2">
                            {SWATCHES.map((swatch) => (
                                <button
                                    key={swatch}
                                    onClick={() => setColor(swatch)}
                                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${color === swatch ? 'border-yellow-400 scale-110 shadow-lg' : 'border-gray-600'} focus:outline-none`}
                                    style={{ background: swatch }}
                                    aria-label={`Select color ${swatch}`}
                                />
                            ))}
                        </div>
                    </div>
                    {/* Run Button */}
                    <button
                        onClick={runRoute}
                        className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow transition-all text-lg focus:outline-none"
                    >
                        <PlayIcon className="w-6 h-6" />
                        Run
                    </button>
                    {/* Reset Button */}
                    <button
                        onClick={() => setReset(true)}
                        className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow transition-all text-lg focus:outline-none ml-4"
                    >
                        <TrashIcon className="w-6 h-6" />
                        Reset
                    </button>
                </div>
            </div>
            {/* Canvas */}
            <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
            />
            {/* Loading Spinner */}
            {loading && (
                <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-40 flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <span className="text-white text-lg">Solving...</span>
                </div>
            )}
            {/* Result Display with animation */}
            {result && !loading && (
                <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-30 w-full max-w-xl transition-all duration-700 ease-out animate-fade-in">
                    <ResultCard expression={result.expression} answer={result.answer} />
                </div>
            )}
        </div>
    );
}
