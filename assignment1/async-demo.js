const fs = require('fs');
const path = require('path');

const sampleFilesDir = path.join(__dirname, 'sample-files');
const sampleFilePath = path.join(sampleFilesDir, 'sample.txt');

// Ensure sample-files directory exists
if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, { recursive: true });
}

// Write a sample file for demonstration
fs.writeFileSync(sampleFilePath, 'Hello, async world!');

// 1. Callback style
fs.readFile(sampleFilePath, 'utf8', (readErr, content) => {
  if (readErr) {
    console.warn('Callback read failed:', readErr.message);
    return;
  }
  console.log(`Callback: ${content}`);
});

// Callback hell example (test and leave it in comments):
// "Callback hell" (or the "Pyramid of Doom") happens when multiple asynchronous
// operations depend on the result of the previous one. Each operation requires
// another level of nested callbacks, making the code hard to read, maintain, and debug:
//
// fs.readFile('file1.txt', 'utf8', (err1, data1) => {
//   if (err1) return console.log(err1);
//   fs.readFile('file2.txt', 'utf8', (err2, data2) => {
//     if (err2) return console.log(err2);
//     fs.readFile('file3.txt', 'utf8', (err3, data3) => {
//       if (err3) return console.log(err3);
//       console.log('All files read:', data1, data2, data3);
//     });
//   });
// });

// 2. Promise style
fs.promises
  .readFile(sampleFilePath, 'utf8')
  .then((content) => {
    console.log(`Promise: ${content}`);
  })
  .catch((promiseErr) => {
    console.warn('Promise read failed:', promiseErr.message);
  });

// 3. Async/Await style
async function readFileWithAsyncAwait() {
  try {
    const content = await fs.promises.readFile(sampleFilePath, 'utf8');
    console.log(`Async/Await: ${content}`);
  } catch (asyncErr) {
    console.warn('Async/Await read failed:', asyncErr.message);
  }
}

readFileWithAsyncAwait();
