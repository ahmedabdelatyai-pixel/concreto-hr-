const https = require('https');
const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'client', 'public', 'models');

if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

const baseUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';
const files = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_expression_model-weights_manifest.json',
  'face_expression_model-shard1'
];

function downloadFile(filename) {
  return new Promise((resolve, reject) => {
    const dest = path.join(modelsDir, filename);
    if (fs.existsSync(dest)) {
      console.log(`File ${filename} already exists, skipping.`);
      return resolve();
    }
    
    console.log(`Downloading ${filename}...`);
    const file = fs.createWriteStream(dest);
    
    https.get(baseUrl + filename, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
          console.log(`Downloaded ${filename}`);
        });
      } else if (response.statusCode === 302 || response.statusCode === 301) {
        // handle redirect
        https.get(response.headers.location, (responseRedirect) => {
          responseRedirect.pipe(file);
          file.on('finish', () => {
            file.close(resolve);
            console.log(`Downloaded ${filename}`);
          });
        }).on('error', (err) => {
          fs.unlink(dest, () => reject(err));
        });
      } else {
        file.close();
        fs.unlink(dest, () => reject(new Error(`Server responded with ${response.statusCode}`)));
      }
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function main() {
  try {
    for (const file of files) {
      await downloadFile(file);
    }
    console.log('All models downloaded successfully!');
  } catch (error) {
    console.error('Error downloading models:', error);
  }
}

main();
