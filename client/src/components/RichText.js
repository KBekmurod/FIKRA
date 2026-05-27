import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import 'katex/dist/contrib/mhchem.js';

function parseBasicMarkdown(text) {
    if (!text) return '';
    return text
        .replace(/^>\s*(.+)$/gm, '<blockquote>$1</blockquote>')
        .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
        .replace(/\*([^*]+)\*/g, '<i>$1</i>')
        .replace(/\n/g, '<br/>');
}

function tokenize(text) {
    if (!text)
        return [];
    var tokens = [];
    var re = /(\$\$([\s\S]+?)\$\$)|(\$([^\$\n]+?)\$)/g;
    var lastIndex = 0;
    var match;
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

export default function RichText(_a) {
    var content = _a.content, images = _a.images, className = _a.className, inline = _a.inline;
    var containerRef = useRef(null);
    useEffect(function () {
        if (!containerRef.current)
            return;
        var mathElements = containerRef.current.querySelectorAll('[data-math]');
        mathElements.forEach(function (el) {
            var tex = el.getAttribute('data-math') || '';
            var isBlock = el.getAttribute('data-block') === '1';
            try {
                katex.render(tex, el, {
                    throwOnError: false,
                    displayMode: isBlock,
                    output: 'html',
                    trust: true,
                    strict: false
                });
            }
            catch (e) {
                el.textContent = "$" + tex + "$";
            }
        });
    }, [content]);
    
    var tokens = tokenize(content || '');
    var Container = inline ? 'span' : 'div';
    
    return (<Container ref={containerRef} className={"rich-text " + (className || '')}>
      {tokens.map(function (tok, i) {
        if (tok.type === 'text') {
            return <span key={i} dangerouslySetInnerHTML={{ __html: parseBasicMarkdown(tok.value) }} />;
        }
        if (tok.type === 'inline_math') {
            return (<span key={i} data-math={tok.value} data-block="0" className="math-inline"/>);
        }
        if (tok.type === 'block_math') {
            return (<div key={i} data-math={tok.value} data-block="1" className="math-block"/>);
        }
        return null;
      })}
      {images && images.length > 0 && (<div className="rich-text-images">
          {images.map(function (src, i) { return (<img key={i} src={src} alt={"rasm-" + (i + 1)} className="rich-text-img" loading="lazy"/>); })}
        </div>)}
    </Container>);
}
