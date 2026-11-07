# 65-agy-jvm.sh — Antigravity JVM sandbox paths.
#
# Termux-OpenJDK (bundled in AGY) hardcodes Termux locations:
#   user.home      -> /data/data/com.termux/files/home
#   java.io.tmpdir -> /data/data/com.termux/files/usr/tmp
# Both are inaccessible from this sandbox -> java.nio.file.AccessDeniedException
# in jadx, apktool, d8, apksigner, jadx-gui, Gradle client/daemon, etc.
# The JVM ignores TMPDIR for java.io.tmpdir, so the flags must be explicit.
# JAVA_TOOL_OPTIONS is honored by EVERY JVM, which fixes all Java tools at once.
# Sourced by $PREFIX/etc/profile; idempotent.

_agy_jvm_tmp=""
if [ -n "${TMPDIR:-}" ] && [ -d "$TMPDIR" ] && touch "$TMPDIR/.agy_jvm_w" 2>/dev/null; then
    _agy_jvm_tmp="$TMPDIR"
    rm -f "$TMPDIR/.agy_jvm_w"
fi
[ -n "$_agy_jvm_tmp" ] || _agy_jvm_tmp="$PREFIX/tmp"
[ -d "$_agy_jvm_tmp" ] || _agy_jvm_tmp="$HOME/.cache/tmp"
mkdir -p "$_agy_jvm_tmp" 2>/dev/null || true

case "${JAVA_TOOL_OPTIONS:-}" in
    *-Duser.home=*) : ;;  # already configured (e.g. by jadx-agy)
    *)
        export JAVA_TOOL_OPTIONS="-Duser.home=$HOME -Djava.io.tmpdir=$_agy_jvm_tmp${JAVA_TOOL_OPTIONS:+ $JAVA_TOOL_OPTIONS}"
        ;;
esac
unset _agy_jvm_tmp
