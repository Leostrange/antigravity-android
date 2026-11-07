<p align="center"><img src="./assets/antigravity-bp-banner.svg" alt="Antigravity-BP — русская сборка Antigravity для Android" width="100%" /></p>

<p align="center">
  <a href="https://github.com/Leostrange/antigravity-android/releases/latest"><img src="https://img.shields.io/badge/Release-v3.0--ru-7C3AED?style=flat-square" alt="Release" /></a>
  <img src="https://img.shields.io/badge/Android-3DDC84?style=flat-square&logo=android&logoColor=white" alt="Android" />
  <img src="https://img.shields.io/badge/ARM64-v8.0--A+-111827?style=flat-square" alt="ARM64" />
  <img src="https://img.shields.io/badge/Русская-локализация-0033A0?style=flat-square" alt="Русская локализация" />
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-Apache_2.0-7C3AED?style=flat-square" alt="License" /></a>
</p>

<p align="center"><b>Antigravity для Android — русская сборка Antigravity-BP (v3.0).</b><br/>
Полная русификация, щит безопасности агента, темы и компактный интерфейс, вложения, инструменты, Flutter SDK, MCP- и UTCP-серверы.</p>

<p align="center"><sub>Форк <a href="https://github.com/werdio325-png/antigravity-android">werdio325-png/antigravity-android</a> — сборка <a href="https://github.com/Leostrange">@Leostrange</a>.</sub></p>

<p align="center"><a href="https://github.com/Leostrange/antigravity-android/releases/tag/v3.0"><b>Скачать APK</b></a> &nbsp;·&nbsp; <a href="https://github.com/Leostrange/antigravity-android/releases/tag/v3.0">Исходный код</a> &nbsp;·&nbsp; <a href="CHANGELOG.md">Изменения</a> &nbsp;·&nbsp; <a href="https://github.com/Leostrange/antigravity-android/issues">Issues</a></p>

---

## Antigravity для Android 3.0

**Antigravity** — автономный агентный движок разработки, который работает **нативно в userspace Android** (Linux 6.1, AArch64, Bionic) внутри процесса приложения — без PRoot, QEMU и chroot. Агент на моделях Gemini сам осматривает кодовую базу, правит файлы, запускает сборку и проверяет результат прямо на устройстве.

