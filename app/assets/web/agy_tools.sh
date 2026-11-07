# agy-tools.sh — backend of Settings › Tools (Antigravity RU).
# Started only by the native AgyTools bridge:
#   bash agy-tools.sh <op> "<arg>"
# PREFIX/HOME come from the app; $PREFIX/etc/profile is already sourced.
# Machine-readable lines start with "@@" (parsed by agy_tools.js);
# everything else is the human log shown in the UI.
set -u
trap '' 36 37 2>/dev/null || true
OP="${1:-}"
shift 1 2>/dev/null || true
ARG="$*"

SDK="$HOME/android-sdk"
CMDLINE_URL="https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip"
NDK_REPO="lzhiyong/termux-ndk"
ENVF="$PREFIX/etc/profile.d/60-agy-android.sh"
AGENTS="$PREFIX/etc/antigravity/AGENTS.md"

say()  { printf '%s\n' "$*"; }
step() { printf '\n== %s\n' "$*"; }
fail() { printf '@@error %s\n' "$*"; exit 1; }

# pkg_retry <cmd...> — retry a pkg/network command on transient failures.
# Mobile/VPN links routinely reset connections (curl error 35 "Recv failure"),
# which pkg surfaces as "download failed"; most installs succeed on a retry.
pkg_retry() {
    local n=1 max=3
    while :; do
        "$@" && return 0
        [ "$n" -ge "$max" ] && return 1
        n=$((n + 1))
        step "transient failure, retry $n/$max"
        sleep $((n * 3))
    done
}

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
        pkg_retry pkg update || fail "pkg update"
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
[ -n "\${JAVA_HOME:-}" ] && [ -x "\$JAVA_HOME/bin/java" ] && export PATH="\$JAVA_HOME/bin:\$PATH"
[ -d "$HOME/flutter_sdk/bin" ] && export PATH="\$PATH:$HOME/flutter_sdk/bin" && export FLUTTER_ROOT="$HOME/flutter_sdk"
export GRADLE_USER_HOME="\$HOME/.gradle"
EOF
    mkdir -p "$HOME/.gradle" "$PREFIX/tmp"
    local gp="$HOME/.gradle/gradle.properties"
    touch "$gp"
    if [ -x "$PREFIX/bin/aapt2" ]; then
        grep -q '^android.aapt2FromMavenOverride=' "$gp" \
            && sed -i "s#^android.aapt2FromMavenOverride=.*#android.aapt2FromMavenOverride=$PREFIX/bin/aapt2#" "$gp" \
            || printf 'android.aapt2FromMavenOverride=%s\n' "$PREFIX/bin/aapt2" >> "$gp"
    fi
    grep -q '^org.gradle.daemon=' "$gp" || printf 'org.gradle.daemon=false\n' >> "$gp"
    grep -q '^org.gradle.jvmargs=' "$gp" || printf 'org.gradle.jvmargs=-Xmx1536m\n' >> "$gp"
    # Keep existing JVM options and add only missing Android-specific paths.
    local gp_tmp="$gp.agy-tmp-$$"
    awk -v tmp="$PREFIX/tmp" -v home="$HOME" '
      /^org[.]gradle[.]jvmargs=/ {
        if ($0 !~ /(^|[[:space:]])-Djava[.]io[.]tmpdir=/) $0=$0 " -Djava.io.tmpdir=" tmp
        if ($0 !~ /(^|[[:space:]])-Duser[.]home=/) $0=$0 " -Duser.home=" home
      } {print}
    ' "$gp" > "$gp_tmp" && mv "$gp_tmp" "$gp" || { rm -f "$gp_tmp"; fail "update Gradle JVM paths"; }
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
BRIDGED="node npm npx corepack yarn pnpm pnpx tsc tsserver java javac jar keytool kotlin kotlinc gradle mvn sdkmanager avdmanager ndk-build aapt aapt2 aidl d8 apksigner zipalign adb apktool jadx"
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
TMPDIR="\$PREFIX/tmp"; export TMPDIR
export OPENSSL_CONF="\$PREFIX/etc/tls/openssl.cnf" SSL_CERT_FILE="\$PREFIX/etc/tls/cert.pem" CURL_CA_BUNDLE="\$PREFIX/etc/tls/cert.pem"
[ -f "\$PREFIX/etc/profile.d/60-agy-android.sh" ] && . "\$PREFIX/etc/profile.d/60-agy-android.sh"
# Resolve symlinks: scripts like ndk-build locate their resources via \$0.
exec $runner"\$(readlink -f "\$PREFIX/bin/$name")" "\$@"
EOF
    chmod 755 "$RB/$name" 2>/dev/null || true
}
refresh_build_tools() {
    local bt t dest target
    for bt in "$SDK"/build-tools/*; do
        [ -d "$bt" ] || continue
        for t in aapt aapt2 aidl zipalign d8 apksigner; do
            target="$PREFIX/bin/$t"; dest="$bt/$t"
            [ -x "$target" ] || continue
            [ "$(readlink "$dest" 2>/dev/null || true)" = "$target" ] && continue
            # Preserve original SDK executables or user-created wrappers once.
            if [ -e "$dest" ] && [ ! -L "$dest" ] && [ ! -e "$dest.agy-original" ]; then
                cp -p "$dest" "$dest.agy-original" || fail "backup $dest"
            fi
            ln -sf "$target" "$dest.agy-new" || fail "prepare $dest"
            mv -f "$dest.agy-new" "$dest" || fail "update $dest"
        done
    done
}
refresh_bridges() {
    # Restore entry points omitted by package post-install scripts when the
    # actual executable exists. Never replace an existing working command.
    local j target
    for j in java javac jar keytool; do
        if [ ! -x "$PREFIX/bin/$j" ]; then
            for target in "$PREFIX/lib/jvm/java-17-openjdk/bin/$j" "$PREFIX/lib/jvm/java-21-openjdk/bin/$j"; do
                if [ -x "$target" ]; then ln -sf "$target" "$PREFIX/bin/$j"; break; fi
            done
        fi
    done
    for j in npm npx; do
        target="$PREFIX/lib/node_modules/npm/bin/$j-cli.js"
        if [ ! -e "$PREFIX/bin/$j" ] && [ -f "$target" ]; then ln -sf "$target" "$PREFIX/bin/$j"; fi
    done
    # SDK / NDK entry points into $PREFIX/bin first.
    local t
    for t in sdkmanager avdmanager; do
        [ -e "$SDK/cmdline-tools/latest/bin/$t" ] && ln -sf "$SDK/cmdline-tools/latest/bin/$t" "$PREFIX/bin/$t"
    done
    for t in "$SDK"/ndk/*/ndk-build; do [ -e "$t" ] && ln -sf "$t" "$PREFIX/bin/ndk-build"; done
    refresh_build_tools
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
    # Ensure TSV index exists if Packages file is available; fetch index if missing
    if [ -z "$(ls "$IDX"/repo.*.tsv 2>/dev/null)" ]; then
        for f in "$IDX"/repo.*.Packages "$HOME"/.pkg/index/repo.*.Packages; do
            [ -s "$f" ] && awk -f "$PREFIX/libexec/pkg/lib/index.awk" "$f" > "${f%.Packages}.tsv" 2>/dev/null || true
        done
    fi
    if [ -z "$(ls "$IDX"/repo.*.tsv "$IDX"/repo.*.Packages 2>/dev/null)" ]; then
        ensure_index 2>/dev/null || true
    fi
    local names="${ARG//,/ }"
    {
        # available: repo.N.tsv  (name<TAB>version<TAB>...)
        cat "$IDX"/repo.*.tsv 2>/dev/null | awk -F'\t' '{print "A\t"$1"\t"$2}'
        # installed by pkg: <name>.meta with version= (parsed fast in single awk)
        [ -d "$DB" ] && awk '
            FNR == 1 { n = FILENAME; sub(".*/", "", n); sub("[.]meta$", "", n); }
            /^version=/ && !(n in seen) { sub("^version=", ""); print "I\t" n "\t" $0; seen[n] = 1; }
        ' "$DB"/*.meta 2>/dev/null
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
    [ -n "$(ls "$IDX"/repo.*.tsv "$IDX"/repo.*.Packages 2>/dev/null)" ] && say "@@index ok" || say "@@index -"
    [ -x "$SDK/cmdline-tools/latest/bin/sdkmanager" ] && say "@@special cmdline-tools ok" || say "@@special cmdline-tools -"
    local p
    for p in "$SDK"/platforms/android-*; do
        [ -d "$p" ] || continue
        if [ -s "$p/android.jar" ] && [ -s "$p/source.properties" ]; then say "@@special platform $(basename "$p")"; else say "@@special platform $(basename "$p") incomplete"; fi
    done
    for p in "$SDK"/build-tools/*; do
        [ -d "$p" ] || continue
        if [ -s "$p/source.properties" ] && [ -s "$p/lib/d8.jar" ] && [ -s "$p/core-lambda-stubs.jar" ]; then say "@@special build-tools $(basename "$p")"; else say "@@special build-tools $(basename "$p") incomplete"; fi
    done
    for p in "$SDK"/ndk/*; do [ -d "$p" ] && say "@@special ndk $(basename "$p")"; done
    [ -x "$HOME/flutter_sdk/bin/flutter" ] && say "@@special flutter ok" || say "@@special flutter -"
    command -v pnpm >/dev/null 2>&1 && say "@@npm pnpm ok" || say "@@npm pnpm -"
    command -v tsc  >/dev/null 2>&1 && say "@@npm typescript ok" || say "@@npm typescript -"
    say "@@done"
}
op_index() { step "pkg update"; pkg_retry pkg update || fail "pkg update"; say "@@done"; }

# ------------------------------------------------------------ install / remove / upgrade
sync_resolver() {
    local src="$PREFIX/../web/agy_resolver.sh" dst="$PREFIX/libexec/pkg/lib/resolver.sh"
    [ -s "$src" ] && [ -f "$dst" ] || fail "dependency resolver is missing"
    if ! cmp -s "$src" "$dst"; then
        cp "$src" "$dst.agy-new" && mv -f "$dst.agy-new" "$dst" || fail "cannot update dependency resolver"
    fi
}
node_package_installed() {
    [ -f "$PREFIX/var/lib/pkg/installed/$1.meta" ] ||
    awk -v pkg="$1" 'BEGIN{p=0} /^Package: /{p=($2==pkg)} p && /^Status: .* installed$/{found=1} END{exit !found}' "$PREFIX/var/lib/dpkg/status" 2>/dev/null
}
check_node_conflicts() {
    local n
    for n in $ARG; do
        case "$n" in
            nodejs-lts) if ! node_package_installed nodejs-lts && node_package_installed nodejs; then fail "Node.js current is already installed; select one version before switching"; fi ;;
            nodejs) if ! node_package_installed nodejs && node_package_installed nodejs-lts; then fail "Node.js LTS is already installed; select one version before switching"; fi ;;
        esac
    done
}
op_install() {
    [ -n "$ARG" ] || fail "nothing to install"
    ensure_index
    sync_resolver
    check_node_conflicts
    step "pkg install $ARG"
    # shellcheck disable=SC2086
    if ! pkg_retry pkg install $ARG; then
        step "batch install failed; retrying package by package"
        local p ok=1
        for p in $ARG; do
            step "pkg install $p"
            pkg_retry pkg install "$p" || { ok=0; say "@@warn failed: $p"; }
        done
        [ "$ok" = "1" ] || fail "pkg install (some packages failed)"
    fi
    case " $ARG " in
        *" nodejs "*|*" nodejs-lts "*)
            step "pkg install npm"
            pkg_retry pkg install npm || fail "npm installation failed"
            ;;
    esac
    # pkg rewrites paths per extracted package. Rescanning the whole prefix here
    # duplicates that work and can take minutes for large SDK/node trees.
    case " $ARG " in
        *" nodejs"*)
            npm config set prefix "$PREFIX" >/dev/null 2>&1 || true ;;
    esac
    write_env
    refresh_bridges
    case " $ARG " in
        *" nodejs "*|*" nodejs-lts "*)
            "$RB/node" --version || fail "Node.js verification failed"
            "$RB/npm" --version || fail "npm verification failed"
            ;;
    esac
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
    step "pkg update"; pkg_retry pkg update || fail "pkg update"
    step "pkg upgrade"; pkg_retry pkg upgrade || fail "pkg upgrade"
    # pkg upgrade rewrites each package during extraction.
    write_env
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
    pkg_retry npm install -g --fetch-retries=5 --fetch-retry-maxtimeout=60000$pkgs || fail "npm install"
    step "Fix paths in npm tools"
    agy-fix-paths "$PREFIX/bin" "$PREFIX/lib/node_modules" || fail "fix paths"
    refresh_bridges
    say "@@done"
}

# ------------------------------------------------------------ Android SDK
need_java() {
    if ! command -v java >/dev/null 2>&1; then
        ensure_index
        step "pkg install openjdk-17 (required by sdkmanager)"
        pkg_retry pkg install openjdk-17 || fail "openjdk-17"
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
        curl -# -fL --retry 5 --retry-all-errors --retry-delay 3 --retry-max-time 600 -o "$z" "$CMDLINE_URL" || fail "download cmdline-tools"
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
    refresh_bridges
    local component dir
    for component in $comps; do
        case "$component" in
            platforms\;*) dir="$SDK/platforms/${component#*;}"; [ -s "$dir/android.jar" ] && [ -s "$dir/source.properties" ] || fail "$component: missing android.jar or source.properties" ;;
            build-tools\;*) dir="$SDK/build-tools/${component#*;}"; [ -s "$dir/source.properties" ] && [ -s "$dir/lib/d8.jar" ] && [ -s "$dir/core-lambda-stubs.jar" ] || fail "$component: missing SDK files; installation needs inspection" ;;
        esac
    done
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
    curl -# -fL --retry 5 --retry-all-errors --retry-delay 3 --retry-max-time 1800 -C - -o "$z" "$url" \
        || curl -# -fL --retry 5 --retry-all-errors --retry-delay 3 --retry-max-time 1800 -o "$z" "$url" \
        || fail "download NDK"
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
op_flutter() {
    ensure_index
    step "Installing required dependencies for Flutter (git, curl, tar, xz-utils, python, dart)"
    pkg_retry pkg install git curl tar xz-utils python dart || fail "dependencies for flutter"
    step "Installing Flutter SDK (stable branch)"
    local FSDK="$HOME/flutter_sdk"
    if [ -d "$FSDK/.git" ]; then
        step "Updating existing Flutter SDK repository"
        git -C "$FSDK" fetch --depth=1 origin stable || true
        git -C "$FSDK" checkout stable || true
    elif [ -d "$FSDK" ]; then
        step "Existing non-git Flutter directory found, replacing with official git repo"
        rm -rf "$FSDK"
        git clone --depth 1 -b stable https://github.com/flutter/flutter.git "$FSDK" || fail "git clone flutter"
    else
        git clone --depth 1 -b stable https://github.com/flutter/flutter.git "$FSDK" || fail "git clone flutter"
    fi
    export FLUTTER_ROOT="$FSDK"
    case ":$PATH:" in
        *":$FSDK/bin:"*) ;;
        *) export PATH="$FSDK/bin:$PATH" ;;
    esac
    write_env
    step "Running Antigravity Flutter/Dart bionic patcher (agy-fix-flutter)"
    agy-fix-flutter || say "@@warn agy-fix-flutter finished with warnings"
    refresh_bridges
    say "@@done"
}
op_flutterremove() {
    step "Removing Flutter SDK"
    rm -rf "$HOME/flutter_sdk"
    write_env
    refresh_bridges
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
    "browserJsExecutionPolicy": "enum",
}
try:
    with open(cfg) as f:
        d = json.load(f)
except Exception as e:
    print("@@error config: %s" % e)
    raise SystemExit(1)
us = d.setdefault("userSettings", {})
if arg.startswith("init,"):
    for item in arg[5:].split(","):
        if "=" not in item:
            raise SystemExit(1)
        field, val = item.split("=", 1)
        if field not in FIELDS or not val:
            raise SystemExit(1)
        current = us.get(field)
        if current is None or current == "" or (not isinstance(current, bool) and current == 0) or (isinstance(current, str) and current.endswith("_UNSPECIFIED")):
            us[field] = (val.lower() == "true") if FIELDS[field] == "bool" else val
    tmp = cfg + ".tmp"
    with open(tmp, "w") as f:
        json.dump(d, f, ensure_ascii=False, indent=1)
    os.replace(tmp, cfg)
elif arg:
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
    verify_aidl() {
        local dir rc
        dir="$(mktemp -d "$PREFIX/tmp/agy-aidl-XXXXXX")" || return 1
        mkdir -p "$dir/com/agytest" "$dir/out" || { rm -rf "$dir"; return 1; }
        printf 'package com.agytest; interface ITest { int getVersion(); }\n' > "$dir/com/agytest/ITest.aidl"
        aidl -I"$dir" "$dir/com/agytest/ITest.aidl" -o "$dir/out"
        rc=$?
        if [ "$rc" -eq 0 ] && [ -s "$dir/out/com/agytest/ITest.java" ]; then echo "AIDL compilation succeeded"; else rc=1; echo "AIDL compilation failed or output is missing"; fi
        rm -rf "$dir"
        return "$rc"
    }
    chk() { # name, command...
        local name="$1"; shift
        local out code tmp="$PREFIX/tmp/agy-verify-$$-$name"
        mkdir -p "$PREFIX/tmp"
        "$@" >"$tmp" 2>&1; code=$?
        out="$(head -n 2 "$tmp" | tr '\n' ' ')"; rm -f "$tmp"
        if [ "$code" -eq 0 ]; then
            printf '@@ok %s %s\n' "$name" "$out"; ok=$((ok+1))
        else
            printf '@@fail %s %s\n' "$name" "$out"; bad=$((bad+1))
        fi
    }
    write_env
    refresh_bridges
    . "$ENVF" 2>/dev/null || true
    export TMPDIR="$PREFIX/tmp"
    export _JAVA_OPTIONS="${_JAVA_OPTIONS:-} -Djava.io.tmpdir=$PREFIX/tmp"
    # Run checks the way the agent does: core-like env, runtime/bin first.
    export PATH="$RB:$PREFIX/bin:/system/bin"
    unset LD_LIBRARY_PATH LD_PRELOAD
    local t
    for t in ${ARG//,/ }; do
        case "$t" in
            node)    chk node node -e 'console.log("node "+process.version)' ;;
            node-lts) chk node-lts sh -c 'v="$(node -p "process.versions.node")" || exit; meta="$PREFIX/var/lib/pkg/installed/nodejs-lts.meta"; want="$(sed -n "s/^version=//p" "$meta" | head -n1 | cut -d. -f1)"; [ -n "$want" ] && [ "${v%%.*}" = "$want" ] || { echo "active Node $v differs from installed LTS $want"; exit 1; }; echo "node $v"' ;;
            node-current) chk node-current sh -c 'v="$(node -p "process.versions.node")" || exit; meta="$PREFIX/var/lib/pkg/installed/nodejs.meta"; want="$(sed -n "s/^version=//p" "$meta" | head -n1 | cut -d. -f1)"; [ -n "$want" ] && [ "${v%%.*}" = "$want" ] || { echo "active Node $v differs from installed version $want"; exit 1; }; echo "node $v"' ;;
            npm)     chk npm npm -v ;;
            python)  chk python python -c 'import sys;print(sys.version.split()[0])' ;;
            java)    chk java java -version ;;
            javac)   chk javac javac -version ;;
            java17|java21|javac17|javac21)
                local v tool
                case "$t" in *17) v=17;; *) v=21;; esac
                case "$t" in javac*) tool=javac;; *) tool=java;; esac
                chk "$t" env LD_LIBRARY_PATH="$PREFIX/lib" "$PREFIX/lib/jvm/java-$v-openjdk/bin/$tool" -version ;;
            kotlin)  chk kotlin kotlinc -version ;;
            gradle)  chk gradle gradle -v --no-daemon -q ;;
            clang)   chk clang sh -c 'printf "int main(){return 0;}" > "$PREFIX/tmp/agy_t.c" && clang "$PREFIX/tmp/agy_t.c" -o "$PREFIX/tmp/agy_t" && "$PREFIX/tmp/agy_t" && echo compiled' ;;
            cmake)   chk cmake cmake --version ;;
            git)     chk git git --version ;;
            aapt)    chk aapt aapt version ;;
            aapt2)   chk aapt2 aapt2 version ;;
            aidl)    chk aidl verify_aidl ;;
            zipalign) chk zipalign sh -c 'zipalign 2>&1 | grep -q "Zip alignment utility"' ;;
            d8)      chk d8 d8 --version ;;
            apksigner) chk apksigner apksigner --version ;;
            adb)     chk adb adb version ;;
            sdk)     chk sdk sdkmanager --sdk_root="$SDK" --version ;;
            tsc)     chk tsc tsc -v ;;
            pnpm)    chk pnpm pnpm -v ;;
            ndk)     chk ndk sh -c 'ls "$ANDROID_NDK_HOME"/source.properties >/dev/null && grep Revision "$ANDROID_NDK_HOME/source.properties"' ;;
            rust)    chk rust rustc --version ;;
            go)      chk go go version ;;
            flutter) chk flutter sh -c '[ -x "$HOME/flutter_sdk/bin/flutter" ] && "$HOME/flutter_sdk/bin/flutter" --version 2>&1 | head -n1' ;;
            dart)    chk dart dart --version ;;
            *)       chk "$t" sh -c "command -v '$t'" ;;
        esac
    done
    say "@@verified $ok $bad"
    say "@@done"
    [ "$bad" -eq 0 ]
}
# ------------------------------------------------------------ MCP management
op_mcp() {
    local cmd="${ARG%% *}"
    local rest=""
    if [ "$cmd" != "$ARG" ]; then
        rest="${ARG#* }"
    fi
    local cfg="$HOME/.gemini/config/mcp_config.json"
    local node_exec="$HOME/runtime/bin/node"
    [ -x "$node_exec" ] || node_exec="$PREFIX/bin/node"

    case "$cmd" in
        status)
            step "Checking MCP components and servers"
            command -v node >/dev/null 2>&1 && say "@@mcp_comp node ok $(node -v 2>/dev/null)" || say "@@mcp_comp node - missing"
            command -v npm >/dev/null 2>&1 && say "@@mcp_comp npm ok $(npm -v 2>/dev/null)" || say "@@mcp_comp npm - missing"
            [ -f "$PREFIX/lib/node_modules/@modelcontextprotocol/server-sequential-thinking/dist/index.js" ] && say "@@mcp_comp sequential ok installed" || say "@@mcp_comp sequential - missing"
            [ -f "$PREFIX/lib/node_modules/@modelcontextprotocol/server-memory/dist/index.js" ] && say "@@mcp_comp memory ok installed" || say "@@mcp_comp memory - missing"
            [ -f "$PREFIX/lib/node_modules/@modelcontextprotocol/server-filesystem/dist/index.js" ] && say "@@mcp_comp filesystem ok installed" || say "@@mcp_comp filesystem - missing"
            [ -f "$PREFIX/lib/node_modules/@modelcontextprotocol/server-everything/dist/index.js" ] && say "@@mcp_comp everything ok installed" || say "@@mcp_comp everything - missing"
            [ -f "$PREFIX/lib/node_modules/exa-mcp-server/dist/stdio.cjs" ] && say "@@mcp_comp exa ok installed" || say "@@mcp_comp exa - missing"
            [ -f "$PREFIX/lib/node_modules/mcp-remote/dist/proxy.js" ] && say "@@mcp_comp remote ok installed" || say "@@mcp_comp remote - missing"
            [ -f "$PREFIX/lib/node_modules/@modelcontextprotocol/server-github/dist/index.js" ] && say "@@mcp_comp github ok installed" || say "@@mcp_comp github - missing"
            [ -f "$PREFIX/lib/node_modules/@upstash/context7-mcp/dist/index.js" ] && say "@@mcp_comp context7 ok installed" || say "@@mcp_comp context7 - missing"
            [ -f "$PREFIX/lib/node_modules/@modelcontextprotocol/server-brave-search/dist/index.js" ] && say "@@mcp_comp brave ok installed" || say "@@mcp_comp brave - missing"
            [ -f "$PREFIX/lib/node_modules/@utcp/mcp-bridge/dist/index.js" ] && say "@@mcp_comp utcp_bridge ok installed" || say "@@mcp_comp utcp_bridge - missing"
            [ -f "$PREFIX/lib/node_modules/@utcp/sdk/dist/index.js" ] && say "@@mcp_comp utcp_sdk ok installed" || say "@@mcp_comp utcp_sdk - missing"
            [ -f "$PREFIX/lib/node_modules/@utcp/http/dist/index.js" ] && say "@@mcp_comp utcp_http ok installed" || say "@@mcp_comp utcp_http - missing"
            [ -f "$PREFIX/lib/node_modules/@utcp/file/dist/index.js" ] && say "@@mcp_comp utcp_file ok installed" || say "@@mcp_comp utcp_file - missing"
            command -v gopls >/dev/null 2>&1 && say "@@mcp_comp gopls ok installed" || say "@@mcp_comp gopls - missing"
            command -v python3 >/dev/null 2>&1 && say "@@mcp_comp python ok $(python3 -V 2>/dev/null | awk '{print $2}')" || say "@@mcp_comp python - missing"
            command -v git >/dev/null 2>&1 && say "@@mcp_comp git ok $(git --version 2>/dev/null | awk '{print $3}')" || say "@@mcp_comp git - missing"

            python3 - "$cfg" "$PREFIX" "$HOME" <<'PY' || true
import json, sys, os
cfg, prefix, home = sys.argv[1], sys.argv[2], sys.argv[3]
try:
    data = {"mcpServers": {}}
    if os.path.exists(cfg) and os.path.getsize(cfg) > 0:
        try:
            with open(cfg) as f:
                data = json.load(f)
        except Exception:
            data = {"mcpServers": {}}
    servers = data.get("mcpServers", {})
    for name, srv in servers.items():
            dis = "1" if srv.get("disabled") else "0"
            env = srv.get("env", {})
            keys = []
            for k, v in env.items():
                if k in ("EXA_API_KEY", "GITHUB_PERSONAL_ACCESS_TOKEN", "X-Goog-Api-Key", "NOTION_API_KEY", "SENTRY_AUTH_TOKEN", "BRAVE_API_KEY"):
                    keys.append("%s=%s" % (k, v))
            if name == "StitchMCP":
                for a in srv.get("args", []):
                    if "X-Goog-Api-Key" in a:
                        keys.append("X-Goog-Api-Key=%s" % a.split(":", 1)[-1].strip())
            print("@@mcp_srv %s %s %s" % (name, dis, ",".join(keys)))

    # UTCP status
    utcp_cfg = os.path.join(home, ".gemini/config/utcp_config.json")
    manuals_dir = os.path.join(home, ".gemini/config/utcp_manuals")
    os.makedirs(manuals_dir, exist_ok=True)
    if os.path.exists(utcp_cfg):
        with open(utcp_cfg) as uf:
            udata = json.load(uf)
        for m in udata.get("manual_call_templates", []):
            mname = m.get("name", "")
            mtype = m.get("call_template_type", "http")
            msrc = m.get("url") or m.get("file_path", "")
            mdis = "1" if m.get("disabled") else "0"
            summary = "1 инструмент"
            if mtype == "file" and os.path.exists(msrc):
                try:
                    with open(msrc) as mf:
                        c = json.load(mf)
                        tls = [t.get("name") for t in c.get("tools", [])]
                        summary = f"{len(tls)}: {', '.join(tls)}"
                except:
                    pass
            print(f"@@utcp_srv {mname} {mtype} {msrc} {mdis} {summary}")
except Exception as e:
    print("@@error parse: %s" % e)
PY
            say "@@done"
            ;;
        install-all)
            step "Installing Node.js & npm if needed"
            if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
                ensure_index
                pkg_retry pkg install -y nodejs-lts npm || fail "pkg install nodejs-lts"
            fi
            step "Installing MCP npm packages"
            pkg_retry npm install -g --fetch-retries=5 --fetch-retry-maxtimeout=60000 \
                @modelcontextprotocol/server-sequential-thinking \
                @modelcontextprotocol/server-memory \
                @modelcontextprotocol/server-filesystem \
                @modelcontextprotocol/server-everything \
                @modelcontextprotocol/server-brave-search \
                exa-mcp-server \
                mcp-remote \
                @modelcontextprotocol/server-github \
                @upstash/context7-mcp || fail "npm install mcp packages"
            step "Fixing tool paths"
            agy-fix-paths "$PREFIX/bin" "$PREFIX/lib/node_modules" 2>/dev/null || true
            step "Installing gopls"
            pkg_retry pkg install gopls 2>/dev/null || true
            step "Normalizing mcp_config.json with native node paths"
            python3 - "$cfg" "$PREFIX" "$HOME" <<'PY' || true
import json, sys, os
cfg, prefix, home = sys.argv[1], sys.argv[2], sys.argv[3]
node_exec = os.path.join(home, "runtime/bin/node")
if not os.path.exists(node_exec):
    node_exec = os.path.join(prefix, "bin/node")
nm = os.path.join(prefix, "lib/node_modules")
env_std = {
    "LD_LIBRARY_PATH": os.path.join(prefix, "lib"),
    "PATH": f"{prefix}/bin:{home}/runtime/bin:/system/bin",
    "NODE_PATH": nm
}
data = {"mcpServers": {}}
if os.path.exists(cfg):
    try:
        with open(cfg) as f:
            data = json.load(f)
    except:
        pass
srvs = data.setdefault("mcpServers", {})

seq = srvs.setdefault("sequential-thinking", {})
seq["command"] = node_exec
seq["args"] = [os.path.join(nm, "@modelcontextprotocol/server-sequential-thinking/dist/index.js")]
seq["env"] = dict(env_std)

mem = srvs.setdefault("memory", {})
mem["command"] = node_exec
mem["args"] = [os.path.join(nm, "@modelcontextprotocol/server-memory/dist/index.js")]
mem["env"] = dict(env_std)

fs = srvs.setdefault("filesystem", {})
fs["command"] = node_exec
fs["args"] = [os.path.join(nm, "@modelcontextprotocol/server-filesystem/dist/index.js"), "/storage/emulated/0"]
fs["env"] = dict(env_std)

ev = srvs.setdefault("everything", {})
ev["command"] = node_exec
ev["args"] = [os.path.join(nm, "@modelcontextprotocol/server-everything/dist/index.js")]
ev["env"] = dict(env_std)

c7 = srvs.setdefault("context7", {})
c7["command"] = node_exec
c7["args"] = [os.path.join(nm, "@upstash/context7-mcp/dist/index.js")]
c7["env"] = dict(env_std)

ex = srvs.setdefault("exa", {})
old_exa_key = ex.get("env", {}).get("EXA_API_KEY", "")
ex["command"] = node_exec
ex["args"] = [os.path.join(nm, "exa-mcp-server/dist/stdio.cjs")]
ex["env"] = dict(env_std)
ex["env"]["EXA_API_KEY"] = old_exa_key or "YOUR_EXA_KEY"
ex["env"]["EXA_SOURCE"] = "antigravity"

br = srvs.setdefault("brave-search", {})
old_br_key = br.get("env", {}).get("BRAVE_API_KEY", "")
br["command"] = node_exec
br["args"] = [os.path.join(nm, "@modelcontextprotocol/server-brave-search/dist/index.js")]
br["env"] = dict(env_std)
br["env"]["BRAVE_API_KEY"] = old_br_key or "YOUR_BRAVE_KEY"

gh = srvs.setdefault("github-mcp-server", {})
old_gh_pat = gh.get("env", {}).get("GITHUB_PERSONAL_ACCESS_TOKEN", "")
gh["command"] = node_exec
gh["args"] = [os.path.join(nm, "@modelcontextprotocol/server-github/dist/index.js")]
gh["env"] = dict(env_std)
gh["env"]["GITHUB_PERSONAL_ACCESS_TOKEN"] = old_gh_pat or "YOUR_GITHUB_PAT"

st = srvs.setdefault("StitchMCP", {})
old_st_key = ""
for a in st.get("args", []):
    if "X-Goog-Api-Key" in a:
        old_st_key = a.split(":", 1)[-1].strip()
st["command"] = node_exec
st["args"] = [
    os.path.join(nm, "mcp-remote/dist/proxy.js"),
    "https://stitch.googleapis.com/mcp",
    "--header",
    f"X-Goog-Api-Key: {old_st_key or 'YOUR_KEY'}"
]
st["env"] = dict(env_std)

if os.path.exists(os.path.join(prefix, "bin/gopls")):
    gopls = srvs.setdefault("gopls-mcp-server", {})
    gopls["command"] = os.path.join(prefix, "bin/gopls")
    gopls["args"] = ["mcp"]
    gopls["env"] = {"PATH": f"{prefix}/bin:/system/bin"}

if "dart-mcp-server" in srvs:
    srvs["dart-mcp-server"]["disabled"] = True

os.makedirs(os.path.dirname(cfg), exist_ok=True)
tmp = cfg + ".tmp"
with open(tmp, "w") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
os.replace(tmp, cfg)
print("Config normalized successfully.")
PY
            say "@@done"
            ;;
        install)
            case "$rest" in
                sequential)
                    step "Installing @modelcontextprotocol/server-sequential-thinking"
                    pkg_retry npm install -g @modelcontextprotocol/server-sequential-thinking || fail "npm install sequential"
                    agy-fix-paths "$PREFIX/bin" "$PREFIX/lib/node_modules" 2>/dev/null || true
                    ;;
                memory)
                    step "Installing @modelcontextprotocol/server-memory"
                    pkg_retry npm install -g @modelcontextprotocol/server-memory || fail "npm install memory"
                    agy-fix-paths "$PREFIX/bin" "$PREFIX/lib/node_modules" 2>/dev/null || true
                    ;;
                filesystem)
                    step "Installing @modelcontextprotocol/server-filesystem"
                    pkg_retry npm install -g @modelcontextprotocol/server-filesystem || fail "npm install filesystem"
                    agy-fix-paths "$PREFIX/bin" "$PREFIX/lib/node_modules" 2>/dev/null || true
                    ;;
                everything)
                    step "Installing @modelcontextprotocol/server-everything"
                    pkg_retry npm install -g @modelcontextprotocol/server-everything || fail "npm install everything"
                    agy-fix-paths "$PREFIX/bin" "$PREFIX/lib/node_modules" 2>/dev/null || true
                    ;;
                context7)
                    step "Installing @upstash/context7-mcp"
                    pkg_retry npm install -g @upstash/context7-mcp || fail "npm install context7"
                    agy-fix-paths "$PREFIX/bin" "$PREFIX/lib/node_modules" 2>/dev/null || true
                    ;;
                brave)
                    step "Installing @modelcontextprotocol/server-brave-search"
                    pkg_retry npm install -g @modelcontextprotocol/server-brave-search || fail "npm install brave"
                    agy-fix-paths "$PREFIX/bin" "$PREFIX/lib/node_modules" 2>/dev/null || true
                    ;;
                exa)
                    step "Installing exa-mcp-server"
                    pkg_retry npm install -g exa-mcp-server || fail "npm install exa"
                    agy-fix-paths "$PREFIX/bin" "$PREFIX/lib/node_modules" 2>/dev/null || true
                    ;;
                remote)
                    step "Installing mcp-remote"
                    pkg_retry npm install -g mcp-remote || fail "npm install mcp-remote"
                    agy-fix-paths "$PREFIX/bin" "$PREFIX/lib/node_modules" 2>/dev/null || true
                    ;;
                github)
                    step "Installing @modelcontextprotocol/server-github"
                    pkg_retry npm install -g @modelcontextprotocol/server-github || fail "npm install github"
                    agy-fix-paths "$PREFIX/bin" "$PREFIX/lib/node_modules" 2>/dev/null || true
                    ;;
                gopls)
                    step "Installing gopls"
                    pkg_retry pkg install gopls || fail "pkg install gopls"
                    ;;
                node)
                    step "Installing Node.js LTS"
                    ensure_index
                    pkg_retry pkg install -y nodejs-lts npm || fail "pkg install nodejs-lts"
                    ;;
                utcp-bridge|utcp-sdk|utcp-http|utcp-file|utcp-all)
                    step "Installing UTCP packages (@utcp/mcp-bridge, @utcp/sdk, @utcp/http, @utcp/file, @utcp/cli)"
                    pkg_retry npm install -g --fetch-retries=5 --fetch-retry-maxtimeout=60000 \
                        @utcp/mcp-bridge @utcp/sdk @utcp/http @utcp/file @utcp/cli @utcp/dotenv-loader || fail "npm install utcp"
                    agy-fix-paths "$PREFIX/bin" "$PREFIX/lib/node_modules" 2>/dev/null || true
                    ;;
                *)
                    fail "unknown package: $rest"
                    ;;
            esac
            say "@@done"
            ;;
        add-custom)
            local sname="${rest%% *}"
            local scmd_and_more="${rest#* }"
            python3 - "$cfg" "$sname" "$scmd_and_more" "$PREFIX" "$HOME" <<'PY' || fail "add-custom failed"
import json, sys, os
cfg, name, raw, prefix, home = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5]
# format: cmd|arg1,arg2|KEY1=VAL1,KEY2=VAL2
parts = raw.split("|")
cmd = parts[0] if len(parts) > 0 else ""
args = [a.strip() for a in parts[1].split(",") if a.strip()] if len(parts) > 1 else []
env_pairs = [p.strip() for p in parts[2].split(",") if p.strip()] if len(parts) > 2 else []
env = {
    "LD_LIBRARY_PATH": os.path.join(prefix, "lib"),
    "PATH": f"{prefix}/bin:{home}/runtime/bin:/system/bin",
    "NODE_PATH": os.path.join(prefix, "lib/node_modules")
}
for p in env_pairs:
    if "=" in p:
        k, v = p.split("=", 1)
        env[k.strip()] = v.strip()
data = {"mcpServers": {}}
if os.path.exists(cfg):
    try:
        with open(cfg) as f:
            data = json.load(f)
    except:
        pass
srvs = data.setdefault("mcpServers", {})
srvs[name] = {
    "command": cmd,
    "args": args,
    "env": env
}
tmp = cfg + ".tmp"
with open(tmp, "w") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
os.replace(tmp, cfg)
print("Custom server added:", name)
PY
            say "@@done"
            ;;
        delete)
            local sname="$rest"
            python3 - "$cfg" "$sname" <<'PY' || fail "delete failed"
import json, sys, os
cfg, name = sys.argv[1], sys.argv[2]
if os.path.exists(cfg):
    with open(cfg) as f:
        data = json.load(f)
    if "mcpServers" in data and name in data["mcpServers"]:
        del data["mcpServers"][name]
        tmp = cfg + ".tmp"
        with open(tmp, "w") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(tmp, cfg)
PY
            say "@@done"
            ;;
        set-key)
            local srv="${rest%% *}"
            local kv="${rest#* }"
            [ "$srv" != "$rest" ] || fail "missing key=value"
            python3 - "$cfg" "$srv" "$kv" "$PREFIX" "$HOME" <<'PY' || fail "set-key failed"
import json, sys, os
cfg, srv, kv, prefix, home = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5]
k, v = kv.split("=", 1)
data = {"mcpServers": {}}
if os.path.exists(cfg) and os.path.getsize(cfg) > 0:
    try:
        with open(cfg) as f:
            data = json.load(f)
    except Exception:
        data = {"mcpServers": {}}
srvs = data.setdefault("mcpServers", {})
s = srvs.setdefault(srv, {})

node_exec = os.path.join(home, "runtime/bin/node")
if not os.path.exists(node_exec):
    node_exec = os.path.join(prefix, "bin/node")
nm = os.path.join(prefix, "lib/node_modules")
env_std = {
    "LD_LIBRARY_PATH": os.path.join(prefix, "lib"),
    "PATH": f"{prefix}/bin:{home}/runtime/bin:/system/bin",
    "NODE_PATH": nm
}

if srv == "StitchMCP":
    s.setdefault("command", node_exec)
    if not s.get("args"):
        s["args"] = [
            os.path.join(nm, "mcp-remote/dist/proxy.js"),
            "https://stitch.googleapis.com/mcp",
            "--header",
            f"X-Goog-Api-Key: {v}"
        ]
    else:
        found = False
        for i, a in enumerate(s["args"]):
            if "X-Goog-Api-Key" in a:
                s["args"][i] = f"X-Goog-Api-Key: {v}"
                found = True
                break
        if not found:
            s["args"].extend(["--header", f"X-Goog-Api-Key: {v}"])
    s.setdefault("env", dict(env_std))
else:
    s.setdefault("env", {})[k] = v

os.makedirs(os.path.dirname(cfg), exist_ok=True)
tmp = cfg + ".tmp"
with open(tmp, "w") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
os.replace(tmp, cfg)
PY
            say "@@done"
            ;;
        toggle)
            local srv="${rest%% *}"
            local val="${rest#* }"
            python3 - "$cfg" "$srv" "$val" "$PREFIX" "$HOME" <<'PY' || fail "toggle failed"
import json, sys, os
cfg, srv, val, prefix, home = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5]
data = {"mcpServers": {}}
if os.path.exists(cfg) and os.path.getsize(cfg) > 0:
    try:
        with open(cfg) as f:
            data = json.load(f)
    except Exception:
        data = {"mcpServers": {}}
srvs = data.setdefault("mcpServers", {})
s = srvs.setdefault(srv, {})

node_exec = os.path.join(home, "runtime/bin/node")
if not os.path.exists(node_exec):
    node_exec = os.path.join(prefix, "bin/node")
nm = os.path.join(prefix, "lib/node_modules")
env_std = {
    "LD_LIBRARY_PATH": os.path.join(prefix, "lib"),
    "PATH": f"{prefix}/bin:{home}/runtime/bin:/system/bin",
    "NODE_PATH": nm
}

# Auto-initialize known server templates if enabled and empty
if not s.get("command"):
    if srv == "sequential-thinking":
        s["command"] = node_exec
        s["args"] = [os.path.join(nm, "@modelcontextprotocol/server-sequential-thinking/dist/index.js")]
        s["env"] = dict(env_std)
    elif srv == "memory":
        s["command"] = node_exec
        s["args"] = [os.path.join(nm, "@modelcontextprotocol/server-memory/dist/index.js")]
        s["env"] = dict(env_std)
    elif srv == "filesystem":
        s["command"] = node_exec
        s["args"] = [os.path.join(nm, "@modelcontextprotocol/server-filesystem/dist/index.js"), "/storage/emulated/0"]
        s["env"] = dict(env_std)
    elif srv == "github-mcp-server":
        s["command"] = node_exec
        s["args"] = [os.path.join(nm, "@modelcontextprotocol/server-github/dist/index.js")]
        s["env"] = dict(env_std)
    elif srv == "StitchMCP":
        s["command"] = node_exec
        s["args"] = [
            os.path.join(nm, "mcp-remote/dist/proxy.js"),
            "https://stitch.googleapis.com/mcp",
            "--header",
            "X-Goog-Api-Key: YOUR_KEY"
        ]
        s["env"] = dict(env_std)

if val == "1":
    s.pop("disabled", None)
else:
    s["disabled"] = True

os.makedirs(os.path.dirname(cfg), exist_ok=True)
tmp = cfg + ".tmp"
with open(tmp, "w") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
os.replace(tmp, cfg)
PY
            say "@@done"
            ;;
        reset-config)
            step "Resetting config to clean native template"
            python3 - "$cfg" "$PREFIX" "$HOME" <<'PY' || true
import json, sys, os
cfg, prefix, home = sys.argv[1], sys.argv[2], sys.argv[3]
node_exec = os.path.join(home, "runtime/bin/node")
if not os.path.exists(node_exec):
    node_exec = os.path.join(prefix, "bin/node")
nm = os.path.join(prefix, "lib/node_modules")
env_std = {
    "LD_LIBRARY_PATH": os.path.join(prefix, "lib"),
    "PATH": f"{prefix}/bin:{home}/runtime/bin:/system/bin",
    "NODE_PATH": nm
}
data = {
  "mcpServers": {
    "sequential-thinking": {
      "command": node_exec,
      "args": [os.path.join(nm, "@modelcontextprotocol/server-sequential-thinking/dist/index.js")],
      "env": dict(env_std)
    },
    "exa": {
      "command": node_exec,
      "args": [os.path.join(nm, "exa-mcp-server/dist/stdio.cjs")],
      "env": {
        **env_std,
        "EXA_API_KEY": "YOUR_EXA_KEY",
        "EXA_SOURCE": "antigravity"
      }
    },
    "github-mcp-server": {
      "command": node_exec,
      "args": [os.path.join(nm, "@modelcontextprotocol/server-github/dist/index.js")],
      "env": {
        **env_std,
        "GITHUB_PERSONAL_ACCESS_TOKEN": "YOUR_GITHUB_PAT"
      }
    },
    "StitchMCP": {
      "command": node_exec,
      "args": [
        os.path.join(nm, "mcp-remote/dist/proxy.js"),
        "https://stitch.googleapis.com/mcp",
        "--header",
        "X-Goog-Api-Key: YOUR_KEY"
      ],
      "env": dict(env_std)
    }
  }
}
os.makedirs(os.path.dirname(cfg), exist_ok=True)
tmp = cfg + ".tmp"
with open(tmp, "w") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
os.replace(tmp, cfg)
PY
            say "@@done"
            ;;
        add-utcp)
            python3 - "$cfg" "$PREFIX" "$HOME" "$rest" <<'PY' || fail "add-utcp failed"
import json, sys, os
cfg, prefix, home, raw = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
# format: name|type|source|auth_header
parts = raw.split("|")
name = parts[0].strip() if len(parts) > 0 else ""
ctype = parts[1].strip() if len(parts) > 1 else "openapi"
source = parts[2].strip() if len(parts) > 2 else ""
auth = parts[3].strip() if len(parts) > 3 else ""

if not name or not source:
    print("Error: name and source required")
    sys.exit(1)

utcp_cfg = os.path.join(home, ".gemini/config/utcp_config.json")
manuals_dir = os.path.join(home, ".gemini/config/utcp_manuals")
os.makedirs(manuals_dir, exist_ok=True)

data = {"manual_call_templates": []}
if os.path.exists(utcp_cfg):
    try:
        with open(utcp_cfg) as f:
            data = json.load(f)
    except:
        pass

# Remove existing with same name if any
tmpls = [t for t in data.get("manual_call_templates", []) if t.get("name") != name]

new_tmpl = {"name": name}
if ctype == "file" or source.endswith(".json") or source.startswith("/") or source.startswith("~"):
    expanded_path = os.path.expanduser(source)
    new_tmpl["call_template_type"] = "file"
    new_tmpl["file_path"] = expanded_path
    new_tmpl["allowed_communication_protocols"] = ["http", "file", "cli"]
else:
    new_tmpl["call_template_type"] = "http"
    new_tmpl["http_method"] = "GET"
    new_tmpl["url"] = source
    if auth:
        new_tmpl["headers"] = {"Authorization": auth if " " in auth else f"Bearer {auth}"}

tmpls.append(new_tmpl)
data["manual_call_templates"] = tmpls

tmp = utcp_cfg + ".tmp"
with open(tmp, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
os.replace(tmp, utcp_cfg)

# Ensure utcp in mcp_config.json
node_exec = os.path.join(home, "runtime/bin/node")
if not os.path.exists(node_exec):
    node_exec = os.path.join(prefix, "bin/node")
mcp_data = {"mcpServers": {}}
if os.path.exists(cfg):
    try:
        with open(cfg) as f:
            mcp_data = json.load(f)
    except:
        pass
mcp_srvs = mcp_data.setdefault("mcpServers", {})
mcp_srvs["utcp"] = {
    "command": node_exec,
    "args": [os.path.join(prefix, "lib/node_modules/@utcp/mcp-bridge/dist/index.js")],
    "env": {
        "UTCP_CONFIG_FILE": utcp_cfg,
        "LD_LIBRARY_PATH": os.path.join(prefix, "lib"),
        "PATH": f"{prefix}/bin:{home}/runtime/bin:/system/bin",
        "NODE_PATH": os.path.join(prefix, "lib/node_modules")
    }
}
mcp_srvs["utcp"].pop("disabled", None)
mtmp = cfg + ".tmp"
with open(mtmp, "w", encoding="utf-8") as f:
    json.dump(mcp_data, f, ensure_ascii=False, indent=2)
os.replace(mtmp, cfg)

print(f"UTCP manual {name} added and bridge registered")
PY
            say "@@done"
            ;;
        delete-utcp)
            local uname="$rest"
            python3 - "$cfg" "$HOME" "$uname" <<'PY' || fail "delete-utcp failed"
import json, sys, os
cfg, home, uname = sys.argv[1], sys.argv[2], sys.argv[3]
utcp_cfg = os.path.join(home, ".gemini/config/utcp_config.json")
if os.path.exists(utcp_cfg):
    with open(utcp_cfg) as f:
        data = json.load(f)
    tmpls = [t for t in data.get("manual_call_templates", []) if t.get("name") != uname]
    data["manual_call_templates"] = tmpls
    tmp = utcp_cfg + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    os.replace(tmp, utcp_cfg)
print(f"UTCP manual {uname} deleted")
PY
            say "@@done"
            ;;
        toggle-utcp)
            local uname="${rest%% *}"
            local val="${rest#* }"
            python3 - "$HOME" "$uname" "$val" <<'PY' || fail "toggle-utcp failed"
import json, sys, os
home, uname, val = sys.argv[1], sys.argv[2], sys.argv[3]
utcp_cfg = os.path.join(home, ".gemini/config/utcp_config.json")
if os.path.exists(utcp_cfg):
    with open(utcp_cfg) as f:
        data = json.load(f)
    for t in data.get("manual_call_templates", []):
        if t.get("name") == uname:
            if val == "1":
                t.pop("disabled", None)
            else:
                t["disabled"] = True
    tmp = utcp_cfg + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    os.replace(tmp, utcp_cfg)
print(f"UTCP manual {uname} toggle {val}")
PY
            say "@@done"
            ;;
        test-utcp)
            local uname="$rest"
            step "Testing UTCP manual: $uname"
            python3 - "$HOME" "$PREFIX" "$uname" <<'PY' || true
import json, sys, os, subprocess
home, prefix, uname = sys.argv[1], sys.argv[2], sys.argv[3]
utcp_cfg = os.path.join(home, ".gemini/config/utcp_config.json")
manual = None
if os.path.exists(utcp_cfg):
    with open(utcp_cfg) as f:
        data = json.load(f)
    for t in data.get("manual_call_templates", []):
        if t.get("name") == uname:
            manual = t
            break

if not manual:
    print(f"@@utcp_test_fail {uname} Мануал не найден в конфигурации")
    sys.exit(0)

# Quick discovery check
ctype = manual.get("call_template_type", "http")
source = manual.get("url") or manual.get("file_path", "")

node_exec = os.path.join(home, "runtime/bin/node")
if not os.path.exists(node_exec):
    node_exec = os.path.join(prefix, "bin/node")

js_code = f"""
import '@utcp/http';
import '@utcp/file';
import {{ UtcpClient, ensureCorePluginsInitialized, UtcpClientConfigSerializer }} from '@utcp/sdk';
ensureCorePluginsInitialized();
const tmpl = {json.dumps(manual)};
const ser = new UtcpClientConfigSerializer();
const parsed = ser.validateDict({{ manual_call_templates: [tmpl] }});
const client = await UtcpClient.create(process.cwd(), parsed);
const tools = await client.config.tool_repository.getTools();
const toolInfo = tools.map(t => ({{ name: t.name, desc: t.description }}));
console.log('@@UTCP_RES:' + JSON.stringify(toolInfo));
"""

try:
    proc = subprocess.run(
        [node_exec, "--input-type=module", "-e", js_code],
        cwd=os.path.join(prefix, "lib/node_modules/@utcp/mcp-bridge"),
        env=dict(os.environ, NODE_PATH=os.path.join(prefix, "lib/node_modules")),
        capture_output=True,
        text=True,
        timeout=15
    )
    res_line = [l for l in proc.stdout.splitlines() if l.startswith("@@UTCP_RES:")]
    if res_line:
        raw_json = res_line[0].split(":", 1)[1]
        tools = json.loads(raw_json)
        names = [t.get("name") for t in tools]
        print(f"@@utcp_test_ok {uname} Обнаружено {len(names)} инструментов: {', '.join(names)}")
    else:
        err = (proc.stderr or proc.stdout).strip().replace("\n", " ")[:200]
        print(f"@@utcp_test_fail {uname} {err or 'Ошибка обнаружения инструментов'}")
except Exception as ex:
    print(f"@@utcp_test_fail {uname} {str(ex)}")
PY
            say "@@done"
            ;;
        *)
            fail "unknown mcp subcommand: $cmd"
            ;;
    esac
}

# ------------------------------------------------------------ Customizations (Skills, Rules, Plugins)
op_customizations() {
    local cmd="${ARG%% *}"
    local rest=""
    if [ "$cmd" != "$ARG" ]; then
        rest="${ARG#* }"
    fi
    local cfg_dir="$HOME/.gemini/config"
    local app_dir="$HOME/.gemini/antigravity-app"

    case "$cmd" in
        status)
            step "Scanning skills, rules and plugins"
            python3 - "$cfg_dir" "$app_dir" <<'PY'
import json, os, glob, sys, re

cfg_dir, app_dir = sys.argv[1], sys.argv[2]
config_file = os.path.join(cfg_dir, "config.json")
agents_file = os.path.join(cfg_dir, "AGENTS.md")

cfg_data = {}
if os.path.exists(config_file):
    try:
        with open(config_file) as f:
            cfg_data = json.load(f)
    except:
        pass

plugins_cfg = cfg_data.get("plugins", {})
disabled_skills = set(cfg_data.get("disabledSkills", []))

def parse_skill(path, stype, plugin_name=""):
    name = os.path.basename(os.path.dirname(path))
    desc = ""
    try:
        with open(path, encoding="utf-8", errors="replace") as f:
            content = f.read(3000)
        m = re.search(r"^---\s*\n(.*?)\n---", content, re.DOTALL)
        if m:
            fm = m.group(1)
            nm = re.search(r"^name:\s*(.+)$", fm, re.MULTILINE)
            if nm: name = nm.group(1).strip()
            dm = re.search(r"^description:\s*(?:>-\s*|\s*)(.+?)(?=\n[a-zA-Z0-9_-]+:|\Z)", fm, re.DOTALL | re.MULTILINE)
            if dm: desc = " ".join(dm.group(1).split())
    except:
        pass
    en = "0" if name in disabled_skills else "1"
    clean_desc = desc.replace("|", " ").replace("\n", " ")
    print("@@cust_skill %s|%s|%s|%s|%s|%s" % (stype, name, plugin_name, en, path, clean_desc[:250]))

for p in sorted(glob.glob(f"{app_dir}/builtin/skills/*/SKILL.md")):
    parse_skill(p, "builtin")

for pdir in sorted(glob.glob(f"{cfg_dir}/plugins/*")):
    pname = os.path.basename(pdir)
    for sp in sorted(glob.glob(f"{pdir}/**/SKILL.md", recursive=True)):
        parse_skill(sp, "plugin", pname)

user_skills_dir = os.path.join(cfg_dir, "skills")
if os.path.exists(user_skills_dir):
    for sp in sorted(glob.glob(f"{user_skills_dir}/*/SKILL.md")):
        parse_skill(sp, "user")

for pdir in sorted(glob.glob(f"{cfg_dir}/plugins/*")):
    pname = os.path.basename(pdir)
    pmanifest = os.path.join(pdir, "plugin.json")
    title = pname
    desc = ""
    if os.path.exists(pmanifest):
        try:
            with open(pmanifest) as f:
                pdata = json.load(f)
                title = pdata.get("name", pname)
                desc = pdata.get("description", "")
        except:
            pass
    if not desc:
        readme = os.path.join(pdir, "README.md")
        if os.path.exists(readme):
            try:
                with open(readme, encoding="utf-8", errors="replace") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#"):
                            desc = line[:150]
                            break
            except:
                pass
    skills_count = len(glob.glob(f"{pdir}/**/SKILL.md", recursive=True))
    has_rules = "1" if os.path.exists(os.path.join(pdir, "rules")) else "0"
    has_mcp = "1" if os.path.exists(os.path.join(pdir, "mcp_config.json")) else "0"
    is_enabled = "1" if plugins_cfg.get(pname, {}).get("enabled", True) else "0"
    clean_desc = desc.replace("|", " ").replace("\n", " ")
    print("@@cust_plugin %s|%s|%s|%s|%s|%s|%s" % (pname, title, is_enabled, skills_count, has_rules, has_mcp, clean_desc))

instr_len = os.path.getsize(agents_file) if os.path.exists(agents_file) else 0
print("@@cust_instr_size %d" % instr_len)
PY
            say "@@done"
            ;;
        read-instructions)
            local agents_file="$cfg_dir/AGENTS.md"
            if [ -f "$agents_file" ]; then
                say "@@cust_instr_start"
                cat "$agents_file"
                say ""
                say "@@cust_instr_end"
            else
                say "@@cust_instr_start"
                say "# Antigravity Custom Instructions"
                say ""
                say "@@cust_instr_end"
            fi
            say "@@done"
            ;;
        save-instructions)
            local b64="$rest"
            python3 - "$cfg_dir/AGENTS.md" "$b64" <<'PY' || fail "save-instructions failed"
