const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const svgCode = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00d4aa" />
      <stop offset="100%" stop-color="#7b68ee" />
    </linearGradient>
    <style>
      /* Using a highly compatible, bold font approach */
      .text {
        font-family: 'Arial Black', Impact, sans-serif;
        font-weight: 900;
        font-size: 145px;
        fill: url(#textGrad);
        letter-spacing: -1px;
      }
    </style>
  </defs>
  <rect width="512" height="512" fill="#0a0a14" />
  <!-- FIKRA text filling the bounds nicely -->
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" class="text">FIKRA</text>
</svg>
`;

const publicDir = path.join(__dirname, '../client/public');

async function generateLogos() {
  console.log('Generating logos...');
  const svgBuffer = Buffer.from(svgCode);

  // 1. logo512.png
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'logo512.png'));
  console.log('Created logo512.png');

  // 2. logo192.png
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'logo192.png'));
  console.log('Created logo192.png');

  // 3. apple-touch-icon.png
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png');

  // 4. favicon.png (can be used as favicon)
  await sharp(svgBuffer)
    .resize(256, 256)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('Created favicon.png');

  // Also save the SVG itself
  fs.writeFileSync(path.join(publicDir, 'logo.svg'), svgCode);
  console.log('Created logo.svg');

  console.log('All logos generated successfully!');
}

generateLogos().catch(console.error);
