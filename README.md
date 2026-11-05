# Snapbooth

A photobooth that runs in the browser. Pick a layout, take your photos with a countdown, choose a frame and filter, then save the result to your device.

## Features
- **11 layouts**: 2×6 strips (A, B), 4×6 portrait (C, D, E) and 4×6 landscape (F–K)
- **Camera booth** with a 3, 5 or 10 second countdown, flash and shutter sound, mirror toggle and front/back camera switch. Tap any pose to retake it.
- **Upload photos** instead of using the camera
- **12 frames**: Snapbooth Sticker, Classic White, Noir, Lavender Dots, Strawberry Gingham, Mint Ovals, Butter Hearts, Cherry Polka, Movie Ticket, Receipt, Starry Denim, Moo Print and Film Roll
- **8 filters**: Original, B&W, Sepia, Warm, Cool, Vintage, Dreamy and Pop
- Your own caption and an optional date
- **Save** as PNG or JPG at print resolution (600×1800 or 1200×1800). There's an option to save a 2×6 strip as a double strip on a 4×6 print sheet. On phones, **Share / Save to Photos** opens the share sheet.
- Everything stays on your device. Nothing is uploaded.

## Run it
It's plain HTML, CSS and JS with no build step. Browsers only allow camera access over **https** or **localhost**:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

To publish it, enable GitHub Pages for the repository (Settings → Pages → deploy from branch).
