# agy-tools.sh — backend of Settings › Tools (Antigravity RU).
# Started only by the native AgyTools bridge:
#   bash agy-tools.sh <op> "<arg>"
# PREFIX/HOME come from the app; $PREFIX/etc/profile is already sourced.
# Machine-readable lines start with "@@" (parsed by agy_tools.js);
# everything else is the human log shown in the UI.
set -u
OP="${1:-}"
ARG="${2:-}"

SDK="$HOME/android-sdk"
CMDLINE_URL="https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip"
NDK_REPO="lzhiyong/termux-ndk"
ENVF="$PREFIX/etc/profile.d/60-agy-android.sh"
AGENTS="$PREFIX/etc/antigravity/AGENTS.md"

say()  { printf '%s\n' "$*"; }
step() { printf '\n== %s\n' "$*"; }
fail() { printf '@@error %s\n' "$*"; exit 1; }

index_fresh() {
    # pkg index younger than 6 hours?
    local f
    f="$(ls -t "$PREFIX"/var/lib/pkg/index/repo.*.Packages "$HOME"/.pkg/index/repo.*.Packages 2>/dev/null | head -n1)"
    [ -n "$f" ] || return 1
    [ -n "$(find "$f" -mmin -360 2>/dev/null)" ]
}
ensure_index() {
    if ! index_fresh; then
        step "pkg update"
        pkg update || fail "pkg update"
    fi
}