**Antigravity-BP** — русская сборка этого окружения с доработанным интерфейсом и настройками автономной работы агента. Сделана **на основе [werdio325-png/antigravity-android](https://github.com/werdio325-png/antigravity-android)** — этот репозиторий является его форком.

## Возможности

- **полная русификация** интерфейса: словарь EN → RU, статусы действий агента, живой индикатор рассуждений, русская плюрализация;
- **щит безопасности** в чате: профиль безопасности, доступ к файлам и интернету, автовыполнение команд терминала, песочница и JavaScript — с реально сохраняющимися выборами;
- **автономный режим агента**: «Не спрашивать» (EAGER) — агент работает без лишних подтверждений;
- **темы** списков и окон, светлая и тёмная схемы, компактные меню, попапы и выпадающие списки;
- **компактный чат** с вложениями до 10 файлов (просмотр и удаление прикреплённого);
- настройки диктовки, режимы мышления, экспорт сессий;
- встроенные инструменты разработки (Tools) и бэкенд настроек с поддержкой **Flutter SDK в 1 клик**;
- **MCP-серверы** (sequential-thinking, exa, github-mcp-server, StitchMCP) — в том числе с кастомными провайдерами;
- **UTCP-серверы и OpenAPI 3.0** (Universal Tool Calling Protocol) — прямое подключение REST API и спецификаций без написания промежуточных прокси;
- **кастомизация агента**: копирование, редактирование и создание навыков (Skills), каталог плагинов из Build With Google.

## Сборки

| Сборка | Назначение | Файл |
|---|---|---|
| **Standard** | базовая, без обхода региональных ограничений | [`Antigravity-BP-3.0-standard.apk`](https://github.com/Leostrange/antigravity-android/releases/tag/v3.0) |
| **Bypass** | с обходом региональных ограничений (region bypass) | [`Antigravity-BP-3.0-bypass.apk`](https://github.com/Leostrange/antigravity-android/releases/tag/v3.0) |

Region bypass — патч Go-ядра `liblanguage_server.so`: в трёх местах байтовые проверки заменены на запись константы `1` (форс-пропуск), плюс обновляется `assets/runtime/manifest.json` с sha256 ядра. В standard-сборке стоят оригинальные инструкции, в bypass — патченые. Дельта лежит отдельно в `variants/bypass/`.

## Установка

1. Скачайте APK из [релиза](https://github.com/Leostrange/antigravity-android/releases/tag/v3.0) и сверьте SHA-256 с файлом [`SHA256SUMS.txt`](https://github.com/Leostrange/antigravity-android/releases/download/v3.0/SHA256SUMS.txt).
2. Установка идёт **поверх** `com.agyru.bp` — подпись совпадает, данные и сессии сохраняются.
3. После установки перезапустите приложение. Настройки щита применяются сразу и хранятся в `config.json`.

## Что нового в 3.0

- переход на собственную мажорную нумерацию **3.0**;
- интеграция **Flutter SDK** в «Настройки › Инструменты» (установка и удаление в 1 клик, bionic-патчинг `agy-fix-flutter`, верификация `flutter,dart`);
- реализация поддержки **UTCP-серверов и спецификаций OpenAPI 3.0** (вкладка «🌐 UTCP & OpenAPI», каталог готовых бесплатных API, мост в ядро);
- обновлённый раздел **«Пользовательские настройки»**: просмотр, клонирование и редактирование навыков (Skills), каталог плагинов из Build With Google;
- курация каталогов MCP и плагинов исключительно под нативные возможности Android (SQLite, Python, Node, Git);
- решение системных проблем JVM (Termux-OpenJDK) через глобальный профиль `65-agy-jvm.sh` (`JAVA_TOOL_OPTIONS`);
- новая обёртка `jadx-agy` с защитой от переполнения памяти (OOM-kill 137);
- устранение критического сбоя `JSONDecodeError` при сохранении ключей и переключении MCP-серверов при пустом `mcp_config.json`;
- автоматическое маскирование звёздочками (`***`) для всех секретных ключей (включая `X-Goog-Api-Key` для StitchMCP);
- исправление официальной ссылки StitchMCP на `https://stitch.withgoogle.com/` и автогенерация валидной конфигурации запуска;
- исправлена работа **MCP-серверов с кастомными провайдерами** (рекурсия shell-мостов, линковка Bionic, точки входа) — все 45 инструментов в статусе ready;
- устранено аварийное завершение процессов ядра и команд с кодом 164 (`SIGRTMIN+2` / signal 36 от Android 16 `traced_perf`);
- надёжное сохранение выбранной кастомной модели в `localStorage` при сворачивании и перезапуске приложения;
- устранено зависание установщика инструментов (Settings › Tools), добавлен автотайм-аут и кнопка отмены `[✕]`;
- исправлен запуск терминала (`libandroid-support.so not found`) через защищённую Bionic-обёртку bash с автоматическим экспортом `LD_LIBRARY_PATH`.

Полный список: [CHANGELOG.md](CHANGELOG.md).

## MCP-серверы

- **Требуется Node.js**: `pkg install nodejs-lts`.
- **Процедура**: серверы добавляются из стандартного провайдера Antigravity, затем переключается ядро.
- **Шаблон конфига** — [`mcp_config.example.json`](mcp_config.example.json): каждый сервер запускается через `node <entrypoint.js>` с обязательными `LD_LIBRARY_PATH=$PREFIX/lib`, `PATH` и `NODE_PATH` в блоке `env`. Рабочий конфиг кладётся в `~/.gemini/config/mcp_config.json`.
- Проверено: `sequential-thinking`, `exa`, `github-mcp-server`, `StitchMCP` (mcp-remote) — суммарно 45 инструментов в статусе `MCP_SERVER_STATUS_READY`; вызовы пробрасываются шлюзом `AgyGateway` в кастомные модели по протоколу OpenAI.

## Ограничения ядра

1. **Стандартные и кастомные модели нельзя использовать одновременно.** Встроенные модели (Gemini / Claude / ChatGPT) и кастомные модели (провайдеры) работают только по отдельности — между ними переключается ядро.
2. **Плагины и MCP-серверы** в настройках пользователя также доступны только при переключённом ядре.
3. **Кастомные модели работают только с Android Speech Cognition** (транскрибация речи через микрофон) — встроенная голосовая цепочка им недоступна, это ограничение ядра.

## Состав репозитория (полный исходный код)

```text
├── README.md, CHANGELOG.md, LICENSE
├── assets/antigravity-bp-banner.svg       баннер проекта (стилистика Leostrange)
├── app/                                   ПОЛНОЕ дерево APK без подписи
│   ├── AndroidManifest.xml, classes*.dex, resources.arsc, res/
│   └── assets/
│       ├── web/                           веб-интерфейс и мод (то, что правится)
│       │   ├── generated/main.js          бандл React-приложения
│       │   ├── agy_ru.css, agy_shield.js, agy_i18n.js, agy_tools.* …
│       ├── runtime/                       Go-ядро (liblanguage_server.so) и рантайм
│       └── env/                           bootstrap userspace, оверлей и пакеты
├── variants/bypass/                       дельта bypass-билда (manifest + патченое ядро)
├── rebuild.py                             скрипт сборки standard / bypass
├── compress-map.json                      файлы, хранимые в APK без сжатия
├── mcp_config.example.json                шаблон конфига MCP-серверов
├── tools/uber-apk-signer.jar              подпись + zipalign
└── dist/antigravity-debug.keystore        ключ подписи (встаёт поверх установленного)
```

> [!NOTE]
> Полный архив исходников — [`Antigravity-BP-repo.zip`](https://github.com/Leostrange/antigravity-android/releases/tag/v3.0) в релизе. Два файла ядра `liblanguage_server.so` (по 181 МБ) не хранятся в git из-за лимита GitHub в 100 МБ на файл — они внутри APK и в архиве исходников.

## Сборка APK

Нужны Python 3 и Java (OpenJDK 17):

```bash
python3 rebuild.py            # оба APK (standard + bypass)
python3 rebuild.py standard   # только standard
python3 rebuild.py bypass     # только bypass
```

Готовые подписанные APK появятся в `dist/signed/`. Подпись — `dist/antigravity-debug.keystore`, поэтому APK встаёт **поверх** установленного `com.agyru.bp` без потери данных.

Все правки интерфейса лежат в `app/assets/web/` — после изменений достаточно пересобрать.

## Лицензия

Код проекта распространяется по лицензии [Apache 2.0](LICENSE). Antigravity, Gemini и сторонние компоненты принадлежат соответствующим авторам и распространяются по их собственным лицензиям. Оригинальный проект: [werdio325-png/antigravity-android](https://github.com/werdio325-png/antigravity-android).

---

<p align="center"><sub>Part of the <a href="https://github.com/Leostrange">Leostrange</a> open-source projects.</sub></p>