import sys, base64, os
dest, b64_data = sys.argv[1], sys.argv[2]
content = base64.b64decode(b64_data).decode("utf-8")
os.makedirs(os.path.dirname(dest), exist_ok=True)
tmp = dest + ".tmp"
with open(tmp, "w", encoding="utf-8") as f:
    f.write(content)
os.replace(tmp, dest)
print("Saved instructions:", len(content), "bytes")
PY
            say "@@done"
            ;;
        add-skill)
            python3 - "$cfg_dir" "$rest" <<'PY' || fail "add-skill failed"
import sys, base64, os
cfg_dir, raw = sys.argv[1], sys.argv[2]
parts = raw.split("|")
name = parts[0].strip()
desc = base64.b64decode(parts[1]).decode("utf-8").strip() if len(parts) > 1 else ""
body = base64.b64decode(parts[2]).decode("utf-8") if len(parts) > 2 else ""

skill_dir = os.path.join(cfg_dir, "skills", name)
os.makedirs(skill_dir, exist_ok=True)
skill_md = os.path.join(skill_dir, "SKILL.md")

file_content = f"""---
name: {name}
description: >-
  {desc}
---

{body}
"""
tmp = skill_md + ".tmp"
with open(tmp, "w", encoding="utf-8") as f:
    f.write(file_content)