write_env() {
    mkdir -p "$(dirname "$ENVF")"
    cat > "$ENVF" <<EOF
# Written by Settings › Tools. Android SDK / NDK / Java for shells and Gradle.
export ANDROID_HOME="$SDK"
export ANDROID_SDK_ROOT="$SDK"
[ -d "$SDK/cmdline-tools/latest/bin" ] && export PATH="\$PATH:$SDK/cmdline-tools/latest/bin"
for _d in "$SDK"/ndk/*/; do [ -d "\$_d" ] && export ANDROID_NDK_HOME="\${_d%/}" ANDROID_NDK_ROOT="\${_d%/}"; done; unset _d
[ -d "$PREFIX/lib/jvm/java-17-openjdk" ] && export JAVA_HOME="$PREFIX/lib/jvm/java-17-openjdk"
[ -z "\${JAVA_HOME:-}" ] && [ -d "$PREFIX/lib/jvm/java-21-openjdk" ] && export JAVA_HOME="$PREFIX/lib/jvm/java-21-openjdk"
export GRADLE_USER_HOME="\$HOME/.gradle"
EOF
    mkdir -p "$HOME/.gradle"
    local gp="$HOME/.gradle/gradle.properties"
    touch "$gp"
    if [ -x "$PREFIX/bin/aapt2" ]; then
        grep -q '^android.aapt2FromMavenOverride=' "$gp" \
            && sed -i "s#^android.aapt2FromMavenOverride=.*#android.aapt2FromMavenOverride=$PREFIX/bin/aapt2#" "$gp" \
            || printf 'android.aapt2FromMavenOverride=%s\n' "$PREFIX/bin/aapt2" >> "$gp"
    fi
    grep -q '^org.gradle.daemon=' "$gp" || printf 'org.gradle.daemon=false\n' >> "$gp"
    grep -q '^org.gradle.jvmargs=' "$gp" || printf 'org.gradle.jvmargs=-Xmx1536m\n' >> "$gp"
    # Let the agent know where everything is.
    if [ -f "$AGENTS" ] && ! grep -q 'AGY-TOOLS-ANDROID' "$AGENTS"; then
        cat >> "$AGENTS" <<EOF

<!-- AGY-TOOLS-ANDROID -->
## Android toolchain (installed from Settings › Tools)
- Before Gradle/SDK/NDK commands run: \`. "\$PREFIX/etc/profile.d/60-agy-android.sh"\` (sets ANDROID_HOME, JAVA_HOME, ANDROID_NDK_HOME).
- Android SDK: \`$SDK\` (write \`sdk.dir=$SDK\` into a project's local.properties).
- aapt2 is the native Termux build; Gradle uses it via android.aapt2FromMavenOverride in ~/.gradle/gradle.properties.
- Build with \`gradle assembleDebug --no-daemon\` or \`bash ./gradlew assembleDebug --no-daemon\` (never \`./gradlew\`: /bin/sh does not exist on Android).
- node, npm, java, gradle, sdkmanager, ndk-build, npm global CLIs have bridges in runtime/bin that load this environment automatically.
EOF
    fi
}

# ------------------------------------------------------------ agent bridges
# The agent's shell runs with the core environment: runtime/bin first, no
# LD_LIBRARY_PATH / LD_PRELOAD. pkg creates runtime/bin bridges only for binaries
# of packages it installs. Tools that come from npm, sdkmanager or the NDK (and
# scripts with "#!/usr/bin/env" / "#!/bin/sh" shebangs, which do not exist on
# Android) need bridges of their own; the Android/Java env is loaded in each.
RB="$PREFIX/../runtime/bin"
BRIDGED="node npm npx corepack yarn pnpm pnpx tsc tsserver java javac jar keytool kotlin kotlinc gradle mvn sdkmanager avdmanager ndk-build aapt aapt2 d8 apksigner zipalign adb apktool jadx"
make_bridge() { # name
    local name="$1" target="$PREFIX/bin/$1" first runner=""
    [ -e "$target" ] || return 0
    [ -d "$RB" ] || return 0
    first="$(head -c 160 "$(readlink -f "$target")" 2>/dev/null | tr -d "\000" | head -n 1)"
    case "$first" in
        "#!"*node*)            runner='"$PREFIX/bin/node" ' ;;
        "#!"*sh*|"#!"*bash*)   runner='"$PREFIX/bin/bash" ' ;;
    esac
    cat > "$RB/$name" <<EOF
#!/system/bin/sh
# AGY tools bridge -> \$PREFIX/bin/$name
PREFIX='$PREFIX'
export PREFIX TERMUX__PREFIX="\$PREFIX"
[ -f "\$PREFIX/lib/libtermux-exec.so" ] && export LD_PRELOAD="\$PREFIX/lib/libtermux-exec.so"
export LD_LIBRARY_PATH="\$PREFIX/lib"
export PATH="\$PREFIX/../runtime/bin:\$PREFIX/bin:/system/bin"
case "\${TMPDIR:-}" in /data/data/com.termux*) TMPDIR="\$PREFIX/tmp" ;; *) TMPDIR="\${TMPDIR:-\$PREFIX/tmp}" ;; esac; export TMPDIR
export OPENSSL_CONF="\$PREFIX/etc/tls/openssl.cnf" SSL_CERT_FILE="\$PREFIX/etc/tls/cert.pem" CURL_CA_BUNDLE="\$PREFIX/etc/tls/cert.pem"
[ -f "\$PREFIX/etc/profile.d/60-agy-android.sh" ] && . "\$PREFIX/etc/profile.d/60-agy-android.sh"
# Resolve symlinks: scripts like ndk-build locate their resources via \$0.
exec $runner"\$(readlink -f "\$PREFIX/bin/$name")" "\$@"
EOF
    chmod 755 "$RB/$name" 2>/dev/null || true
}
refresh_bridges() {
    # SDK / NDK entry points into $PREFIX/bin first.
    local t
    for t in sdkmanager avdmanager; do
        [ -e "$SDK/cmdline-tools/latest/bin/$t" ] && ln -sf "$SDK/cmdline-tools/latest/bin/$t" "$PREFIX/bin/$t"
    done
    for t in "$SDK"/ndk/*/ndk-build; do [ -e "$t" ] && ln -sf "$t" "$PREFIX/bin/ndk-build"; done
    local n
    for n in $BRIDGED; do make_bridge "$n"; done
    # npm globals that are not in the list (new CLIs) get bridges too.
    if [ -d "$PREFIX/lib/node_modules" ]; then
        for t in "$PREFIX"/bin/*; do
            case "$(readlink "$t" 2>/dev/null)" in
                *node_modules*) make_bridge "$(basename "$t")" ;;
            esac
        done
    fi
}

# ------------------------------------------------------------ status
op_status() {
    # Fast: read pkg's own index/db files with one awk each (no pkg calls,
    # no network). Index is refreshed only by install/upgrade.
    local IDX="$PREFIX/var/lib/pkg/index" DB="$PREFIX/var/lib/pkg/installed"
    local names="${ARG//,/ }"
    {
        # available: repo.N.tsv  (name<TAB>version<TAB>...)
        cat "$IDX"/repo.*.tsv 2>/dev/null | awk -F'\t' '{print "A\t"$1"\t"$2}'
        # installed by pkg: <name>.meta with version=
        for f in "$DB"/*.meta; do
            [ -e "$f" ] || continue
            n="${f##*/}"; n="${n%.meta}"
            v="$(sed -n 's/^version=//p' "$f" | head -n1)"
            printf 'I\t%s\t%s\n' "$n" "$v"
        done
        # installed by the bootstrap (dpkg status)
        [ -f "$PREFIX/var/lib/dpkg/status" ] && awk '
            /^Package:/ {p=$2} /^Version:/ {v=$2}
            /^Status:.*installed/ {s=1}
            /^$/ {if (s && p != "" && v != "") print "I\t"p"\t"v; p=""; v=""; s=0}' "$PREFIX/var/lib/dpkg/status"
    } | awk -F'\t' -v want="$names" '
        BEGIN { n = split(want, w, " "); for (i = 1; i <= n; i++) need[w[i]] = 1 }
        $1 == "A" && ($2 in need) { av[$2] = $3 }
        $1 == "I" && ($2 in need) { iv[$2] = $3 }
        END { for (k in need) printf "@@pkg %s %s %s\n", k, (k in av ? av[k] : "-"), (k in iv ? iv[k] : "-") }'
    [ -n "$(ls "$IDX"/repo.*.tsv 2>/dev/null)" ] && say "@@index ok" || say "@@index -"
    [ -x "$SDK/cmdline-tools/latest/bin/sdkmanager" ] && say "@@special cmdline-tools ok" || say "@@special cmdline-tools -"
    local p
    for p in "$SDK"/platforms/android-*; do [ -d "$p" ] && say "@@special platform $(basename "$p")"; done
    for p in "$SDK"/build-tools/*; do [ -d "$p" ] && say "@@special build-tools $(basename "$p")"; done
    for p in "$SDK"/ndk/*; do [ -d "$p" ] && say "@@special ndk $(basename "$p")"; done
    command -v pnpm >/dev/null 2>&1 && say "@@npm pnpm ok" || say "@@npm pnpm -"
    command -v tsc  >/dev/null 2>&1 && say "@@npm typescript ok" || say "@@npm typescript -"
    say "@@done"
}
op_index() { step "pkg update"; pkg update || fail "pkg update"; say "@@done"; }

# ------------------------------------------------------------ install / remove / upgrade
op_install() {
    [ -n "$ARG" ] || fail "nothing to install"
    ensure_index
    step "pkg install $ARG"
    # shellcheck disable=SC2086
    if ! pkg install $ARG; then
        step "batch install failed; retrying package by package"
        local p ok=1
        for p in $ARG; do
            step "pkg install $p"
            pkg install "$p" || { ok=0; say "@@warn failed: $p"; }
        done
        [ "$ok" = "1" ] || fail "pkg install (some packages failed)"
    fi
    case " $ARG " in
        *" nodejs"*|*" python"*|*" yarn "*)
            step "agy-fix-paths"; agy-fix-paths || true ;;
    esac
    case " $ARG " in
        *" nodejs"*)
            npm config set prefix "$PREFIX" >/dev/null 2>&1 || true ;;
    esac
    write_env
    refresh_bridges
    say "@@done"
}
op_remove() {
    [ -n "$ARG" ] || fail "nothing to remove"
    step "pkg remove $ARG"
    # shellcheck disable=SC2086
    pkg remove $ARG || fail "pkg remove"
    say "@@done"
}
op_upgrade() {
    step "pkg update"; pkg update || fail "pkg update"
    step "pkg upgrade"; pkg upgrade || fail "pkg upgrade"
    agy-fix-paths >/dev/null 2>&1 || true
    refresh_bridges
    say "@@done"
}
op_npm() {
    # Global npm packages, e.g. "pnpm typescript"
    command -v npm >/dev/null 2>&1 || fail "npm missing: install Node.js first"
    # TypeScript 7+ ships a native per-platform binary (tsgo) that has no
    # Android build (process.platform = "android"), so tsc crashes there.
    # Pin the pure-JS 5.x compiler, which runs everywhere.
    local pkgs="" p
    for p in $ARG; do
        case "$p" in
            typescript) pkgs="$pkgs typescript@5" ;;
            *)          pkgs="$pkgs $p" ;;
        esac
    done
    step "npm install -g$pkgs"
    # shellcheck disable=SC2086
    npm install -g$pkgs || fail "npm install"
    agy-fix-paths >/dev/null 2>&1 || true
    refresh_bridges
    say "@@done"
}

# ------------------------------------------------------------ Android SDK
need_java() {
    if ! command -v java >/dev/null 2>&1; then
        ensure_index
        step "pkg install openjdk-17 (required by sdkmanager)"
        pkg install openjdk-17 || fail "openjdk-17"
    fi
    write_env
    . "$ENVF"
}
op_sdk() {
    need_java
    mkdir -p "$SDK"
    if [ ! -x "$SDK/cmdline-tools/latest/bin/sdkmanager" ]; then
        step "Download Android command-line tools"
        local z="$PREFIX/tmp/cmdline-tools.zip"
        curl -# -fL --retry 2 -o "$z" "$CMDLINE_URL" || fail "download cmdline-tools"
        rm -rf "$SDK/cmdline-tools/latest" "$PREFIX/tmp/cmdline-tools"
        mkdir -p "$SDK/cmdline-tools"
        unzip -q -o "$z" -d "$PREFIX/tmp" || fail "unzip cmdline-tools"
        mv "$PREFIX/tmp/cmdline-tools" "$SDK/cmdline-tools/latest" || fail "move cmdline-tools"
        rm -f "$z"
    fi
    write_env
    . "$ENVF"
    local comps="${ARG:-platforms;android-35 build-tools;35.0.0}"
    step "Accept licenses"
    yes | bash "$SDK/cmdline-tools/latest/bin/sdkmanager" --sdk_root="$SDK" --licenses >/dev/null 2>&1 || true
    step "sdkmanager $comps"
    # shellcheck disable=SC2086
    bash "$SDK/cmdline-tools/latest/bin/sdkmanager" --sdk_root="$SDK" $comps || fail "sdkmanager"
    # build-tools binaries from Google are x86_64: replace them with native ones.
    local bt t
    for bt in "$SDK"/build-tools/*; do
        [ -d "$bt" ] || continue
        for t in aapt aapt2 zipalign aidl; do
            if [ -x "$PREFIX/bin/$t" ]; then
                rm -f "$bt/$t"; ln -s "$PREFIX/bin/$t" "$bt/$t"
            fi
        done
    done
    refresh_bridges
    say "@@done"
}
op_sdkremove() {
    [ -n "$ARG" ] || fail "nothing to remove"
    . "$ENVF" 2>/dev/null || true
    # shellcheck disable=SC2086
    bash "$SDK/cmdline-tools/latest/bin/sdkmanager" --sdk_root="$SDK" --uninstall $ARG || fail "sdkmanager --uninstall"
    say "@@done"
}

# ------------------------------------------------------------ NDK (Termux build for aarch64)
op_ndk() {
    ensure_index
    command -v unzip >/dev/null 2>&1 || pkg install unzip || fail "unzip"
    command -v tar   >/dev/null 2>&1 || pkg install tar   || fail "tar"
    step "Find latest $NDK_REPO release"
    local api url name tag
    api="$(curl -fsSL "https://api.github.com/repos/$NDK_REPO/releases/latest" 2>/dev/null || true)"
    # Releases ship .tar.xz (and historically .zip); match either.
    url="$(printf '%s' "$api" | grep -o '"browser_download_url": *"[^"]*aarch64[^"]*\.\(zip\|tar\.xz\|tar\.gz\)"' | head -n1 | sed 's/.*"\(http[^"]*\)"/\1/')"
    if [ -z "$url" ]; then
        # GitHub API may be rate-limited: follow the /releases/latest redirect
        # and scrape the expanded assets page for the aarch64 archive.
        step "GitHub API empty; fallback to release page"
        tag="$(curl -fsSL -o /dev/null -w '%{url_effective}' "https://github.com/$NDK_REPO/releases/latest" 2>/dev/null | sed 's#.*/tag/##')"
        [ -n "$tag" ] || fail "GitHub API"
        url="$(curl -fsSL "https://github.com/$NDK_REPO/releases/expanded_assets/$tag" 2>/dev/null \
            | grep -o 'href="[^"]*aarch64[^"]*\.\(zip\|tar\.xz\|tar\.gz\)"' | head -n1 \
            | sed 's/^href="//; s/"$//; s#^#https://github.com#')"
    fi
    [ -n "$url" ] || fail "no aarch64 NDK asset in the latest release"
    name="$(basename "$url")"
    step "Download $name (large, ~1 GB)"
    mkdir -p "$SDK/ndk"
    local z="$PREFIX/tmp/$name"
    curl -# -fL --retry 2 -o "$z" "$url" || fail "download NDK"
    step "Unpack"
    case "$name" in
        *.tar.xz|*.txz) tar -xJf "$z" -C "$SDK/ndk" || fail "unpack NDK" ;;
        *.tar.gz|*.tgz) tar -xzf "$z" -C "$SDK/ndk" || fail "unpack NDK" ;;
        *.zip)          unzip -q -o "$z" -d "$SDK/ndk" || fail "unzip NDK" ;;
        *)              fail "unsupported archive: $name" ;;
    esac
    rm -f "$z"
    write_env
    refresh_bridges
    say "@@done"
}
op_ndkremove() {
    rm -rf "$SDK/ndk"
    write_env
    say "@@done"
}

