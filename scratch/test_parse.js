const { marked } = require('marked');

function decodeHtml(text) {
  if (!text) return text;
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

function parseInlineTokens(tokens, inheritedStyles = {}) {
  if (!tokens || tokens.length === 0) return [];
  const segments = [];
  
  tokens.forEach(t => {
    let currentStyles = { ...inheritedStyles };
    if (t.type === 'strong') currentStyles.bold = true;
    if (t.type === 'em') currentStyles.italics = true;
    if (t.type === 'codespan') currentStyles.code = true;

    if (t.tokens && t.tokens.length > 0) {
      segments.push(...parseInlineTokens(t.tokens, currentStyles));
    } else {
      let decoded = decodeHtml(t.text || t.raw);
      segments.push({ text: decoded, ...currentStyles });
    }
  });
  
  return segments;
}

const text = "Bu **qalin**, bu *kursiv* va bu ***ikkalasi***. Noto\\'g\\'ri ** qalin **.";
const tokens = marked.lexer(text);
console.log(JSON.stringify(parseInlineTokens(tokens[0].tokens), null, 2));
