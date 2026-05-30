const { marked } = require('marked');
const tokens = marked.lexer("Bu **qalin**, bu *kursiv* va bu ***ikkalasi***. Noto'g'ri ** qalin **.");
console.log(JSON.stringify(tokens, null, 2));
