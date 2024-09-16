// src/types/mathjax.d.ts

export {};

declare global {
    interface Window {
        MathJax: any;  // You can refine this with proper types if you know MathJax's structure
    }
}
