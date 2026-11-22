'use strict';
// Minimal android.* shims for HEADLESS runs (tests). Everything else is an automatic
// placeholder. Bitmap keeps real sizes so code that measures bitmaps behaves.
(function (rt) {
  const sh = rt.shim, O = 'Ljava/lang/Object;';
  const def = (obj, map) => { for (const [k, v] of Object.entries(map)) Object.defineProperty(obj, k, { value: v, writable: true, configurable: true }); };
  const bmp = (w, h) => { const b = rt.alloc('Landroid/graphics/Bitmap;'); b.$w = Math.max(1, w); b.$h = Math.max(1, h); return b; };
  rt.bitmap = bmp;
  sh('Landroid/graphics/Bitmap;', O, C => {
    def(C.prototype, { '<init>()V'() { this.$w = 64; this.$h = 64; }, 'getWidth()I'() { return this.$w ?? 64; }, 'getHeight()I'() { return this.$h ?? 64; },
      'recycle()V'() {}, 'isRecycled()Z'() { return 0; }, 'copy(Landroid/graphics/Bitmap$Config;Z)Landroid/graphics/Bitmap;'() { return bmp(this.$w, this.$h); },
      'getPixel(II)I'() { return 0; }, 'setPixel(III)V'() {}, 'eraseColor(I)V'() {}, 'setHasAlpha(Z)V'() {}, 'hasAlpha()Z'() { return 1; }, 'isMutable()Z'() { return 1; },
      'getConfig()Landroid/graphics/Bitmap$Config;'() { return null; }, 'getDensity()I'() { return 0; }, 'setDensity(I)V'() {} });
    def(C, {
      'createBitmap(IILandroid/graphics/Bitmap$Config;)Landroid/graphics/Bitmap;': (w, h) => bmp(w, h),
      'createBitmap(Landroid/graphics/Bitmap;IIIILandroid/graphics/Matrix;Z)Landroid/graphics/Bitmap;': (_b, _x, _y, w, h) => bmp(w, h),
      'createBitmap(Landroid/graphics/Bitmap;IIII)Landroid/graphics/Bitmap;': (_b, _x, _y, w, h) => bmp(w, h),
      'createBitmap(Landroid/graphics/Bitmap;)Landroid/graphics/Bitmap;': b => bmp(b.$w, b.$h),
      'createScaledBitmap(Landroid/graphics/Bitmap;IIZ)Landroid/graphics/Bitmap;': (_b, w, h) => bmp(w, h),
    });
  });
  // BitmapFactory: the headless oracle's generated stub returned a 64x64 Bitmap.
  sh('Landroid/graphics/BitmapFactory;', O, C => def(C, {
    'decodeResource(Landroid/content/res/Resources;I)Landroid/graphics/Bitmap;': () => bmp(64, 64),
    'decodeResource(Landroid/content/res/Resources;ILandroid/graphics/BitmapFactory$Options;)Landroid/graphics/Bitmap;': () => bmp(64, 64),
  }));
})(globalThis.DexRT);
