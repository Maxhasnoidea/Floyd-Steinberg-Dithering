let img;
let fileInput;

function setup() {
  createCanvas(512, 512); // Temporary canvas size
  background(200);

  // Create a file input element
  fileInput = createFileInput(handleFile);
  fileInput.position(0, 0);
}

function handleFile(file) {
  if (file.type === 'image') {
    img = loadImage(file.data, () => {
      compressImageByFactor(img, 0.8); // Change the factor as needed
      resizeCanvas(img.width, img.height);
      adjustContrast(img, 1); // Change the contrast factor as needed
      makeDithered(img, 1);
      image(img, 0, 0);
      // Apply gray filter to the whole canvas
      filter(GRAY);
    });
  } else {
    console.log('Not an image file!');
  }
}

function keyPressed() {
  if (key === 'd' || key === 'D') {
    // Create a new graphics buffer to apply the filter
    let grayImg = createGraphics(img.width, img.height);
    grayImg.image(img, 0, 0);
    grayImg.filter(GRAY);
    grayImg.save('dithered_image.jpg');
  }
}

function compressImage(img, newWidth) {
  let aspectRatio = img.height / img.width;
  img.resize(newWidth, newWidth * aspectRatio);
}

function compressImageByFactor(img, factor) {
  let newWidth = img.width * factor;
  let newHeight = img.height * factor;
  img.resize(newWidth, newHeight);
}

function adjustContrast(img, factor) {
  img.loadPixels();
  for (let i = 0; i < img.pixels.length; i += 4) {
    img.pixels[i] = constrain(128 + factor * (img.pixels[i] - 128), 0, 255);     // Red
    img.pixels[i + 1] = constrain(128 + factor * (img.pixels[i + 1] - 128), 0, 255); // Green
    img.pixels[i + 2] = constrain(128 + factor * (img.pixels[i + 2] - 128), 0, 255); // Blue
  }
  img.updatePixels();
}

function imageIndex(img, x, y) {
  return 4 * (x + y * img.width);
}

function getColorAtindex(img, x, y) {
  let idx = imageIndex(img, x, y);
  let pix = img.pixels;
  let red = pix[idx];
  let green = pix[idx + 1];
  let blue = pix[idx + 2];
  let alpha = pix[idx + 3];
  return color(red, green, blue, alpha);
}

function setColorAtIndex(img, x, y, clr) {
  let idx = imageIndex(img, x, y);

  let pix = img.pixels;
  pix[idx] = red(clr);
  pix[idx + 1] = green(clr);
  pix[idx + 2] = blue(clr);
  pix[idx + 3] = alpha(clr);
}

// Finds the closest step for a given value
// The step 0 is always included, so the number of steps
// is actually steps + 1
function closestStep(max, steps, value) {
  return round(steps * value / 255) * floor(255 / steps);
}

function makeDithered(img, steps) {
  img.loadPixels();

  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      let clr = getColorAtindex(img, x, y);
      let oldR = red(clr);
      let oldG = green(clr);
      let oldB = blue(clr);
      let newR = closestStep(255, steps, oldR);
      let newG = closestStep(255, steps, oldG);
      let newB = closestStep(255, steps, oldB);

      let newClr = color(newR, newG, newB);
      setColorAtIndex(img, x, y, newClr);

      let errR = oldR - newR;
      let errG = oldG - newG;
      let errB = oldB - newB;

      distributeError(img, x, y, errR, errG, errB);
    }
  }

  img.updatePixels();
}

function distributeError(img, x, y, errR, errG, errB) {
  addError(img, 7 / 16.0, x + 1, y, errR, errG, errB);
  addError(img, 3 / 16.0, x - 1, y + 1, errR, errG, errB);
  addError(img, 5 / 16.0, x, y + 1, errR, errG, errB);
  addError(img, 1 / 16.0, x + 1, y + 1, errR, errG, errB);
}

function addError(img, factor, x, y, errR, errG, errB) {
  if (x < 0 || x >= img.width || y < 0 || y >= img.height) return;
  let clr = getColorAtindex(img, x, y);
  let r = red(clr);
  let g = green(clr);
  let b = blue(clr);
  clr.setRed(r + errR * factor);
  clr.setGreen(g + errG * factor);
  clr.setBlue(b + errB * factor);

  setColorAtIndex(img, x, y, clr);
}