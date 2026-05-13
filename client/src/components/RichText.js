import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
// mhchem plugini KaTeX'ga qo'shadi (kimyo reaksiyalari uchun $\ce{...}$)
import 'katex/dist/contrib/mhchem.js';
function tokenize(text) {
    if (!text)
        return [];
    const tokens = [];
    // Avval $$...$$ (block) keyin $...$ (inline) ni topamiz
    // Regex: $$...$$ yoki $...$  (escape qilingan \$ ni e'tiborga olmaymiz)
    const re = /(\$\$([\s\S]+?)\$\$)|(\$([^\$\n]+?)\$)/g;
    let lastIndex = 0;
    let match;
    while ((match = re.exec(text)) !== null) {
        if (match.index > lastIndex) {
            tokens.push({ type: 'text', value: text.slice(lastIndex, match.index) });
        }
        if (match[1]) {
            tokens.push({ type: 'block_math', value: match[2] });
        }
        else if (match[3]) {
            tokens.push({ type: 'inline_math', value: match[4] });
        }
        lastIndex = re.lastIndex;
    }
    if (lastIndex < text.length) {
        tokens.push({ type: 'text', value: text.slice(lastIndex) });
    }
    return tokens;
}
export default function RichText({ content, images, className, inline }) {
    const containerRef = useRef(null);
    useEffect(() => {
        if (!containerRef.current)
            return;
        const mathElements = containerRef.current.querySelectorAll('[data-math]');
        mathElements.forEach(el => {
            const tex = el.getAttribute('data-math') || '';
            const isBlock = el.getAttribute('data-block') === '1';
            try {
                katex.render(tex, el, {
                    throwOnError: false,
                    displayMode: isBlock,
                    output: 'html',
                    trust: true,
                    strict: false,
                });
            }
            catch (e) {
                // Xato bo'lsa, oddiy matn sifatida ko'rsatish
                el.textContent = `$${tex}$`;
            }
        });
    }, [content]);
    const tokens = tokenize(content || '');
    const Container = inline ? 'span' : 'div';
    return (_jsxs(Container, { ref: containerRef, className: `rich-text ${className || ''}`, children: [tokens.map((tok, i) => {
                if (tok.type === 'text') {
                    // Yangi qatorlarni saqlash
                    return _jsx("span", { children: tok.value }, i);
                }
                if (tok.type === 'inline_math') {
                    return (_jsx("span", { "data-math": tok.value, "data-block": "0", className: "math-inline" }, i));
                }
                if (tok.type === 'block_math') {
                    return (_jsx("div", { "data-math": tok.value, "data-block": "1", className: "math-block" }, i));
                }
                return null;
            }), images && images.length > 0 && (_jsx("div", { className: "rich-text-images", children: images.map((src, i) => (_jsx("img", { src: src, alt: `rasm-${i + 1}`, className: "rich-text-img", loading: "lazy" }, i))) }))] }));
}
