import path from "node:path";
import { mkdirSync, readdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import outdent from "outdent";
import Spritesmith from "spritesmith";

import {
  SpriteSheet,
  SpritesmithCoordinates,
  SpritesmithResult,
} from "./types.d";

function ensureDirSync(path: string): boolean {
  if (!readdirSync(path)) {
    mkdirSync(path);

    return true;
  }

  return false;
}

/**
 * Generates the CSS sprite sheet from a list of images.
 *
 * @param {array} images List of image paths for building the spritesheet
 * @param {string} outputPath Path for the directory for the generated assets
 * @param {string} fileName Name for the generated asset files (without file extension)
 */
export function createSpriteSheet(
  images: string[],
  outputPath: string,
  fileName: string,
) {
  const spriteSheetPath = path.join(outputPath, `${fileName}.png`);
  const styleSheetPath = path.join(outputPath, `${fileName}.css`);

  if (images.length < 1) {
    throw new Error("No images provided!");
  }

  const spritesheet = generateSpriteSheet(images, fileName);

  spritesheet.then(
    (result: SpriteSheet) => {
      // Create output directory
      ensureDirSync(outputPath);

      // Save sprite sheet image file
      writeFile(spriteSheetPath, result.image).catch((err) =>
        err && console.log(err)
      );

      // Save style sheet file
      writeFile(styleSheetPath, result.css).catch((err) =>
        err && console.log(err)
      );
    },
    (err: Error) => {
      console.log(err);
    },
  );
}

export function generateSpriteSheet(
  images: string[],
  fileName: string,
): Promise<SpriteSheet> {
  let imageSize: number | null = null;

  if (images.length < 1) {
    throw new Error("No images provided!");
  }

  const promise: Promise<SpriteSheet> = new Promise((resolve, reject) => {
    Spritesmith.run(
      { src: images, padding: 10 },
      (err: Error | null, result: SpritesmithResult | null) => {
        if (err) {
          return reject(err);
        }

        if (result) {
          // Try to infer the image size from the image width
          // This only works if every image has the same dimensions
          if (!imageSize) {
            const coordinatesObj = Object.entries(result.coordinates)[0][1];
            imageSize = coordinatesObj.width;
          }

          resolve({
            image: result.image,
            css: generateStyleSheet(
              result.coordinates,
              imageSize,
              `${fileName}.png`,
            ),
          });
        }
      },
    );
  });

  return promise;
}

/**
 * Generates a style sheet with the coordinates of each image of a sprite sheet.
 *
 * @param {object} coordinates An object with coordinates of each sprite
 * @param {number} spriteSize The original size of the images used in the sprite sheet
 * @param {string} spriteSheetFileName The name of the sprite sheet file
 * @returns a CSS style sheet
 */
function generateStyleSheet(
  coordinates: SpritesmithCoordinates,
  spriteSize: number,
  spriteSheetFileName: string,
) {
  // The default size for rendering each sprite image
  // This can be overriden by changing the value of the '--size' property in the '.sprite' element
  const targetSpriteSize = 32;

  let css = outdent`
        .sprite {
            --size: ${targetSpriteSize};
            --original-size: ${spriteSize};
            position: relative;
            width: calc(var(--size) * 1px);
            height: calc(var(--size) * 1px);
        }
        
        .sprite:after {
            content: '';
            display: block;
            width: calc(var(--original-size) * 1px);
            height: calc(var(--original-size) * 1px);
            position: absolute;
            top: calc(calc((var(--original-size) - var(--size)) / -2) * 1px);
            left: calc(calc((var(--original-size) - var(--size)) / -2) * 1px);
            transform: scale(calc(var(--size) / var(--original-size)));
            background: url('${spriteSheetFileName}') no-repeat;
        }


    `;

  // Get the sprite name from a file path (without file extension)
  // Replace all periods and spaces in the file name for hyphens
  // Example: 'images/boat.large.png' => 'boat-large'
  const getSpriteName = (filePath: string) => {
    const charsToReplace = /[\. ]+/g;

    return path
      .basename(filePath, path.extname(filePath))
      .replace(charsToReplace, "-");
  };

  for (const filePath in coordinates) {
    const spriteName = getSpriteName(filePath);
    const { x, y } = coordinates[filePath];

    css += outdent`
            .sprite--${spriteName}:after {
                background-position: -${x}px -${y}px;
            }


        `;
  }

  return css;
}
