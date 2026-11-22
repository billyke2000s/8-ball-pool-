#!/bin/sh
# Run the original engine headless. -XX:-UseLibmIntrinsic makes HotSpot use fdlibm for
# sin/cos/pow (what V8 uses for sin/cos/atan2/log; the page ships fdlibm pow), so a bit-level
# comparison tests the translated logic rather than maths-library rounding.
D=$(cd "$(dirname "$0")" && pwd)
exec java -XX:+UnlockDiagnosticVMOptions -XX:-UseLibmIntrinsic -XX:-BytecodeVerificationRemote -XX:-BytecodeVerificationLocal -cp "$D/hcls:$D/cls:$D/stubcls" Oracle "$@" 2>&1 | grep -v "Picked up\|^OpenJDK"