os.replace(tmp, skill_md)
print("Skill created:", skill_md)
PY
            say "@@done"
            ;;
        delete-skill)
            local sname="$rest"
            local sdir="$cfg_dir/skills/$sname"
            if [ -d "$sdir" ]; then
                rm -rf "$sdir"
                say "Skill deleted: $sname"
            else
                fail "Skill not found: $sname"
            fi
            say "@@done"
            ;;
        toggle-skill)
            local sname="${rest%% *}"
            local val="${rest#* }"
            python3 - "$cfg_dir/config.json" "$sname" "$val" <<'PY' || fail "toggle-skill failed"
import json, sys, os
cfg_file, name, val = sys.argv[1], sys.argv[2], sys.argv[3]
data = {}
if os.path.exists(cfg_file):
    try:
        with open(cfg_file) as f:
            data = json.load(f)
    except:
        pass
disabled = set(data.get("disabledSkills", []))
if val == "1":
    disabled.discard(name)
else:
    disabled.add(name)
data["disabledSkills"] = sorted(list(disabled))
tmp = cfg_file + ".tmp"
with open(tmp, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
os.replace(tmp, cfg_file)
print("Skill toggle saved:", name, val)
PY
            say "@@done"
            ;;
        toggle-plugin)
            local pname="${rest%% *}"
            local val="${rest#* }"
            python3 - "$cfg_dir/config.json" "$pname" "$val" <<'PY' || fail "toggle-plugin failed"