# ------------------------------------------------------------ shield policies
# op_policy "<field>[=<value>]" — read/write userSettings in config.json.
# The 2.4.1 JS settings store cannot round-trip these fields (its schema
# predates internetAccessPolicy etc.), so agy_shield.js persists every pick
# here; the Go core watches the file and applies the values.
op_policy() {
    local cfg="$HOME/.gemini/config/config.json"
    [ -f "$cfg" ] || fail "no config.json"
    python3 - "$cfg" "$ARG" <<'PY' || fail "policy write"
import json, os, sys
cfg, arg = sys.argv[1], sys.argv[2]
FIELDS = {
    "autoExecutionPolicy": "enum",
    "enableTerminalSandbox": "bool",
    "nonWorkspaceFileAccessPolicy": "enum",
    "internetAccessPolicy": "enum",
}
try:
    with open(cfg) as f:
        d = json.load(f)
except Exception as e:
    print("@@error config: %s" % e)
    raise SystemExit(1)
us = d.setdefault("userSettings", {})
if arg:
    if "=" not in arg:
        print("@@error usage: policy field=value")
        raise SystemExit(1)
    field, val = arg.split("=", 1)
    if field not in FIELDS:
        print("@@error unknown field: %s" % field)
        raise SystemExit(1)
    if FIELDS[field] == "bool":
        us[field] = val.strip().lower() in ("1", "true", "yes", "on")
    else:
        us[field] = val
    tmp = cfg + ".tmp"
    with open(tmp, "w") as f:
        json.dump(d, f, ensure_ascii=False, indent=1)
    os.replace(tmp, cfg)
for field in FIELDS:
    v = us.get(field, "")
    if isinstance(v, bool):
        v = "true" if v else "false"
    print("@@kv %s %s" % (field, v))
PY
    say "@@done"
}

