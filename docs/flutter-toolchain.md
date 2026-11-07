# Flutter / Dart Toolchain на Antigravity Android — полный документ фиксов

> [!IMPORTANT]
> Это **единственный источник правды** о том, как починить Flutter-тулчейн внутри Android-песочницы Antigravity.
> Все команды выполняются в терминале Antigravity. Пути абсолютные, повторять их можно в любой момент — фиксы идемпотентны.

> [!NOTE]
> **Всё автоматизировано:** скрипт `agy-fix-flutter` (поставляется в overlay, есть на `PATH`)
> выполняет разделы 1–7 идемпотентно. Запуск: `agy-fix-flutter`. Полный ручной текст ниже —
> для понимания и отладки.

---

## Быстрая диагностика: симптом → причина → фикс

| Симптом в терминале | Причина | Фикс (раздел) |
|---|---|---|
| `dart: cannot execute: required file not found` (запуск `flutter --version`) | Flutter скачал **glibc**-сборку Dart, а системная библиотека-загрузчик Android (`/lib/ld-linux-aarch64.so.1`, `libdl.so.2`) отсутствует — в Android используется bionic | [1. Termux Dart + подмена SDK](#1-pkg-install-dart--подмена-cache-dart-sdk) |
| `Unsupported host platform: android_arm64` | `flutter_tools` не знает про ABI `androidArm64` в `hostPlatform` | [2. Патч os.dart](#2-патч-flutter_toolsosdart) |
| `Unsupported operating system: android` | `flutter_cache.dart` (Font Subsets) смотрит на `operatingSystem` и не находит `'android'` в своей таблице артефактов | [3. Патч platform.dart](#3-патч-flutter_toolsplatformdart) |
| Аналогичные ошибки `Unsupported operating system` из `package:platform` | То же самое в пакете `platform` из pub-cache | [4. Патч local_platform.dart](#4-патч-packageplatform-pub-cache) |
| Патчи «не действуют» после правок | Используется закешированный AOT-снимок `flutter_tools.snapshot` | [5. Пересборка снимка](#5-пересборка-flutter_toolssnapshot) |
| `Could not initialize native services / Failed to load native library 'libnative-platform.so'` + `java.io.IOException: Permission denied` | JVM по умолчанию видит `user.home=/data/data/com.termux/files/home` (несуществующий путь) → Gradle не может создать каталог кеша нативных либ | [6. GRADLE_OPTS=-Duser.home](#6-gradle--duserhome) |
| `Caused by: net.rubygrapefruit.platform.NativeException ... broken executable` | Повреждённый (прерванная распаковка) `libnative-platform.so` в `~/.gradle/native/` | [7. Очистка кеша нативных библиотек Gradle](#7-очистка-кеша-gradle-native) |

---

## Что было установлено

| Компонент | Версия | Установка | Путь |
|---|---|---|---|
| Dart SDK (bionic, Android) | 3.13.7 | `pkg update && pkg install dart` (≈92 МБ) | `/data/user/0/com.agyru.bp/files/usr/lib/dart-sdk` (синглтон-обёртка `/data/user/0/com.agyru.bp/files/usr/bin/dart`) |
| Flutter SDK | 3.47.9 (stable) | уже присутствовал | `/data/user/0/com.agyru.bp/files/flutter_sdk` |
| JDK | OpenJDK 17.0.21 | уже присутствовал | `java`, `javac` в `$PREFIX/bin` |
| Android SDK | platforms 34–37, build-tools 34–37 | уже присутствовал | `/data/user/0/com.agyru.bp/files/android-sdk` |
| Gradle | 9.8.2 | уже присутствовал | `$PREFIX/opt/gradle` |

---

## 1. `pkg install dart` + подмена `cache/dart-sdk`

**Зачем:** Flutter SDK при первом запуске скачал официальный Dart SDK под **Linux glibc** (`ELF shared object ... /lib/ld-linux-aarch64.so.1`). В Android-песочнице такого загрузчика нет — бинарь не стартует (`cannot execute: required file not found`, `library "libdl.so.2" not found`). Решение — использовать Termux-сборку Dart (bionic), **ровно той же версии** (3.13.7), что требует этот Flutter.

```bash
# 1) Установить Dart SDK под Android (bionic)
pkg update
pkg install dart

# 2) Убедиться, что версии совпадают с ожиданием Flutter
dart --version        # должно быть 3.13.7
cat /data/user/0/com.agyru.bp/files/flutter_sdk/bin/cache/dart-sdk/version   # тоже 3.13.7

# 3) Подменить glibc-сборку в кеше Flutter на Termux-сборку
cd /data/user/0/com.agyru.bp/files/flutter_sdk/bin/cache
mv dart-sdk dart-sdk.glibc            # сохранить оригинал (не удалять!)
ln -s /data/user/0/com.agyru.bp/files/usr/lib/dart-sdk dart-sdk

# 4) Проверка
dart-sdk/bin/dart --version   # должно ответить: Dart SDK version 3.13.7 ... on "android_arm64"
```

> [!WARNING]
> При **обновлении Flutter SDK** (`flutter upgrade`) кеш может быть перескачан заново (glibc-версия). В этом случае повторить шаг 3. Если версии Dart разойдутся (`flutter_tools` требует конкретную) — сверять файлы `flutter_sdk/bin/cache/dart-sdk/version` и `dart --version`.

---

## 2. Патч `flutter_tools/base/os.dart`

**Зачем:** `hostPlatform` не знает про `Abi.androidArm64` → `Unsupported host platform: android_arm64` при конструировании команд.

**Файл:** `/data/user/0/com.agyru.bp/files/flutter_sdk/packages/flutter_tools/lib/src/base/os.dart`

В геттере `hostPlatform` (метод `switch (_currentAbi)`) добавить ветки Android-ABI перед дефолтной:

```dart
      Abi.windowsArm64 => HostPlatform.windows_arm64,
      // Antigravity (Android userspace) patch: treat Android host as Linux.
      Abi.androidArm64 => HostPlatform.linux_arm64,
      Abi.androidArm => HostPlatform.linux_arm64,
      Abi.androidX64 => HostPlatform.linux_x64,
      _ => throw UnsupportedError('Unsupported host platform: $_currentAbi'),
```

---

## 3. Патч `flutter_tools/base/platform.dart`

**Зачем:** модуль `flutter_cache.dart` (загрузка артефактов, включая Font Subsets) построен на таблице `{macos, linux, windows}` и падает с `Unsupported operating system: android`.

**Файл:** `/data/user/0/com.agyru.bp/files/flutter_sdk/packages/flutter_tools/lib/src/base/platform.dart` (класс `LocalPlatform`, строка с `String get operatingSystem`)

Заменить геттер:

```dart
  @override
  String get operatingSystem => io.Platform.operatingSystem == 'android'
      ? 'linux'
      : io.Platform.operatingSystem;
```

> [!NOTE]
> Это безопасно: Android-юзерспейс (Termux) по сути и есть Linux-окружение для всех хостовых утилит Flutter. Флаги `isAndroid`/`isLinux` вычисляются от `operatingSystem`, поэтому хост корректно станет `linux`, а целевая платформа Android (сборка APK) определяется отдельно — `flutter build apk` работает нормально.

---

## 4. Патч `package:platform` (pub-cache)

**Зачем:** то же самое, но в публичном пакете `platform`, который используют некоторые плагины и инструменты.

**Файл:** `/data/user/0/com.agyru.bp/files/.pub-cache/hosted/pub.dev/platform-3.1.6/lib/src/interface/local_platform.dart`
*(если версия пакета другая — путь `platform-<версия>/`)*

Заменить геттер `operatingSystem`:

```dart
  @override
  String get operatingSystem =>
      io.Platform.operatingSystem == 'android' && !_runningOnDevice
          ? 'linux'
          : io.Platform.operatingSystem;

  static final bool _runningOnDevice =
      io.Platform.environment.containsKey('FLUTTER_ON_DEVICE');
```

> [!WARNING]
> `flutter pub get` может скачать **новую версию** пакета `platform` — патч останется только в старой папке. После обновлений зависимостей проверить:
> ```bash
> grep -rn "get operatingSystem" /data/user/0/com.agyru.bp/files/.pub-cache/hosted/pub.dev/platform-*/lib/src/interface/local_platform.dart
> ```
> и при необходимости повторить патч для новой версии (или просто запустить `agy-fix-flutter` — он патчит все копии).

---

## 5. Пересборка `flutter_tools.snapshot`

**Зачем:** `flutter` запускается не из исходников, а из AOT-снимка `flutter_tools.snapshot`. Патчи 2–4 не действуют, пока снимок не пересобран.

```bash
rm -f /data/user/0/com.agyru.bp/files/flutter_sdk/bin/cache/flutter_tools.snapshot \
      /data/user/0/com.agyru.bp/files/flutter_sdk/bin/cache/flutter_tools.stamp

# Следующий запуск flutter сам пересоберёт снимок (займёт ~1–2 мин):
export GRADLE_OPTS="-Duser.home=$HOME"
/data/user/0/com.agyru.bp/files/flutter_sdk/bin/flutter --version
```

**Проверка успеха:** вывод `Flutter 3.47.9 ... Tools • Dart 3.13.7` без ошибок.

---

## 6. Gradle: `-Duser.home`

**Зачем:** JVM в этой среде определяет `user.home=/data/data/com.termux/files/home` (путь из `/etc/passwd`, несуществующий в песочнице). Gradle пытается распаковать `libnative-platform.so` в `<user.home>/.gradle/native/...` и получает `java.io.IOException: Permission denied` → `Could not initialize native services`.

```bash
export GRADLE_OPTS="-Duser.home=$HOME"
```

Зафиксировано навсегда в `~/.gradle/gradle.properties`:

```properties
org.gradle.jvmargs=-Xmx1536m -Djava.io.tmpdir=/data/user/0/com.agyru.bp/files/usr/tmp -Duser.home=/data/user/0/com.agyru.bp/files
```

> [!NOTE]
> `org.gradle.jvmargs` действует на **daemon**, а падение идёт в **клиентском** процессе — поэтому нужен именно `GRADLE_OPTS` (его gradle-скрипт применит к клиентской JVM). В сборке клиентская JVM получает те же флаги из `$PREFIX/etc/profile.d/65-agy-jvm.sh` через `JAVA_TOOL_OPTIONS` — без `export GRADLE_OPTS=...` в «чистом» окружении ошибка может вернуться.

---

## 7. Очистка кеша Gradle Native

**Зачем:** после прерванной распаковки в `~/.gradle/native/<hash>/linux-aarch64/libnative-platform.so` остаётся битый файл (`ldd: Could not find a PHDR: broken executable?`), и Gradle падает дальше.

```bash
rm -rf ~/.gradle/native
```

Gradle сам пересоздаст каталог и распакует библиотеку заново.

---

## Готовый сценарий сборки APK Flutter

```bash
# Окружение (один раз на терминал)
export GRADLE_OPTS="-Duser.home=$HOME"
export PATH="/data/user/0/com.agyru.bp/files/flutter_sdk/bin:$PATH"
export ANDROID_HOME=/data/user/0/com.agyru.bp/files/android-sdk   # local.properties указывает сюда же

# Проверка тулчейна
flutter --version      # Flutter 3.47.9 • Dart 3.13.7
flutter doctor         # Android toolchain должен быть виден

# Проект
cd /data/user/0/com.agyru.bp/files/.gemini/antigravity-app/scratch/subvault_flutter
flutter pub get
flutter analyze

# Сборка (нативный рендеринг Impeller, AOT — вес 20+ МБ, не «CSS-обёртка»)
flutter build apk --release

# Результат:
ls -lh build/app/outputs/flutter-apk/app-release.apk
cp build/app/outputs/flutter-apk/app-release.apk /storage/emulated/0/Download/SubVault.apk
```

---

## Что делать при багах после обновлений

| Что обновилось | Что слетает | Что сделать |
|---|---|---|
| `flutter upgrade` | Снимок `flutter_tools`, возможно кеш `dart-sdk` | Запустить `agy-fix-flutter` (разделы 1–5) |
| `flutter pub get` (обновился `platform`) | Патч раздела 4 | Запустить `agy-fix-flutter` (патчит все `platform-*`) |
| Переустановка Gradle / сброс `~/.gradle` | `GRADLE_OPTS`, кеш native | Запустить `agy-fix-flutter` (разделы 6–7) |
| Смена версии Dart в pkg | Симлинк `cache/dart-sdk` указывает на старый SDK | `agy-fix-flutter` сверит версии и предупредит |