import json, sys, os
cfg_file, name, val = sys.argv[1], sys.argv[2], sys.argv[3]
data = {}
if os.path.exists(cfg_file):
    try:
        with open(cfg_file) as f:
            data = json.load(f)
    except:
        pass
plugins = data.setdefault("plugins", {})
pcfg = plugins.setdefault(name, {})
pcfg["enabled"] = (val == "1")
tmp = cfg_file + ".tmp"
with open(tmp, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
os.replace(tmp, cfg_file)
print("Plugin toggle saved:", name, val)
PY
            say "@@done"
            ;;
        copy-skill)
            python3 - "$cfg_dir" "$rest" <<'PY' || fail "copy-skill failed"
import sys, os, shutil

cfg_dir, raw = sys.argv[1], sys.argv[2]
parts = raw.split("|")
src_path = parts[0].strip()
target_name = parts[1].strip() if len(parts) > 1 and parts[1].strip() else ""

if not src_path or not os.path.exists(src_path):
    print("Error: Source skill path does not exist:", src_path)
    sys.exit(1)

src_dir = os.path.dirname(src_path) if os.path.isfile(src_path) else src_path
orig_name = os.path.basename(src_dir)
if not target_name:
    target_name = orig_name

user_skills_dir = os.path.join(cfg_dir, "skills")
os.makedirs(user_skills_dir, exist_ok=True)
dest_dir = os.path.join(user_skills_dir, target_name)