# ------------------------------------------------------------ verify
op_verify() {
    local ok=0 bad=0
    chk() { # name, command...
        local name="$1"; shift
        local out
        if out="$("$@" 2>&1 | head -n 2 | tr '\n' ' ')"; then
            printf '@@ok %s %s\n' "$name" "$out"; ok=$((ok+1))
        else
            printf '@@fail %s %s\n' "$name" "$out"; bad=$((bad+1))
        fi
    }
    . "$ENVF" 2>/dev/null || true
    # Run checks the way the agent does: core-like env, runtime/bin first.
    export PATH="$RB:$PREFIX/bin:/system/bin"
    unset LD_LIBRARY_PATH LD_PRELOAD
    local t
    for t in ${ARG//,/ }; do
        case "$t" in
            node)    chk node node -e 'console.log("node "+process.version)' ;;
            npm)     chk npm npm -v ;;
            python)  chk python python -c 'import sys;print(sys.version.split()[0])' ;;
            java)    chk java java -version ;;
            javac)   chk javac javac -version ;;
            kotlin)  chk kotlin kotlinc -version ;;
            gradle)  chk gradle gradle -v --no-daemon -q ;;
            clang)   chk clang sh -c 'printf "int main(){return 0;}" > "$PREFIX/tmp/agy_t.c" && clang "$PREFIX/tmp/agy_t.c" -o "$PREFIX/tmp/agy_t" && "$PREFIX/tmp/agy_t" && echo compiled' ;;
            cmake)   chk cmake cmake --version ;;
            git)     chk git git --version ;;
            aapt2)   chk aapt2 aapt2 version ;;
            d8)      chk d8 d8 --version ;;
            apksigner) chk apksigner apksigner --version ;;
            adb)     chk adb adb version ;;
            sdk)     chk sdk sdkmanager --sdk_root="$SDK" --version ;;
            tsc)     chk tsc tsc -v ;;
            pnpm)    chk pnpm pnpm -v ;;
            ndk)     chk ndk sh -c 'ls "$ANDROID_NDK_HOME"/source.properties >/dev/null && grep Revision "$ANDROID_NDK_HOME/source.properties"' ;;
            rust)    chk rust rustc --version ;;
            go)      chk go go version ;;
            *)       chk "$t" sh -c "command -v '$t'" ;;
        esac
    done
    say "@@verified $ok $bad"
    say "@@done"
}

case "$OP" in
    status)    op_status ;;
    index)     op_index ;;
    install)   op_install ;;
    remove)    op_remove ;;
    upgrade)   op_upgrade ;;
    npm)       op_npm ;;
    sdk)       op_sdk ;;
    sdkremove) op_sdkremove ;;
    ndk)       op_ndk ;;
    ndkremove) op_ndkremove ;;
    policy)    op_policy ;;
    verify)    op_verify ;;
    *)         fail "unknown op: $OP" ;;
esac
