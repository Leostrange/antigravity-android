#!/usr/bin/env python3
"""Сборка Antigravity-BP 3.0 (standard / bypass) из полного дерева.

Источники:
  app/                      — распакованное дерево standard-APK (без META-INF)
  variants/bypass/          — дельта bypass (manifest.json + liblanguage_server.so)
  compress-map.json         — файлы, которые в APK хранятся без сжатия
  dist/antigravity-debug.keystore — ключ подписи (SHA-256 7360d934… — совпадает
                              с установленным приложением, APK встаёт поверх)

Сборка (нужны Python 3, Java 17 и apksigner):
  python3 rebuild.py            # оба APK
  python3 rebuild.py standard
  python3 rebuild.py bypass
Результат: dist/signed/<name>.apk
"""
import json
import os
import shutil
import struct
import subprocess
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
APP = ROOT / "app"
MAP = json.loads((ROOT / "compress-map.json").read_text(encoding="utf-8"))
BYPASS = {
    "assets/runtime/manifest.json": ROOT / "variants/bypass/assets/runtime/manifest.json",
    "assets/runtime/bin/liblanguage_server.so": ROOT / "variants/bypass/assets/runtime/bin/liblanguage_server.so",
}
KEYSTORE = ROOT / "dist/antigravity-debug.keystore"


def which_exe(name):
    p = shutil.which(name)
    if p:
        return p
    prefix = os.environ.get("PREFIX", "/data/user/0/com.agyru.bp/files/usr")
    cand = Path(prefix) / "bin" / name
    return str(cand) if cand.exists() else name


def collect(overlay):
    files = {}
    for dirpath, _, names in os.walk(APP):
        for name in names:
            full = Path(dirpath) / name
            rel = full.relative_to(APP).as_posix()
            files[rel] = full
    for rel, src in overlay.items():
        files[rel] = src          # дельта bypass заменяет файлы из app/
    return files


def pack(out, overlay):
    out.parent.mkdir(parents=True, exist_ok=True)
    if out.exists():
        out.unlink()
    files = collect(overlay)
    with zipfile.ZipFile(out, "w") as archive:
        for rel in sorted(files):
            info = zipfile.ZipInfo(rel)
            info.compress_type = MAP.get(rel, zipfile.ZIP_DEFLATED)
            info.date_time = (2026, 10, 16, 0, 0, 0)
            with open(files[rel], "rb") as src, archive.open(info, "w") as dst:
                shutil.copyfileobj(src, dst, 1024 * 1024)
    print("packed", out, out.stat().st_size)


def zipalign4(path):
    """Аналог `zipalign -f 4`: данные STORED-записей выравниваются по 4 байта.

    В extra локального заголовка добавляется валидная пустая запись (id+size=0
    байт) плюс 0..3 байта добивки — так данные начинаются по границе 4."""
    tmp = path.with_suffix(".aligned.tmp")
    zin = zipfile.ZipFile(path)
    with zipfile.ZipFile(tmp, "w") as zout:
        offset = 0
        for info in zin.infolist():
            data = zin.read(info.filename)
            new = zipfile.ZipInfo(info.filename, date_time=info.date_time)
            new.compress_type = info.compress_type
            new.external_attr = info.external_attr
            if info.compress_type == zipfile.ZIP_STORED:
                name_len = len(info.filename.encode("utf-8"))
                need = (-(offset + 30 + name_len)) % 4
                if need:
                    new.extra = struct.pack("<HH", 0x0001, 0) + b"\0" * need
            zout.writestr(new, data)
            offset += 30 + len(info.filename.encode("utf-8")) + len(new.extra) + new.compress_size
    zin.close()
    tmp.replace(path)
    # проверка выравнивания
    z = zipfile.ZipFile(path)
    base = 0
    bad = []
    for info in z.infolist():
        hdr = 30 + len(info.filename.encode("utf-8")) + len(info.extra)
        if info.compress_type == zipfile.ZIP_STORED and (base + hdr) % 4:
            bad.append(info.filename)
        base += hdr + info.compress_size
    z.close()
    if bad:
        raise SystemExit("zipalign: не выровнены: " + ", ".join(bad[:5]))
    print("zipalign4 ok:", path.name)


def sign(unsigned):
    signed_dir = ROOT / "dist/signed"
    signed_dir.mkdir(parents=True, exist_ok=True)
    out = signed_dir / (unsigned.stem.replace("-unsigned", "") + ".apk")
    if out.exists():
        out.unlink()

    # Prefer standalone apksigner binary; fall back to bundled uber-apk-signer.jar
    apksigner_bin = shutil.which("apksigner")
    uber_jar = ROOT / "tools/uber-apk-signer.jar"
    java_bin = which_exe("java")

    if apksigner_bin:
        subprocess.check_call([
            apksigner_bin, "sign",
            "--ks", str(KEYSTORE), "--ks-key-alias", "debug",
            "--ks-pass", "pass:android", "--key-pass", "pass:android",
            "--out", str(out), str(unsigned),
        ])
        subprocess.check_call([apksigner_bin, "verify", str(out)])
    elif uber_jar.exists():
        subprocess.check_call([
            java_bin, "-jar", str(uber_jar),
            "--apks", str(unsigned),
            "--ks", str(KEYSTORE), "--ksAlias", "debug",
            "--ksPass", "android", "--ksKeyPass", "android",
            "--out", str(signed_dir),
            "--skipZipAlign",
        ])
        # uber-apk-signer outputs <base>-aligned-signed.apk or <base>-signed.apk
        base_name = unsigned.stem.replace("-unsigned", "")
        candidates = list(signed_dir.glob(base_name + "*signed*.apk"))
        if candidates:
            candidates[0].replace(out)
    else:
        raise SystemExit(
            "Neither apksigner nor tools/uber-apk-signer.jar found. "
            "Install OpenJDK: pkg install openjdk-17"
        )
    print("signed", out)


def main():
    which = sys.argv[1] if len(sys.argv) > 1 else "both"
    jobs = []
    if which in ("standard", "both"):
        jobs.append(("standard", {}))
    if which in ("bypass", "both"):
        jobs.append(("bypass", BYPASS))
    if not jobs:
        print("usage: python3 rebuild.py [standard|bypass|both]")
        return 2
    for name, overlay in jobs:
        unsigned = ROOT / "dist" / f"{name}-unsigned.apk"
        pack(unsigned, overlay)
        zipalign4(unsigned)
        sign(unsigned)
    print("ready in", ROOT / "dist/signed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
