# Font Setup for GT-America-Mono

## Converting WOFF2 to Three.js JSON Format

To use the GT-America-Mono font in your 3D text, follow these steps:

### Step 1: Download the Font
- Download from: https://static.biltrewards.com/fonts/GT-America-Mono-VF.woff2

### Step 2: Convert WOFF2 to TTF
- Use an online converter like CloudConvert or FontSquirrel
- Convert: GT-America-Mono-VF.woff2 → GT-America-Mono.ttf

### Step 3: Convert TTF to Three.js JSON
- Go to: https://gero3.github.io/facetype.js/
- Upload your TTF file
- Download the generated JSON file
- Save as: `GT-America-Mono-Regular.json`

### Step 4: Place in Assets
- Put the JSON file in this directory: `assets/fonts/`
- Update the font path in `helpers.tsx`

### Alternative: Use Web-Based Conversion
If you want me to help with the conversion, you can:
1. Share the TTF file
2. I'll provide the Three.js JSON format
3. Add it to your project

## Usage
Once converted, the font will be loaded automatically in your 3D text rendering. 