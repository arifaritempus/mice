const fs = require('fs');

const code = fs.readFileSync('src/app/reports/page.tsx', 'utf8');
const returnIndex = code.indexOf('return (');
if (returnIndex === -1) process.exit(1);

const jsx = code.substring(returnIndex);

let i = 0;
const stack = [];
while (i < jsx.length) {
    if (jsx.substring(i, i+2) === '{/*') {
        i = jsx.indexOf('*/}', i) + 3;
        continue;
    }
    
    if (jsx[i] === '<' && jsx[i+1] !== ' ' && jsx[i+1] !== '=') {
        const isClosing = jsx[i+1] === '/';
        const startIdx = isClosing ? i+2 : i+1;
        let endNameIdx = startIdx;
        while (jsx[endNameIdx] && /[a-zA-Z0-9_-]/.test(jsx[endNameIdx])) {
            endNameIdx++;
        }
        const tagName = jsx.substring(startIdx, endNameIdx);
        
        if (tagName) {
            const tagEnd = jsx.indexOf('>', i);
            const fullTag = jsx.substring(i, tagEnd + 1);
            
            const isSelfClosing = fullTag.endsWith('/>');
            
            if (!isSelfClosing) {
                if (isClosing) {
                    const top = stack.pop();
                    if (!top || top.name !== tagName) {
                        console.log(`Mismatch at index ${i}. Expected ${top ? top.name : 'empty'}, found closing ${tagName}`);
                        const line = jsx.substring(0, i).split('\n').length;
                        console.log(`Line around return + ${line}`);
                        process.exit(1);
                    }
                } else {
                    // Ignore elements like <path>, <svg>, <option> which might be self closed without />? No, in JSX they must be self closed or have closing tags
                    // Let's just track them
                    stack.push({name: tagName, index: i});
                }
            }
        }
    }
    i++;
}

if (stack.length > 0) {
    console.log("Unclosed tags:", stack.map(s => s.name));
} else {
    console.log("All tags matched perfectly!");
}
