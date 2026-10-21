# Node.js Fundamentals

## What is Node.js?
Node.js is an open-source, cross-platform JavaScript runtime environment that allows developers to run JavaScript code outside of a web browser, directly on a computer or server.

## How does Node.js differ from running JavaScript in the browser?
In the browser, JavaScript runs in a sandboxed environment with access to browser-specific objects like window, document, and DOM elements, but cannot directly access the local file system. Node.js runs on the server and lacks browser objects like window or document, but has access to the operating system, file system, process information, and server-side network APIs.

## What is the V8 engine, and how does Node use it?
V8 is Google's open-source, high-performance JavaScript engine written in C++ that powers Google Chrome by compiling JavaScript into native machine code. Node.js uses the V8 engine at its core to execute JavaScript, wrapping it with system-level APIs for file access and networking.

## What are some key use cases for Node.js?
Key use cases for Node.js include building RESTful APIs and backend web servers, real-time applications (such as chat apps and live collaborative tools), command-line interface (CLI) utilities, and build scripts/automation tools.

## Explain the difference between CommonJS and ES Modules. Give a code example of each.

**CommonJS (default in Node.js):**
```js
// math.js - exporting
function add(a, b) {
  return a + b;
}
module.exports = { add };

// app.js - importing
const { add } = require('./math');
console.log(add(2, 3));
```

**ES Modules (supported in modern Node.js):**
```js
// math.mjs - exporting
export function add(a, b) {
  return a + b;
}

// app.mjs - importing
import { add } from './math.mjs';
console.log(add(2, 3));
```
