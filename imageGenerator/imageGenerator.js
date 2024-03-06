const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs');

async function imageGenerator(data) {
  try {
    const template = await loadImage('./imageGenerator/images/test-card.jpg');

    const canvas = createCanvas(template.width, template.height);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(template, 0, 0, canvas.width, canvas.height);

    const name = data.name;
    const id = data.id;
    registerFont('./imageGenerator/images/fonts/myfont.ttf', { family: 'MyFont' });
    ctx.fillStyle = 'Black';
    ctx.font = '30px MyFont';

    ctx.fillText(`Name: ${name}`, 120, 320);
    ctx.fillText(`Id: ${id}`, 120, 350);

    // const imageOutput = fs.createWriteStream('./imageGenerator/images/generated/generated-card.jpg');
    // const stream = canvas.createJPEGStream();
    // stream.pipe(imageOutput);

    return canvas.toBuffer('image/jpeg');
  } catch (err) {
    console.error('Error al generar la imagen: ', err);
  }
}

module.exports = { imageGenerator };
