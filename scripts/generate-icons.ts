import { writeFileSync, mkdirSync } from "node:fs";

mkdirSync("public/icons", { recursive: true });

function svgIcon(size: number, maskable: boolean): string {
    const padding = maskable ? size * 0.1 : 0;
    const fontSize = (size - 2 * padding) * 0.7;
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" fill="#1a1a1a"/>
  <text x="${size / 2}" y="${size / 2}" font-family="serif" font-size="${fontSize}" font-weight="900"
        fill="#f2ecd9" text-anchor="middle" dominant-baseline="central" letter-spacing="2">P</text>
</svg>`;
}

writeFileSync("public/icons/icon-192.svg", svgIcon(192, false));
writeFileSync("public/icons/icon-512.svg", svgIcon(512, false));
writeFileSync("public/icons/icon-maskable-512.svg", svgIcon(512, true));
writeFileSync("public/favicon.svg", svgIcon(64, false));

console.log("✓ Icons generated");
