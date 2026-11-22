// JVM-loadable equivalent of the original vh (SINGLE, PvP, PvC, UNKNOWN). R8 merged the original
// constructor into java.lang.Enum, which ART accepts and HotSpot rejects. Same constants, same order.
public enum vh { a, b, c, d; public static final vh[] e = values(); }
