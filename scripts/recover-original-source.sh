#!/usr/bin/env bash
set -euo pipefail
# Recover the WHOLE original Android app without changing its code.
# Requires: java (JDK), jadx (JADX 1.5.7), apktool (Apktool 3.0.3), zip.
APK="${1:?Usage: bash scripts/recover-original-source.sh /path/to/Billiard.apk [output-directory]}"
OUT="${2:-Billiard_Full_Code_Recovery}"
mkdir -p "$OUT"
cp "$APK" "$OUT/original.apk"
sha256sum "$OUT/original.apk" | tee "$OUT/ORIGINAL_SHA256.txt"
jadx -j 4 --no-imports -d "$OUT/Recovered_Java_JADX" "$OUT/original.apk" || {
  echo "WARNING: JADX reported reconstruction errors. Check output; exact code is in Smali." >&2
}
apktool d -f "$OUT/original.apk" -o "$OUT/Exact_Dalvik_Smali_And_Decoded_Resources"
unzip -p "$OUT/original.apk" classes.dex > "$OUT/original_classes.dex"
echo "Decompiled Java files: $(find "$OUT/Recovered_Java_JADX/sources" -name '*.java' | wc -l)"
echo "Recovered Smali files: $(find "$OUT/Exact_Dalvik_Smali_And_Decoded_Resources/smali" -name '*.smali' | wc -l)"
echo "To verify reassembly: apktool b '$OUT/Exact_Dalvik_Smali_And_Decoded_Resources' -o rebuilt-unsigned.apk"
echo "IMPORTANT: JADX Java may not compile directly. The original Smali is the authority."