if os.path.abspath(src_dir) == os.path.abspath(dest_dir) or (os.path.exists(dest_dir) and len(parts) <= 1):
    dest_dir = os.path.join(user_skills_dir, target_name + "-custom")
    target_name = target_name + "-custom"

if os.path.exists(dest_dir):
    shutil.rmtree(dest_dir)

shutil.copytree(src_dir, dest_dir)
print(f"@@cust_skill_copied {target_name}|{dest_dir}")
print(f"Skill copied to user skills: {dest_dir}")
PY
            say "@@done"
            ;;
        read-skill)
            python3 - "$rest" <<'PY' || fail "read-skill failed"
import sys, os, re, base64

spath = sys.argv[1].strip()
if not os.path.exists(spath):
    print("Error: skill not found:", spath)
    sys.exit(1)

if os.path.isdir(spath):
    spath = os.path.join(spath, "SKILL.md")

with open(spath, encoding="utf-8", errors="replace") as f:
    content = f.read()

name = os.path.basename(os.path.dirname(spath))
desc = ""
body = content

m = re.search(r"^---\s*\n(.*?)\n---(.*)", content, re.DOTALL)
if m:
    fm = m.group(1)
    body = m.group(2).strip()
    nm = re.search(r"^name:\s*(.+)$", fm, re.MULTILINE)
    if nm: name = nm.group(1).strip()
    dm = re.search(r"^description:\s*(?:>-\s*|\s*)(.+?)(?=\n[a-zA-Z0-9_-]+:|\Z)", fm, re.DOTALL | re.MULTILINE)
    if dm: desc = " ".join(dm.group(1).split())

