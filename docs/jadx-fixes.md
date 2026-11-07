# Отчёт: ошибки декомпиляции jadx — фиксы для AGY

Файл-пример: `/storage/emulated/0/Download/xgesture-1.62.0-full.apk` (~70 МБ).

## Корневая причина всех ошибок jadx

В окружении AGY установлена **Termux-сборка OpenJDK 17**, у которой зашиты (hardcoded)
пути Termux:

- RPATH бинарника: `/data/data/com.termux/files/usr/lib/jvm/java-17-openjdk/lib:...`
- `user.home` → `/data/data/com.termux/files/home`
- `java.io.tmpdir` → `/data/data/com.termux/files/usr/tmp`

Эти пути из песочницы AGY (`/data/user/0/com.agyru.bp/files`) **недоступны** →
`java.nio.file.AccessDeniedException`.

---

## Ошибки и фиксы

### 1. `ExceptionInInitializerError: Failed to init common directories`

```
java.nio.file.AccessDeniedException: /data/data/com.termux/files/home/.cache
  at jadx.commons.app.JadxCommonFiles$DirsLoader.loadEnvDir
```

**Причина:** jadx кладёт кэш в `user.home/.cache`, а `user.home` указывает на Termux.

**Фикс:** задать `user.home` и `XDG_CACHE_HOME` на доступный каталог:

```bash
env HOME="$HOME" XDG_CACHE_HOME="$WORK/cache" \
  JAVA_TOOL_OPTIONS="-Duser.home=$HOME" jadx ...
```

### 2. `Failed to create temp root directory`

```
java.nio.file.AccessDeniedException: /data/data/com.termux/files/usr/tmp/jadx-instance-...
  at jadx.core.utils.files.FileUtils.createTempRootDir
```

**Причина:** `java.io.tmpdir` зашит в Termux-prefixed путь. JVM **игнорирует**
`TMPDIR` для `java.io.tmpdir` — нужен явный JVM-флаг.

**Фикс:** `JAVA_TOOL_OPTIONS="-Djava.io.tmpdir=$WORK/cache/tmp" jadx ...`

### 3. Exit code 137 (SIGKILL)

**Причина:** либо OOM (70 МБ APK, jadx подъедает много RAM; на устройстве ~2 ГБ
свободно), либо убийство процесса при рестарте сервера.

**Фикс:** ограничить кучу и потоки:

```bash
JAVA_TOOL_OPTIONS="... -Xmx1500m" jadx -j 2 ...
```

Также снизить нагрузку: `--no-res` (ресурсы даёт apktool) и не гонять jadx и apktool
параллельно, если память на исходе.

### 4. `Unknown option: --single-class-thread`

Просто несуществующий флаг jadx 1.5.6. Для ограничения параллелизма используется `-j N`.

### 5. apktool: `W: Could not decode file, replacing by NULL value: res/*.9.png`

**Причина:** обфускатор (Ali/梆梆-style) ломает chunk-структуру девятипачных PNG —
apktool не может их декодировать в `res/`.

**Фикс:** безвредно для smali/манифеста. Если нужны сами картинки — взять сырые из APK:

```bash
unzip -o xgesture-1.62.0-full.apk "res/*.9.png" -d raw_res
```

---

## Рабочая универсальная команда jadx для AGY

```bash
WORK="$HOME/.gemini/antigravity-app/scratch/<job>"
mkdir -p "$WORK/cache/tmp"
env HOME="$HOME" XDG_CACHE_HOME="$WORK/cache" TMPDIR="$WORK/cache/tmp" \
  JAVA_TOOL_OPTIONS="-Djava.io.tmpdir=$WORK/cache/tmp -Duser.home=$HOME -Xmx1500m" \
  jadx -d "$WORK/jadx_out" --no-res -j 2 /path/to/app.apk
```

## Постоянный фикс (реализован в сборке)

Обёртка **`jadx-agy`** (`$PREFIX/bin/jadx-agy`, поставляется в overlay):

```sh
#!/data/user/0/com.agyru.bp/files/usr/bin/env sh
WORK="${XDG_CACHE_HOME:-$HOME/.cache}/jadx"
mkdir -p "$WORK/tmp"
export JAVA_TOOL_OPTIONS="-Djava.io.tmpdir=$WORK/tmp -Duser.home=$HOME -Xmx1500m ${JAVA_TOOL_OPTIONS:-}"
exec jadx "$@"
```

Использование: `jadx-agy -d out --no-res -j 2 app.apk`.

Для **всех** Java-инструментов (apktool, d8, apksigner, jadx-gui, Gradle) флаги
путь-путей обеспечиваются профилем `$PREFIX/etc/profile.d/65-agy-jvm.sh`
(`JAVA_TOOL_OPTIONS`), который `agy-fix-paths` восстанавливает при отсутствии.

> [!TIP]
> То же касается любого Java-инструмента в AGY: Termux-JDK всегда требует
> `-Djava.io.tmpdir` и `-Duser.home`.

> [!NOTE]
> `agy-fix-paths` дополнен шагом 3: при отсутствии создаёт
> `etc/profile.d/65-agy-jvm.sh`.
