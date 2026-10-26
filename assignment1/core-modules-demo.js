const os = require('os');
const path = require('path');
const fs = require('fs');

const sampleFilesDir = path.join(__dirname, 'sample-files');
if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, { recursive: true });
}

async function runCoreModulesDemo() {
  // OS module
  console.log('Platform:', os.platform());
  console.log('CPU:', os.cpus()[0]?.model || 'Unknown CPU');
  console.log('Total Memory:', os.totalmem());

  // Path module
  const joinedPath = path.join(sampleFilesDir, 'folder', 'file.txt');
  console.log('Joined path:', joinedPath);

  // fs.promises API
  const demoFilePath = path.join(sampleFilesDir, 'demo.txt');
  await fs.promises.writeFile(demoFilePath, 'Hello from fs.promises!');
  const demoContent = await fs.promises.readFile(demoFilePath, 'utf8');
  console.log('fs.promises read:', demoContent);

  // Streams for large files - log first 40 chars of each chunk
  const largeFilePath = path.join(sampleFilesDir, 'largefile.txt');
  let largeFileContent = '';
  for (let index = 1; index <= 100; index++) {
    largeFileContent += `This is line ${index} of text inside a large file for stream testing.\n`;
  }
  fs.writeFileSync(largeFilePath, largeFileContent);

  const readStream = fs.createReadStream(largeFilePath, {
    encoding: 'utf8',
    highWaterMark: 1024,
  });

  // Wrap the stream in a Promise so it can be properly awaited,
  // ensuring any code after this block runs only after streaming is complete.
  await new Promise((resolve, reject) => {
    readStream.on('data', (chunk) => {
      console.log(`Read chunk: ${chunk.slice(0, 40).replace(/\n/g, ' ')}...`);
    });

    readStream.on('end', () => {
      console.log('Finished reading large file with streams.');
      resolve();
    });

    readStream.on('error', reject);
  });
}

runCoreModulesDemo();