b64_desc = base64.b64encode(desc.encode("utf-8")).decode("ascii")
b64_body = base64.b64encode(body.encode("utf-8")).decode("ascii")

print(f"@@cust_skill_data {name}|{b64_desc}|{b64_body}")
PY
            say "@@done"
            ;;
        install-plugin)
            python3 - "$cfg_dir" "$rest" <<'PY' || fail "install-plugin failed"
import sys, os, json, shutil

cfg_dir, pname = sys.argv[1], sys.argv[2].strip()
plugins_dir = os.path.join(cfg_dir, "plugins")
os.makedirs(plugins_dir, exist_ok=True)
target_dir = os.path.join(plugins_dir, pname)

presets = {
    "google-workspace": {
        "name": "Google Workspace & Cloud",
        "desc": "Инструменты для работы с Google Docs, Sheets, Slides, Drive и Cloud API.",
        "skills": {
            "gdocs-editor": ("Создание и форматирование документов Google Docs", "# Google Docs Editor\n\nИнструкции для структурирования и экспорта документов в Google Docs."),
            "gsheets-analyzer": ("Анализ и редактирование таблиц Google Sheets", "# Google Sheets Analyzer\n\nПравила парсинга и анализа табличных данных Google Sheets."),
            "gdrive-manager": ("Поиск, выгрузка и управление файлами Google Drive", "# Google Drive Manager\n\nСценарии работы с облачным файловым хранилищем.")
        }
    },
    "python-data-science": {
        "name": "Python Data Science & ML",
        "desc": "Пакет навыков для анализа данных, машинного обучения, работы с Pandas, NumPy и Jupyter.",
        "skills": {
            "python-eda": ("Разведочный анализ данных (EDA), очистка и статистика", "# Python EDA Guide\n\nРегламент проведения эксплораторного анализа данных и предобработки."),
            "data-visualization": ("Построение графиков Matplotlib/Seaborn/Plotly", "# Data Visualization\n\nПравила визуализации и оформления графиков.")
        }
    },
    "database-tools": {
        "name": "SQLite & Mobile Databases",
        "desc": "Проектирование схем и оптимизация запросов для SQLite — нативной БД Android.",
        "skills": {
            "sqlite-optimizer": ("Анализ планов запросов и тюнинг индексов SQLite", "# SQLite Query Optimizer\n\nМетодология анализа планов запросов (EXPLAIN QUERY PLAN) и оптимизации индексов SQLite."),
            "schema-design": ("Проектирование нормализованных схем БД и миграций", "# Database Schema Design\n\nПравила нормализации, внешних ключей и версионирования миграций.")
        }
    },
    "security-audit": {
        "name": "Security Audit & Hardening",
        "desc": "Статический анализ уязвимостей, проверка зависимостей (CVE) и защита от утечки секретов.",
        "skills": {
            "security-review": ("Поиск уязвимостей OWASP Top 10 в исходном коде", "# Security Code Review\n\nПаттерны выявления инъекций, XSS, CSRF и небезопасной десериализации."),
            "secret-scanner": ("Обнаружение захардкоженных токенов и API ключей", "# Secret Scanner\n\nРегулярные выражения и правила детекции токенов в кодовой базе.")
        }
    },
    "git-advanced": {
        "name": "Git Automation & Conventional Flow",
        "desc": "Автоматизация веток, генерация Conventional Commits и подготовка Pull Request.",
        "skills": {
            "git-conventional-commits": ("Формирование семантических сообщений коммитов", "# Conventional Commits\n\nСтандарт feat/fix/docs/refactor/chore с краткими описаниями."),
            "git-pr-review": ("Подготовка описаний и чеклистов для Pull Request", "# Pull Request Guidelines\n\nШаблон оформления PR и самопроверки перед мерджем.")
        }
    },
    "antigravity-sdk": {
        "name": "Google Antigravity SDK",
        "desc": "Создание AI-агентов с помощью Python SDK для Antigravity.",
        "skills": {
            "antigravity-sdk-guide": ("Разработка агентов на Python SDK Antigravity", "# Antigravity Python SDK Guide\n\nПаттерны создания агентов, подключения инструментов и управления сессиями через Python SDK Antigravity.")
        }
    },
    "science": {
        "name": "Science",
        "desc": "Подборка навыков агента для научных задач: методы, статистика, оформление исследований.",
        "skills": {
            "scientific-research": ("Научные исследования: методы, статистика, оформление", "# Scientific Research\n\nРегламент планирования экспериментов, статистической обработки данных и оформления научных работ.")
        }
    },
    "firebase": {
        "name": "Firebase",
        "desc": "Проектирование, создание и запуск проектов Firebase: Auth, Firestore, Functions.",
        "skills": {
            "firebase-architect": ("Проектирование схем Firestore и правил безопасности", "# Firebase Architect\n\nПроектирование коллекций Firestore, структуры Auth и правил безопасности (Security Rules)."),
            "firebase-deploy": ("Деплой проекта Firebase и управление индексами", "# Firebase Deploy\n\nКонфигурация firebase.json, индексы, деплой Functions и проверка после публикации.")
        }
    }
}

