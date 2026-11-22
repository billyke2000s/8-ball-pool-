package android.graphics;
@SuppressWarnings("all")
public class Bitmap {
  public int w = 64, h = 64;
  public Bitmap() {}
  public Bitmap(int w, int h) { this.w = Math.max(1, w); this.h = Math.max(1, h); }
  public static class Config { public static Config ARGB_8888 = new Config(), RGB_565 = new Config(), ALPHA_8 = new Config(); public Config() {} }
  public static class CompressFormat { public static CompressFormat PNG = new CompressFormat(), JPEG = new CompressFormat(), WEBP = new CompressFormat(); public CompressFormat() {} }
  public static Bitmap createBitmap(int w, int h, Config c) { return new Bitmap(w, h); }
  public static Bitmap createBitmap(Bitmap b, int x, int y, int w, int h, Matrix m, boolean f) { return new Bitmap(w, h); }
  public static Bitmap createBitmap(Bitmap b, int x, int y, int w, int h) { return new Bitmap(w, h); }
  public static Bitmap createBitmap(Bitmap b) { return new Bitmap(b.w, b.h); }
  public static Bitmap createBitmap(int[] c, int w, int h, Config cf) { return new Bitmap(w, h); }
  public static Bitmap createScaledBitmap(Bitmap b, int w, int h, boolean f) { return new Bitmap(w, h); }
  public int getWidth() { return w; } public int getHeight() { return h; }
  public void recycle() {} public boolean isRecycled() { return false; }
  public Bitmap copy(Config c, boolean m) { return new Bitmap(w, h); }
  public int getPixel(int x, int y) { return 0; } public void setPixel(int x, int y, int c) {}
  public void getPixels(int[] p, int o, int s, int x, int y, int w, int h) {} public void setPixels(int[] p, int o, int s, int x, int y, int w, int h) {}
  public boolean compress(CompressFormat f, int q, java.io.OutputStream o) { return true; }
  public Config getConfig() { return Config.ARGB_8888; } public void setHasAlpha(boolean b) {} public boolean hasAlpha() { return true; }
  public int getByteCount() { return w * h * 4; } public void eraseColor(int c) {} public void prepareToDraw() {} public int getDensity() { return 0; } public void setDensity(int d) {}
  public Bitmap extractAlpha() { return new Bitmap(w, h); } public boolean isMutable() { return true; } public int getRowBytes() { return w * 4; } public void copyPixelsToBuffer(java.nio.Buffer b) {}
  public int getGenerationId() { return 0; } public int getAllocationByteCount() { return w * h * 4; } public boolean sameAs(Bitmap o) { return o == this; }
  public void setPremultiplied(boolean b) {} public boolean isPremultiplied() { return true; }
}