pdata = presets.get(pname, {
    "name": pname,
    "desc": f"Пользовательский плагин {pname}",
    "skills": {
        f"{pname}-guide": (f"Руководство для плагина {pname}", f"# {pname} Guide\n\nИнструкции плагина.")
    }
})

os.makedirs(target_dir, exist_ok=True)
manifest = {
    "name": pdata["name"],
    "version": "1.0.0",
    "description": pdata["desc"],
    "skills": list(pdata["skills"].keys())
}
with open(os.path.join(target_dir, "plugin.json"), "w", encoding="utf-8") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

with open(os.path.join(target_dir, "README.md"), "w", encoding="utf-8") as f:
    f.write(f"# {pdata['name']}\n\n{pdata['desc']}\n")

skills_base = os.path.join(target_dir, "skills")
for sk_name, (sk_desc, sk_body) in pdata["skills"].items():
    sdir = os.path.join(skills_base, sk_name)
    os.makedirs(sdir, exist_ok=True)
    with open(os.path.join(sdir, "SKILL.md"), "w", encoding="utf-8") as f:
        f.write(f"---\nname: {sk_name}\ndescription: >-\n  {sk_desc}\n---\n\n{sk_body}\n")

print(f"Plugin installed successfully: {target_dir}")
PY
            say "@@done"
            ;;
        uninstall-plugin)
            local pname="$rest"
            local pdir="$cfg_dir/plugins/$pname"
            if [ -d "$pdir" ]; then
                rm -rf "$pdir"
                say "Plugin uninstalled: $pname"
            else
                fail "Plugin directory not found: $pname"
            fi
            say "@@done"
            ;;
        reset-instructions)
            step "Resetting AGENTS.md to standard seed guidelines"
            local seed="$HOME/runtime/seed/AGENTS.md"
            [ -f "$seed" ] || seed="$PREFIX/etc/antigravity/AGENTS.md"
            if [ -f "$seed" ]; then
                cp "$seed" "$cfg_dir/AGENTS.md"
                say "Restored from seed."
            else
                fail "Seed AGENTS.md not found"
            fi
            say "@@done"
            ;;
        *)
            fail "unknown customizations subcommand: $cmd"
            ;;
    esac
}

case "$OP" in
    status)         op_status ;;
    index)          op_index ;;
    install)        op_install ;;
    remove)         op_remove ;;
    upgrade)        op_upgrade ;;
    npm)            op_npm ;;
    sdk)            op_sdk ;;
    sdkremove)      op_sdkremove ;;
    ndk)            op_ndk ;;
    ndkremove)      op_ndkremove ;;
    flutter)        op_flutter ;;
    flutterremove)  op_flutterremove ;;
    policy)         op_policy ;;
    verify)         op_verify ;;
    mcp)            op_mcp ;;
    customizations) op_customizations ;;
    *)              fail "unknown op: $OP" ;;
esac

