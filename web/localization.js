(function () {
  "use strict";

  const STORAGE_MODE = "agy.ui.language.mode.v1";
  const STORAGE_ONBOARDED = "agy.ui.language.onboarded.v1";
  const MODES = new Set(["system", "ru", "en"]);

  const RU = {
    "Pin": "Закрепить",
    "Conversation Name": "Название диалога",
    "Conversation ID": "ID диалога",
    "Conversation Archived": "Диалог архивирован",
    "View archived conversations in history.": "Архивированные диалоги доступны в истории.",
    "View archived conversations in": "Архивированные диалоги доступны в",
    "history": "истории",
    "Undo": "Отменить",
    "Allow searching directories?": "Разрешить поиск по каталогам?",
    "Locate Antigravity Projects Folder": "Найти папку Antigravity Projects",
    "Find Antigravity Projects folder": "Найди папку Antigravity Projects",
    "Requires manual review for all terminal commands and file accesses outside of the working folders.": "Требует ручного подтверждения всех команд терминала и доступа к файлам вне рабочих папок.",
    "All terminal commands require review. The agent can read or write to any file in the machine.": "Все команды терминала требуют подтверждения. Агент может читать и изменять любые файлы на устройстве.",
    "Disables all safety barriers for maximal iteration velocity.": "Отключает все защитные ограничения для максимально быстрой работы.",
    "Install android-tools finished": "Установка android-tools завершена",
    "Sign verbose finished": "Подробная проверка подписи завершена",
    "Allow once": "Разрешить один раз",
    "Always allow": "Всегда разрешать",
    "Yes, allow once": "Да, разрешить сейчас",
    "No, tell the agent what to do differently": "Нет, указать агенту другое действие",
    "Media": "Медиа",
    "Mentions": "Упоминания",
    "Actions": "Действия",
    "Run until the specified goal is completely finished.": "Выполнять до полного достижения цели.",
    "Run until the specified goal is completely finished": "Выполнять до полного достижения цели",
    "Run an instruction on a recurring schedule or as a one-time timer.": "Запуск по повторяющемуся расписанию или однократному таймеру.",
    "Run an instruction on a recurring schedule or as a one-time timer": "Запуск по повторяющемуся расписанию или однократному таймеру",
    "Invoke a browser agent for web tasks.": "Запустить браузерного агента для веб-задач.",
    "Invoke a browser agent for web tasks": "Запустить браузерного агента для веб-задач",
    "Interview me to align on a plan.": "Провести интервью для согласования плана.",
    "Interview me to align on a plan": "Провести интервью для согласования плана",
    "Invoke a team of agents to autonomously tackle large projects.": "Запустить команду агентов для автономной работы над крупными проектами.",
    "Invoke a team of agents to autonomously tackle large projects": "Запустить команду агентов для крупных проектов",
    "Reflect on recent successes or corrections to capture reusable skills.": "Анализировать успехи и исправления для сохранения переиспользуемых навыков.",
    "Reflect on recent successes or corrections to capture reusable skills": "Анализировать успехи и исправления для сохранения навыков",
    "Reflect on recent successes or corrections to capture reusable skills or rules.": "Анализировать недавние успехи и исправления, чтобы сохранять переиспользуемые навыки и правила.",
    "Reflect on recent successes or corrections to capture reusable skills or rules": "Анализировать недавние успехи и исправления, чтобы сохранять переиспользуемые навыки и правила",
    "Stop Recording and Send": "Остановить запись и отправить",
    "Stop Recording": "Остановить запись",
    "Record Audio": "Голосовой ввод",
    "Recording": "Идёт запись…",
    "Finalizing transcription...": "Транскрибация речи…",
    "Voice recording is unavailable while the Concierge mic is on": "Запись голоса недоступна, пока включён микрофон Консьержа",
    "Node.js required": "Требуется Node.js",
    "Node.js is required for plugins to work.": "Для работы плагинов требуется установленный Node.js.",
    "Remove attachment": "Удалить вложение",
    "Preview attachment": "Просмотреть вложение",
    "Invalid Media": "Недопустимое вложение",
    "Maximum number of attachments reached": "Достигнуто максимальное количество вложений",
    "Agent execution terminated due to error.": "Выполнение агента завершилось с ошибкой.",
    "Agent execution terminated due to error": "Выполнение агента завершилось с ошибкой",
    "Loading workspace customizations...": "Загрузка настроек рабочей области…",
    "Loading workspace customizations…": "Загрузка настроек рабочей области…",
    "Loading token usage data...": "Загрузка данных об использовании токенов…",
    "Loading token usage data…": "Загрузка данных об использовании токенов…",
    "Failed to process image": "Не удалось обработать изображение",
    "Unsupported file format": "Неподдерживаемый формат файла",
    "Sign Out": "Выйти",
    "Sign out": "Выйти",
    "Email": "Эл. почта",

    "Settings": "Настройки",
    "Open Settings": "Открыть настройки",
    "General": "Общие",
    "Project General": "Общие настройки проекта",
    "Project Settings": "Настройки проекта",
    "Project Agent": "Агент проекта",
    "Appearance": "Оформление",
    "Theme": "Тема",
    "System": "Системная",
    "Light": "Светлая",
    "Dark": "Тёмная",
    "Language": "Язык",
    "English": "English",
    "Russian": "Русский",
    "System language": "Язык системы",
    "Follow system language": "Как в системе",
    "New Conversation": "Новый диалог",
    "New conversation": "Новый диалог",
    "New Workspace": "Новое рабочее пространство",
    "New workspace": "Новое рабочее пространство",
    "New Project": "Новый проект",
    "New project": "Новый проект",
    "New Editor Window": "Новое окно редактора",
    "Open Workspace": "Открыть рабочее пространство",
    "Open workspace": "Открыть рабочее пространство",
    "Select Workspace": "Выберите рабочее пространство",
    "Select Project": "Выберите проект",
    "Workspace": "Рабочее пространство",
    "Workspaces": "Рабочие пространства",
    "Workspace Name": "Название рабочего пространства",
    "Project": "Проект",
    "Projects": "Проекты",
    "Project Folders": "Папки проекта",
    "Open Folder": "Открыть папку",
    "Open folder": "Открыть папку",
    "Select Folder": "Выберите папку",
    "Recent": "Недавние",
    "Home": "Главная",
    "Back": "Назад",
    "Next": "Далее",
    "Previous": "Назад",
    "Continue": "Продолжить",
    "Continue Response": "Продолжить ответ",
    "Get Started": "Начать",
    "Done": "Готово",
    "Finish": "Завершить",
    "Skip": "Пропустить",
    "Close": "Закрыть",
    "Cancel": "Отмена",
    "OK": "ОК",
    "Apply": "Применить",
    "Save": "Сохранить",
    "Save & Continue": "Сохранить и продолжить",
    "Create": "Создать",
    "Creating...": "Создание…",
    "Edit": "Изменить",
    "Editing": "Изменение",
    "Edited": "Изменено",
    "Delete": "Удалить",
    "Remove": "Удалить",
    "Rename": "Переименовать",
    "Refresh": "Обновить",
    "Reload": "Перезагрузить",
    "Reload Window": "Перезагрузить окно",
    "Retry": "Повторить",
    "Try again": "Попробовать снова",
    "Reset": "Сбросить",
    "Enable": "Включить",
    "Disable": "Отключить",
    "Install": "Установить",
    "Installing...": "Установка…",
    "Installed": "Установлено",
    "Update": "Обновить",
    "Update Available": "Доступно обновление",
    "Downloading Update": "Загрузка обновления",
    "Install Update": "Установить обновление",
    "Installing Update": "Установка обновления",
    "Restart to Update": "Перезапустить для обновления",
    "Checking for updates...": "Проверка обновлений…",
    "Search": "Поиск",
    "Search...": "Поиск…",
    "Find": "Найти",
    "Filter": "Фильтр",
    "Select": "Выбрать",
    "Select...": "Выберите…",
    "Browse": "Обзор",
    "Open": "Открыть",
    "Remote Debugging Required": "Требуется удалённая отладка",
    "To use browser tools, you need to enable remote debugging:": "Чтобы пользоваться инструментами браузера, включите удалённую отладку:",
    "Navigate to": "Перейдите по адресу",
    "\"Allow remote debugging for this browser instance\"": "«Разрешить удалённую отладку для этого браузера»",
    "Proceed Anyway": "Продолжить всё равно",
    "Check again": "Проверить снова",
    "Checking...": "Проверка…",
    "DevTools port is still closed. Please make sure Chrome is running with remote debugging enabled.": "Порт DevTools всё ещё закрыт. Убедитесь, что Chrome запущен и удалённая отладка включена.",
    "Click to copy URL": "Нажмите, чтобы скопировать адрес",
    "View": "Просмотреть",
    "Preview": "Предпросмотр",
    "Show": "Показать",
    "Hide": "Скрыть",
    "More": "Ещё",
    "Other": "Другое",
    "Name": "Название",
    "Description": "Описание",
    "No description available.": "Описание отсутствует.",
    "Unnamed": "Без названия",
    "Unknown": "Неизвестно",
    "None": "Нет",
    "Default": "По умолчанию",
    "Recommended": "Рекомендуемые",
    "Advanced": "Дополнительно",
    "Developer Mode": "Режим разработчика",
    "Desktop Mode": "Режим рабочего стола",
    "Mobile Mode": "Мобильный режим",
    "Toggle Sidebar": "Показать или скрыть боковую панель",
    "Toggle Auxiliary Pane": "Показать или скрыть дополнительную панель",
    "Toggle Environment Selector": "Показать или скрыть выбор окружения",
    "Auxiliary Pane": "Дополнительная панель",
    "Sidebar": "Боковая панель",
    "File": "Файл",
    "Files": "Файлы",
    "Folder": "Папка",
    "Copy": "Копировать",
    "Copied": "Скопировано",
    "Copied to clipboard": "Скопировано в буфер обмена",
    "Copy path": "Копировать путь",
    "Copy value": "Копировать значение",
    "Copy conversation markdown": "Копировать диалог в Markdown",
    "Download": "Скачать",
    "Upload": "Загрузить",
    "Add": "Добавить",
    "Add Context": "Добавить контекст",
    "Add context": "Добавить контекст",
    "Attach": "Прикрепить",
    "Submit": "Отправить",
    "Send": "Отправить",
    "Stop": "Остановить",
    "Pause": "Приостановить",
    "Resume": "Продолжить",
    "Archive": "Архивировать",
    "Archive this conversation": "Архивировать этот диалог",
    "Find in conversation": "Найти в диалоге",
    "Split Conversation Vertically": "Разделить диалог по вертикали",
    "Split Conversation Horizontally": "Разделить диалог по горизонтали",
    "Close Tab": "Закрыть вкладку",
    "Split Terminal": "Разделить терминал",
    "Terminal": "Терминал",
    "Browser": "Браузер",
    "Editor": "Редактор",
    "Conversation": "Диалог",
    "Conversations": "Диалоги",
    "History": "История",
    "Agent": "Агент",
    "Agents": "Агенты",
    "Subagent": "Субагент",
    "Subagents": "Субагенты",
    "Stop Subagent": "Остановить субагента",
    "No subagents": "Нет субагентов",
    "Model": "Модель",
    "Models": "Модели",
    "Thinking": "Размышление",
    "Reasoning": "Рассуждение",
    "Low": "Низкий",
    "Medium": "Средний",
    "High": "Высокий",
    "Auto": "Авто",
    "Fast": "Быстро",
    "Balanced": "Сбалансированно",
    "Plan": "План",
    "Planning": "Планирование",
    "Execution": "Выполнение",
    "Review": "Проверка",
    "Accept": "Принять",
    "Accept all": "Принять всё",
    "Reject": "Отклонить",
    "Reject all": "Отклонить всё",
    "Approve": "Разрешить",
    "Deny": "Запретить",
    "Allow": "Разрешить",
    "Allow once": "Разрешить один раз",
    "Always allow": "Всегда разрешать",
    "Permissions": "Разрешения",
    "Request review": "Запрашивать проверку",
    "Rules": "Правила",
    "Skills": "Навыки",
    "Customizations": "Настройки пользователя",
    "Plugins": "Плагины",
    "UI Plugins": "Плагины интерфейса",
    "Automations": "Автоматизации",
    "Scheduled Tasks": "Запланированные задачи",
    "Commands": "Команды",
    "System Prompt": "Системная инструкция",
    "Edit config": "Изменить конфигурацию",
    "Overview": "Обзор",
    "Details": "Подробности",
    "Status": "Состояние",
    "Running": "Выполняется",
    "Working...": "Выполнение…",
    "Loading": "Загрузка",
    "Loading...": "Загрузка…",
    "Analyzing": "Анализ",
    "Completed": "Завершено",
    "Created": "Создано",
    "Modified": "Изменено",
    "Deleted": "Удалено",
    "Canceled": "Отменено",
    "Failed": "Ошибка",
    "Error": "Ошибка",
    "Warning": "Предупреждение",
    "Needs attention": "Требует внимания",
    "Pending": "Ожидание",
    "Ready": "Готово",
    "Blocked": "Заблокировано",
    "Blocked by organization policy": "Заблокировано политикой организации",
    "Background Task Output": "Результат фоновой задачи",
    "Checkpoint": "Контрольная точка",
    "Step": "Шаг",
    "Artifact": "Артефакт",
    "Artifacts": "Артефакты",
    "View Diff": "Показать изменения",
    "View Stacked Diff": "Показать изменения списком",
    "View Split Diff": "Показать изменения рядом",
    "Commit": "Коммит",
    "Changes": "Изменения",
    "No changes": "Нет изменений",
    "Tokens": "Токены",
    "Usage": "Использование",
    "Account": "Аккаунт",
    "Sign out": "Выйти",
    "Sign in with Google": "Войти через Google",
    "Profile": "Профиль",
    "Help": "Помощь",
    "Documentation": "Документация",
    "Provide feedback": "Оставить отзыв",
    "About": "О приложении",
    "Privacy": "Конфиденциальность",
    "Notifications": "Уведомления",
    "No results": "Ничего не найдено",
    "No results found": "Ничего не найдено",
    "No conversations yet": "Диалогов пока нет",
    "Previous match (Shift+Enter)": "Предыдущее совпадение (Shift+Enter)",
    "Next match (Enter)": "Следующее совпадение (Enter)",
    "Choose a model": "Выберите модель",
    "Choose a folder": "Выберите папку",
    "What can I help you with?": "Чем я могу помочь?",
    "Ask anything": "Спросите что-нибудь",
    "Ask anything, @ to mention": "Спросите что-нибудь; @ — упомянуть",
    "Ask anything, @ to mention, / for actions": "Спросите что-нибудь; @ — упомянуть, / — действия",
    "Type a message...": "Введите сообщение…",
    "Describe what you want to build": "Опишите, что вы хотите создать",
    "Drag and drop files here": "Перетащите файлы сюда",
    "File system provider not available": "Поставщик файловой системы недоступен",
    "Network error": "Ошибка сети",
    "Something went wrong": "Что-то пошло не так",
    "An error occurred": "Произошла ошибка",
    "Try again later": "Повторите попытку позже",
    "Select File": "Выберите файл",
    "Antigravity failed to start": "Не удалось запустить Antigravity",
    "Retrying...": "Повторная попытка…",
    "Restarting Antigravity": "Перезапуск Antigravity",
    "Last Error:": "Последняя ошибка:",
    "Copy Logs": "Копировать журнал",
    "Save Logs": "Сохранить журнал",
    "Share logs": "Поделиться журналом",
    "Logs copied to clipboard": "Журнал скопирован в буфер обмена",
    "Could not write logs to Downloads": "Не удалось сохранить журнал в папку «Загрузки»",
    "Not now": "Не сейчас",
    "Learn more": "Подробнее",

    "Group By": "Группировать по",
    "Sort Conversations": "Сортировка диалогов",
    "Last Updated": "По дате обновления",
    "Last Prompt": "По последнему запросу",
    "Alphabetical (A-Z)": "По алфавиту (А–Я)",
    "Date Added": "По дате добавления",
    "Pinned Chats Only": "Только закреплённые диалоги",
    "Workspace + Worktree": "Рабочее пространство + рабочее дерево",
    "Project + Worktree": "Проект + рабочее дерево",
    "Subtitles": "Подзаголовки",
    "Worktree": "Рабочее дерево",
    "No Subtitle": "Без подзаголовка",
    "Only Unread": "Только непрочитанные",
    "Display Options": "Параметры отображения",
    "State": "Состояние",
    "Quick Start": "Быстрый старт",
    "Leaving Soon": "Скоро недоступна",
    "Notice": "Примечание",
    "View Usage": "Посмотреть использование",

    "App": "Приложение",
    "Application": "Приложение",
    "Shortcuts": "Сочетания клавиш",
    "Provide Feedback": "Отправить отзыв",
    "Configure agent execution, queued message delivery, and permissions.": "Настройте выполнение задач агентом, очередь сообщений и разрешения.",
    "Queued Messages": "Отложенные сообщения",
    "Configure when follow-up messages are sent.": "Выберите, когда отправлять последующие сообщения.",
    "Queue": "В очередь",
    "Send Immediately": "Отправлять сразу",
    "Keyboard shortcuts": "Сочетания клавиш",
    "Agent Settings": "Настройки агента",
    "Security Preset": "Профиль безопасности",
    "Controls the actions the agent can take.": "Определяет действия, доступные агенту.",
    "Learn more about": "Подробнее о",
    "Custom": "Пользовательский",
    "Outside of folders file access policy": "Доступ к файлам вне рабочих папок",
    "Configures how the agent tries to access files outside of its working folders.": "Определяет, как агент получает доступ к файлам вне рабочих папок.",
    "Always Ask": "Всегда спрашивать",
    "Terminal Command Auto Execution": "Автовыполнение команд терминала",
    "Controls whether terminal commands require your approval before running.": "Определяет, нужно ли подтверждать команды терминала перед запуском.",
    "Proceed In Sandbox": "Выполнять в песочнице",
    "Proceed in Sandbox": "Выполнять в песочнице",
    "Enable Sandbox Mode (Preview)": "Включить песочницу (предпросмотр)",
    "Restricts agent tools to a secure, isolated local sandbox.": "Ограничивает инструменты агента защищённой изолированной песочницей.",
    "Tool Permissions": "Разрешения инструментов",
    "Modify permissions for file, terminal, and MCP tools.": "Настройте разрешения для файлов, терминала и инструментов MCP.",
    "Agent Behavior": "Поведение агента",
    "Artifact Review Policy": "Проверка артефактов",
    "Whether the agent asks you to review its documents.": "Определяет, будет ли агент просить проверить созданные документы.",
    "Network Permissions": "Сетевые разрешения",
    "Network Access Rules": "Правила доступа к сети",
    "Configure allowed and denied URLs for reading.": "Настройте разрешённые и запрещённые URL для чтения.",
    "Terminal & Tooling Permissions": "Разрешения терминала и инструментов",
    "Commands Outside Sandbox": "Команды вне песочницы",
    "Configure allowed commands outside the sandbox.": "Настройте команды, разрешённые вне песочницы.",
    "Configure the browser subagent. It requires Google Chrome to be installed. The browser subagent can be invoked by typing /browser in the conversation input box.": "Настройте браузерного субагента. Для его работы требуется Google Chrome. Чтобы вызвать его, введите /browser в поле сообщения.",
    "Configure the browser subagent. It requires": "Настройте браузерного субагента. Для его работы требуется",
    "to be installed. The browser subagent can be invoked by typing /browser in the conversation input box.": "Чтобы вызвать браузерного субагента, введите /browser в поле сообщения.",
    "to be installed.": "должен быть установлен.",
    "The browser subagent can be invoked by typing /browser in the conversation input box.": "Чтобы вызвать браузерного субагента, введите /browser в поле сообщения.",
    "Browser Javascript Execution Policy": "Политика выполнения JavaScript в браузере",
    "Browser JavaScript Execution Policy": "Политика выполнения JavaScript в браузере",
    "Controls whether the agent can run custom JavaScript to automate complex browser actions.": "Определяет, может ли агент запускать JavaScript для автоматизации сложных действий в браузере.",
    "Request Review": "Запрашивать подтверждение",
    "Browser Actuation Rules": "Правила управления браузером",
    "Configure allowed and denied URLs for browser actuation.": "Настройте разрешённые и запрещённые URL для управления браузером.",
    "Full machine": "Полный доступ",
    "Full Machine": "Полный доступ",
    "Turbo mode": "Турборежим",
    "Turbo Mode": "Турборежим",
    "Require Review": "Требовать подтверждение",
    "Always Proceed": "Всегда выполнять",
    "Disabled": "Отключено",
    "Block all browser JavaScript execution.": "Запретить выполнение JavaScript в браузере.",
    "Prompt for approval before running browser scripts.": "Запрашивать подтверждение перед запуском браузерных сценариев.",
    "Allow full browser script execution without prompting.": "Разрешить выполнение браузерных сценариев без подтверждения.",
    "Allow List Terminal Commands": "Разрешённые команды терминала",
    "The agent auto-executes commands matched by an allow list entry.": "Агент автоматически выполняет команды, соответствующие списку разрешений.",
    "Deny List Terminal Commands": "Запрещённые команды терминала",
    "The agent asks for permission before executing commands matched by a deny list entry.": "Агент запрашивает разрешение перед выполнением команд из списка запретов.",
    "Agent Auto-Fix Lints": "Автоисправление ошибок линтера",
    "Give the agent awareness of lint errors created by its edits so it can fix them without explicit prompting.": "Сообщать агенту об ошибках линтера после его изменений, чтобы он мог исправлять их автоматически.",
    "Interrupt the agent and send immediately.": "Прервать работу агента и отправить сразу.",
    "Queue until after the current turn.": "Поставить в очередь до завершения текущего ответа.",
    "Confirm Window Reload": "Подтверждать перезагрузку окна",
    "Toggle if a confirmation is shown when using the \"Reload Window\" button.": "Показывать подтверждение при нажатии кнопки «Перезагрузить окно».",
    "Enable Demo Mode (Beta)": "Включить демонстрационный режим (бета)",
    "Explain and Fix in Current Conversation": "Объяснять и исправлять в текущем диалоге",
    "Continue \"Explain and Fix\" actions in the current conversation instead of starting a new one.": "Продолжать действия «Объяснить и исправить» в текущем диалоге, не создавая новый.",
    "Strict Mode": "Строгий режим",
    "Agent Non-Workspace File Access": "Доступ агента к файлам вне рабочего пространства",
    "Command Setup Script": "Сценарий подготовки команд",
    "A shell setup script run before every command the agent executes.": "Сценарий оболочки, запускаемый перед каждой командой агента.",
    "Enable Terminal Sandbox": "Включить песочницу терминала",
    "Run terminal commands with sandbox restrictions.": "Выполнять команды терминала с ограничениями песочницы.",
    "Sandbox Allow Network": "Разрешить сеть в песочнице",
    "Allow sandboxed commands to make network requests.": "Разрешить командам в песочнице выполнять сетевые запросы.",
    "Enable Shell Integration": "Включить интеграцию с оболочкой",
    "Use the IDE's shell integration to detect and report terminal command execution. When disabled, the agent uses its own shell. Restart the application for this to take effect.": "Использовать интеграцию IDE с оболочкой для отслеживания команд. Если параметр отключён, агент использует собственную оболочку. Для применения перезапустите приложение.",
    "The agent never asks for confirmation before executing terminal commands (except those in the Deny list). This provides the agent with the maximum ability to operate over long periods without intervention, but also has the highest risk of the agent executing an unsafe terminal command.": "Агент выполняет команды терминала без подтверждения, кроме команд из списка запретов. Это даёт максимальную автономность, но повышает риск выполнения небезопасной команды.",
    "The agent always asks for confirmation before executing terminal commands (except those in the Allow list).": "Агент всегда запрашивает подтверждение команд терминала, кроме команд из списка разрешений.",
    "Terminal command automatically proceeds if the command runs inside the sandbox. Otherwise, it requests review.": "Команда выполняется автоматически внутри песочницы; в остальных случаях требуется подтверждение.",
    "Agent Host Address": "Адрес узла агента",
    "Review Policy": "Политика проверки",
    "Specifies the agent's behavior when asking for review on artifacts, which are documents it creates to enable a richer conversation experience.": "Определяет, когда агент запрашивает проверку создаваемых им документов и артефактов.",
    "Agent never asks for review. This maximizes the autonomy of the Agent, but also has the highest risk of the Agent operating over unsafe or injected Artifact content.": "Агент никогда не запрашивает проверку. Это повышает автономность, но увеличивает риск работы с небезопасным содержимым артефактов.",
    "Agent always asks for review.": "Агент всегда запрашивает проверку.",
    "Enable Sounds for Agent": "Включить звуки агента",
    "Play a sound when the agent finishes generating a response.": "Воспроизводить звук после завершения ответа агента.",
    "Enable Notifications for Agent": "Включить уведомления агента",
    "Show browser notifications when your action is needed or execution finishes.": "Показывать уведомления, когда требуется ваше действие или выполнение завершено.",
    "Auto-Expand Changes Overview": "Автоматически раскрывать обзор изменений",
    "Automatically expand the Changes Overview toolbar when the agent finishes generating a response.": "Автоматически раскрывать панель обзора изменений после завершения ответа агента.",
    "Conversation History": "История диалогов",
    "Let the agent access past conversations to inform its responses.": "Разрешить агенту использовать предыдущие диалоги при подготовке ответов.",
    "Knowledge": "База знаний",
    "Let the agent access its knowledge base to inform its responses and automatically generate knowledge items in the background. Turning this off prevents the agent from accessing existing knowledge items, but doesn't delete them.": "Разрешить агенту использовать базу знаний и создавать новые записи в фоне. Отключение запретит доступ, но не удалит существующие записи.",
    "Auto-Open Edited Files": "Автоматически открывать изменённые файлы",
    "Open files in the background if the agent creates or edits them": "Открывать в фоне файлы, созданные или изменённые агентом",
    "Open Agent on Reload": "Открывать агента после перезагрузки",
    "Open the agent panel on window reload": "Открывать панель агента после перезагрузки окна",
    "Enable Browser Tools": "Включить инструменты браузера",
    "Chrome Binary Path": "Путь к исполняемому файлу Chrome",
    "Browser User Profile Path": "Путь к профилю браузера",
    "Browser CDP Port": "Порт CDP браузера",
    "Port number for Chrome DevTools Protocol remote debugging. Leave empty for default (9222).": "Порт удалённой отладки Chrome DevTools Protocol. Оставьте пустым, чтобы использовать порт 9222.",
    "Show Selection Actions": "Показывать действия с выделением",
    "Show \"Edit\" and \"Chat\" buttons when selecting text in the editor.": "Показывать кнопки «Изменить» и «Чат» при выделении текста в редакторе.",

    "File Permissions": "Разрешения для файлов",
    "File Reads": "Чтение файлов",
    "Allow/deny agent read access to specific files or directories.": "Разрешите или запретите агенту чтение отдельных файлов и каталогов.",
    "File Writes": "Запись файлов",
    "Allow/deny agent write access to specific files or directories.": "Разрешите или запретите агенту запись в отдельные файлы и каталоги.",
    "Terminal Commands": "Команды терминала",
    "Allow/deny specific terminal commands.": "Разрешите или запретите отдельные команды терминала.",
    "MCP Tools": "Инструменты MCP",
    "External tools the agent can call via Model Context Protocol.": "Внешние инструменты, которые агент может вызывать через Model Context Protocol.",
    "Read URLs": "Чтение URL",
    "Allow/deny agent read access to specific URLs or domains.": "Разрешите или запретите агенту чтение отдельных URL и доменов.",
    "File Access Rules": "Правила доступа к файлам",
    "Configure allowed and denied paths for file reads and writes.": "Настройте разрешённые и запрещённые пути для чтения и записи файлов.",
    "Configure allowed terminal commands.": "Настройте разрешённые команды терминала.",
    "Allow/deny agent command execution outside the sandbox.": "Разрешите или запретите агенту выполнять команды вне песочницы.",
    "Browser Actuation Permissions": "Разрешения на управление браузером",
    "Execute URLs": "Управление URL",
    "Allow/deny agent browser actuation access to specific URLs.": "Разрешите или запретите агенту управлять браузером на отдельных URL.",
    "Permission Settings": "Настройки разрешений",
    "Configure global allowed and denied resource permissions.": "Настройте глобальные разрешения и запреты для ресурсов.",
    "Permission Preset": "Профиль разрешений",
    "Local Permissions": "Локальные разрешения",
    "Inherit General": "Наследовать общие настройки",
    "Inherits your General settings when working in this project.": "Использовать в этом проекте общие настройки.",
    "Manually customize individual settings.": "Настроить отдельные параметры вручную.",
    "Full access": "Полный доступ",
    "Agents have full access to your machine and external resources.": "Агенты получают полный доступ к устройству и внешним ресурсам.",
    "Sandboxed": "В песочнице",
    "Agents run in a secure sandbox that restricts access to external resources outside of your trusted folders.": "Агенты работают в защищённой песочнице с ограниченным доступом к ресурсам вне доверенных папок.",
    "Strict": "Строгий",
    "Terminal commands always require review and the agent cannot access files outside of its given workspaces.": "Команды терминала всегда требуют подтверждения, а агент не может обращаться к файлам вне назначенных рабочих пространств.",
    "Advanced File Access": "Расширенный доступ к файлам",
    "Read Files": "Чтение файлов",
    "Paths the agent can read.": "Пути, доступные агенту для чтения.",
    "Write Files": "Запись файлов",
    "Paths the agent can modify.": "Пути, которые агент может изменять.",
    "Advanced Command Access": "Расширенный доступ к командам",
    "Advanced Web Access": "Расширенный сетевой доступ",
    "URLs the agent can read or open in the browser.": "URL, которые агент может читать или открывать в браузере.",
    "URLs the agent can actuate on using the browser.": "URL, которыми агент может управлять через браузер.",
    "The browser subagent has been disabled by your administrator. Contact your administrator to enable browser use.": "Браузерный субагент отключён администратором. Обратитесь к администратору, чтобы включить его.",

    "Manage Antigravity App app settings.": "Управление настройками приложения Antigravity.",
    "Prevent Sleep": "Запретить спящий режим",
    "Prevent the computer from sleeping while the app is running.": "Не переводить устройство в спящий режим, пока приложение работает.",
    "Keep In Menu Bar": "Оставлять в строке меню",
    "Keep the app accessible from the menu bar and running in the background when all windows are closed.": "Оставлять приложение доступным из строки меню и работающим в фоне после закрытия всех окон.",
    "Notification Settings": "Настройки уведомлений",
    "To modify notification settings, open your operating system's system preferences.": "Чтобы изменить уведомления, откройте системные настройки операционной системы.",
    "Open System Preferences": "Открыть системные настройки",
    "Advanced Settings": "Расширенные настройки",
    "Remote Control": "Удалённое управление",
    "Enable Remote Control": "Включить удалённое управление",
    "Work with local agents from another device.": "Работайте с локальными агентами с другого устройства.",
    "Manage your conversations from the companion website.": "Управляйте диалогами через веб-интерфейс на другом устройстве.",
    "These settings can only be changed on the computer running the app, not from a remote session.": "Эти параметры можно изменить только на устройстве, где запущено приложение.",
    "Device Name": "Название устройства",
    "Enter device name...": "Введите название устройства…",
    "A label for this computer when you connect from another device. Changing it reconnects.": "Название этого устройства при удалённом подключении. После изменения соединение будет установлено заново.",
    "Scan the code to open this device in Remote Control, or": "Отсканируйте код для удалённого подключения или",
    "copy link": "скопируйте ссылку",
    "Show Remote Control QR code": "Показать QR-код удалённого подключения",
    "Open in Remote Control": "Открыть удалённое управление",
    "Continue your work from another device with Remote Control. Scan the QR code or open the link below.": "Продолжите работу с другого устройства: отсканируйте QR-код или откройте ссылку ниже.",
    "Automatic Check for Updates": "Автоматически проверять обновления",
    "Automatically prompt you to restart the app when a new update is available. When disabled, you can check for updates manually from the app menu.": "Предлагать перезапуск приложения при появлении обновления. Если параметр отключён, обновления можно проверять вручную через меню приложения.",

    "Configure the agent's visual theme and display preferences.": "Настройте тему и параметры отображения агента.",
    "Chat Settings": "Настройки чата",
    "Verbose Agent Chat": "Подробный чат с агентом",
    "Display and preserve intermediate thinking steps.": "Показывать и сохранять промежуточные этапы рассуждения.",
    "Conversation Width": "Ширина диалога",
    "Configure the maximum width of the conversation panel.": "Настройте максимальную ширину панели диалога.",
    "Narrow": "Узкая",
    "Wide": "Широкая",
    "Use desktop viewport and user agent for the workspace": "Использовать для рабочего пространства размер окна и User-Agent настольного компьютера",
    "Light Theme": "Светлая тема",
    "Dark Theme": "Тёмная тема",
    "Preset": "Предустановка",
    "Default Light": "Светлая по умолчанию",
    "Default Dark": "Тёмная по умолчанию",
    "Background": "Фон",
    "Foreground": "Основной цвет",
    "Accent": "Акцентный цвет",
    "Reset to preset": "Сбросить до предустановки",
    "Inherit Editor": "Как в редакторе",

    "Models & Usage": "Модели и использование",
    "Manage your model quota and credits.": "Управляйте квотой моделей и AI-кредитами.",
    "Your Plan:": "Ваш тариф:",
    "Upgrade": "Улучшить тариф",
    "You can upgrade to a Google AI Ultra plan to receive higher rate limits.": "Можно перейти на тариф Google AI Ultra, чтобы увеличить лимиты.",
    "Model Credits": "AI-кредиты",
    "Enable AI Credit Overages": "Использовать дополнительные AI-кредиты",
    "When toggled on, Antigravity App will use your AI credits to fulfill model requests once you're out of model quota. Antigravity App will always use your model quota first before using AI credits.": "Когда параметр включён, Antigravity использует AI-кредиты после исчерпания квоты моделей. Сначала всегда расходуется квота моделей.",
    "Model Quota": "Квота моделей",
    "No quota information available.": "Информация о квоте недоступна.",
    "Refresh quota and credits data": "Обновить сведения о квоте и кредитах",
    "Available AI Credits:": "Доступные AI-кредиты:",
    "See Activity": "Посмотреть активность",
    "Get More AI Credits": "Получить больше AI-кредитов",
    "For Antigravity Business consumption options, see": "Варианты использования для Antigravity Business:",
    "Manage your notification preferences.": "Управляйте настройками уведомлений.",
    "This account is ineligible for higher rate limits through a Google AI plan at this time.": "Сейчас для этого аккаунта недоступно увеличение лимитов через тариф Google AI.",
    "Gemini Models": "Модели Gemini",
    "Claude and GPT models": "Модели Claude и GPT",
    "Weekly Limit Remaining": "Остаток недельного лимита",
    "Daily Limit Remaining": "Остаток дневного лимита",
    "Monthly Limit Remaining": "Остаток месячного лимита",
    "Limit Remaining": "Остаток лимита",
    "Five Hour Limit Remaining": "Остаток пятичасового лимита",
    "5-Hour Limit Remaining": "Остаток пятичасового лимита",

    "Welcome to": "Добро пожаловать в",
    "Antigravity App": "Antigravity",
    "Sign in": "Войти",
    "Continue with Google": "Продолжить с Google",
    "Use business account": "Использовать рабочий аккаунт",
    "Sign in with business account": "Войти с рабочим аккаунтом",
    "Use Google Cloud project instead": "Использовать проект Google Cloud",
    "Having trouble? Let us know": "Возникли проблемы? Сообщите нам",
    "Awaiting Authentication...": "Ожидание авторизации…",
    "Success, Continuing...": "Успешно. Продолжаем…",

    "Changes to third-party model access": "Изменения доступа к сторонним моделям",
    "Opus 5.5 and Sonnet 5.5 are available on paid Pro and Ultra plans.": "Opus 5.5 и Sonnet 5.5 доступны на платных тарифах Pro и Ultra.",
    "Third-party model access will no longer be available on your current plan starting on November 2, 2026.": "Со 2 ноября 2026 года сторонние модели станут недоступны на вашем текущем тарифе.",
    "Dismiss": "Закрыть",

    "Account": "Аккаунт",
    "Manage your plan, credentials, and general preferences.": "Управляйте тарифом, учётными данными и общими настройками.",
    "Enable Telemetry": "Отправлять данные об использовании",
    "When toggled on, Antigravity App collects usage data to help Google enhance performance and features.": "Когда настройка включена, Antigravity отправляет Google данные об использовании для улучшения производительности и функций.",
    "Marketing Emails": "Маркетинговые письма",
    "Receive product updates, tips, and promotions from Google Antigravity App via email.": "Получать по электронной почте новости продукта, советы и предложения Antigravity.",
    "Your Plan:": "Ваш тариф:",
    "Upgrade": "Улучшить тариф",
    "Manage": "Управлять",
    "Email": "Электронная почта",
    "Sign Out": "Выйти",
    "Signing Out...": "Выход…",
    "Not Signed In": "Вход не выполнен",
    "By using this app, you agree to its": "Используя приложение, вы принимаете",
    "Terms of Service": "Условия использования",
    "Accept": "Принять",
    "Reject": "Отклонить",
    "Approve?": "Подтвердить?",
    "Always Proceed": "Не спрашивать",
    "Always Ask": "Всегда спрашивать",
    "Agent never asks for review. This maximizes the autonomy of the Agent, but also has the highest risk of the Agent operating over unsafe or injected Artifact content.": "Агент не запрашивает подтверждение. Это даёт ему больше самостоятельности, но повышает риск работы с небезопасным содержимым.",
    "Agent always asks for review.": "Агент всегда запрашивает подтверждение.",

    "Configure default behaviors, skills, and MCP servers.": "Настройте поведение по умолчанию, навыки и серверы MCP.",
    "Token Usage": "Использование токенов",
    "The breakdown below shows token usage from customizations like skills, rules, and MCP. If the budget is exceeded, large customizations will be truncated automatically.": "Ниже показано использование токенов настройками: навыками, правилами и MCP. При превышении лимита большие настройки будут автоматически сокращены.",
    "Customization token budget exceeded. Large customizations will be truncated.": "Лимит токенов настроек превышен. Большие настройки будут сокращены.",
    "There are no customizations enabled.": "Нет включённых пользовательских настроек.",
    "Loading token usage...": "Загрузка данных об использовании токенов…",
    "No token data available.": "Данные об использовании токенов отсутствуют.",
    "Installed MCP Servers": "Установленные серверы MCP",
    "Add MCP": "Добавить MCP",
    "Add MCP Server": "Добавить сервер MCP",
    "Add MCP Servers": "Добавить серверы MCP",
    "Search MCP servers by name": "Поиск серверов MCP по названию",
    "Clear search": "Очистить поиск",
    "MCP Install Error:": "Ошибка установки MCP:",
    "Loading MCP servers...": "Загрузка серверов MCP…",
    "Search for MCP servers to add to your configuration": "Найдите серверы MCP для добавления в конфигурацию",
    "Installing": "Установка…",
    "by Google": "от Google",
    "No MCP servers installed": "Серверы MCP не установлены",
    "Use Add MCP to browse the store.": "Нажмите «Добавить MCP», чтобы открыть каталог.",
    "Build With Google Plugins": "Плагины Build with Google",
    "Browse and enable plugins from the Build With Google catalog.": "Просматривайте и включайте плагины из каталога Build with Google.",
    "Customize": "Настроить",
    "Plugins are packaged collections of skills and MCPs to help the Agent": "Плагины — это наборы навыков и MCP, которые помогают агенту",
    "Plugins are packaged collections of skills and MCPs to help the Agent in": "Плагины — это наборы навыков и MCP, которые помогают агенту",
    "work with Google developer products. You can always change your choices in Settings.": "работать с продуктами Google для разработчиков. Выбор всегда можно изменить в настройках.",
    "Loading plugins...": "Загрузка плагинов…",
    "Loading available plugins...": "Загрузка доступных плагинов…",
    "Loading installed plugins...": "Загрузка установленных плагинов…",
    "Loading plugin...": "Загрузка плагина…",
    "Search plugins...": "Поиск плагинов…",
    "Refreshing...": "Обновление…",
    "No plugins available.": "Доступных плагинов нет.",
    "Plugin Operation Error:": "Ошибка операции с плагином:",
    "Downloading...": "Скачивание…",
    "Deleting...": "Удаление…",
    "No Plugins Available": "Доступных плагинов нет",
    "No plugins available in the marketplace.": "В каталоге нет доступных плагинов.",
    "No plugins match your search.": "По вашему запросу плагины не найдены.",
    "No installed plugins match your search.": "Среди установленных плагинов ничего не найдено.",
    "Failed to load plugins. Please try again.": "Не удалось загрузить плагины. Повторите попытку.",
    "Failed to install plugin. Please try again.": "Не удалось установить плагин. Повторите попытку.",
    "Failed to delete plugin. Please try again.": "Не удалось удалить плагин. Повторите попытку.",
    "Failed to toggle plugin. Please try again.": "Не удалось изменить состояние плагина. Повторите попытку.",
    "There are currently no Build with": "Плагины Build with",
    "plugins available.": "сейчас недоступны.",
    "Core tools and knowledge required to develop for Android": "Основные инструменты и знания для разработки под Android.",
    "Keep your coding agent up to date with the latest web best practices.": "Актуальные рекомендации и лучшие практики современной веб-разработки.",
    "Using the Antigravity Python SDK to build AI agents": "Создание AI-агентов с помощью Python SDK для Antigravity.",
    "Curated collection of agent skills for science.": "Подборка навыков агента для научных задач.",
    "Prototype, build & run modern apps users love with Firebase's backend, AI, and operational tools.": "Проектирование, создание и запуск современных приложений с серверными сервисами, AI и инструментами Firebase.",
    "Reliable automation, in-depth debugging, and performance analysis in Chrome using Chrome DevTools.": "Надёжная автоматизация, глубокая отладка и анализ производительности в Chrome с помощью Chrome DevTools.",
    "Skills providing tailored instructions for happy path Dart and Flutter development.": "Навыки с пошаговыми рекомендациями для разработки на Dart и Flutter.",
    "Build and prototype location-aware applications with Google Maps Platform.": "Создание и прототипирование геозависимых приложений с Google Maps Platform.",
    "Specialized suite of skills for data engineers and database practitioners.": "Специализированный набор навыков для инженеров данных и специалистов по базам данных.",
    "Build applications with the Gemini Interactions API and Live API.": "Создание приложений с Gemini Interactions API и Live API.",
    "Search and retrieve official documentation across Google Cloud, Gemini, Android, and other Google developer products.": "Поиск официальной документации по Google Cloud, Gemini, Android и другим продуктам Google для разработчиков.",
    "Global": "Глобальный",
    "Comprehensive guide and reference for the Antigravity Customization System. Use to explain how customizations work, their loading priority, discovery mechanisms, and to guide the creation of skills, rules, plugins, hooks, and MCP servers.": "Полное руководство и справочник по системе настроек Antigravity: принципам работы, приоритету загрузки, обнаружению и созданию навыков, правил, плагинов, хуков и серверов MCP.",
    "Provides a comprehensive guide, quick reference, and sitemap for Google Antigravity (AGY), including the Antigravity CLI (agy), Antigravity 2.0, Antigravity IDE, Python SDK, slash commands, keybindings, and customizations (skills, rules, MCP, sidecars). Activate this skill when the user asks questions about how to use, configure, or customize Antigravity, AGY, the agy CLI, the Antigravity IDE, or Antigravity 2.0.": "Подробное руководство, краткий справочник и карта Google Antigravity (AGY), включая CLI agy, Antigravity 2.0, IDE, Python SDK, команды, сочетания клавиш и настройки. Используется для вопросов о работе и настройке Antigravity.",
    "Interactive guide to design and create a scheduled background automation. Use this skill when the user wants to create an automated or recurring scheduled task (e.g. \"summarize my emails every morning\", \"every Monday send me a to-do list\"). Also triggered by the /automation slash command.": "Интерактивное руководство по созданию фоновых автоматизаций по расписанию. Используется для автоматических и повторяющихся задач, а также вызывается командой /automation.",
    "How to render rich interactive HTML widgets inline in the chat or as standalone artifacts. Use this skill when you want to show the user diagrams, data visualizations, interactive controls, educational walkthroughs, or any rich visual content beyond plain text and markdown.": "Создание интерактивных HTML-виджетов в чате или отдельных артефактов: диаграмм, визуализаций данных, элементов управления, обучающих материалов и другого содержимого сложнее обычного текста и Markdown.",
    "Automatically migrate legacy workflows to modern skills across global and workspace configurations. Scans for existing workflows, creates target SKILL.md files, and safely archives old workflow files.": "Автоматически переносит устаревшие рабочие процессы в современные навыки для глобальных настроек и рабочих пространств: находит процессы, создаёт файлы SKILL.md и безопасно архивирует исходные файлы.",
    "Guidelines for interacting with GitHub and request permissions from the user when commands fail due to restrictions in the agent environment.": "Правила работы с GitHub и запроса разрешений у пользователя, когда команды не выполняются из-за ограничений среды агента.",
    "How to manage and create plugins — namespaced bundles of skills, agents, rules, MCP servers and hooks that install, enable and disable as a single unit.": "Создание и управление плагинами — наборами навыков, агентов, правил, серверов MCP и хуков, которые устанавливаются, включаются и отключаются как единое целое.",
    "Build, package, run, and debug UI extensions for Antigravity: interactive web panels that render in the side pane, served by a Node.js sidecar using the built-in Sidecar SDK.": "Создание, упаковка, запуск и отладка расширений интерфейса Antigravity: интерактивных веб-панелей в боковой области, обслуживаемых процессом Node.js через встроенный Sidecar SDK.",
    "Discover UI plugin panels relevant to the current task and surface a one-click pill in chat to open (toggle) them in the side pane. Use when a running UI plugin's panel would help with what the user is doing, or right after the user enables a new UI plugin pane and a shortcut to open it is handy.": "Находит панели UI-плагинов, подходящие для текущей задачи, и добавляет в чат кнопку для их открытия в боковой области. Используется, когда панель плагина может помочь в работе.",

    "Browser Settings": "Настройки браузера",
    "Browser settings have moved": "Настройки браузера перенесены",
    "Browser settings have moved to the Browser section of General settings.": "Настройки браузера перенесены в раздел «Браузер» общих настроек.",
    "Go to General settings": "Перейти к общим настройкам",

    "Keyboard shortcuts for quick navigation and control.": "Сочетания клавиш для быстрой навигации и управления.",
    "Open Conversation Picker": "Открыть выбор диалога",
    "Open File Search": "Открыть поиск файлов",
    "Focus Input": "Перейти к полю ввода",
    "Navigation": "Навигация",
    "File Picker": "Выбор файла",
    "Select Previous Conversation": "Выбрать предыдущий диалог",
    "Select Next Conversation": "Выбрать следующий диалог",
    "Previous Pane Tab": "Предыдущая вкладка панели",
    "Next Pane Tab": "Следующая вкладка панели",
    "Toggle Model Selector": "Открыть или закрыть выбор модели",
    "Toggle Voice Recording": "Включить или выключить запись голоса",
    "Find in Pane": "Найти на панели",
    "Add to Chat/Quote": "Добавить в чат / цитировать",
    "Layout Controls": "Управление интерфейсом",
    "Toggle Terminal": "Показать или скрыть терминал",

    "Feedback Type": "Тип отзыва",
    "Bug Report": "Сообщение об ошибке",
    "Feature Request": "Предложение функции",
    "Auth and Billing": "Авторизация и оплата",
    "Remote Control Issue": "Проблема удалённого управления",
    "General Feedback": "Общий отзыв",
    "Please describe the issue in detail. The more actionable your feedback, the quicker our team can address your request. Some helpful information includes:": "Подробно опишите проблему. Чем конкретнее информация, тем быстрее команда сможет разобраться. Полезно указать:",
    "Steps to reproduce the issue": "Шаги для воспроизведения проблемы",
    "Expected behavior": "Ожидаемое поведение",
    "Actual behavior": "Фактическое поведение",
    "Any error messages": "Тексты ошибок",
    "Any relevant information": "Другую важную информацию",
    "Describe the bug you encountered...": "Опишите обнаруженную ошибку…",
    "Steps to Reproduce": "Шаги для воспроизведения",
    "Please list the steps to reproduce the issue": "Перечислите шаги для воспроизведения проблемы",
    "Attach a screenshot (optional)": "Прикрепить снимок экрана (необязательно)",
    "Attach Antigravity server logs": "Прикрепить журналы сервера Antigravity",
    "Submitting...": "Отправка…",
    "Screenshot must be under 10 MB": "Размер снимка экрана не должен превышать 10 МБ",
    "Attaching logs requires an email address": "Для прикрепления журналов требуется адрес электронной почты",
    "We recommend attaching logs. Attaching logs will help the Antigravity team act on and prioritize your feedback.": "Рекомендуем приложить журналы: они помогут команде Antigravity быстрее обработать ваш отзыв.",
    "Thank you! Your feedback has been submitted successfully.": "Спасибо! Ваш отзыв успешно отправлен.",
    "An error occurred while submitting your feedback. Please try again.": "При отправке отзыва произошла ошибка. Повторите попытку.",
    "Please describe the feature you'd like to see. The more detailed the requirements, the easier it will be for our team to incorporate your ideas. Some helpful information includes:": "Опишите желаемую функцию. Чем подробнее требования, тем проще команде реализовать идею. Полезно указать:",
    "What is missing in your workflow": "Чего не хватает в вашем рабочем процессе",
    "What you would like to see to address this gap in your workflow": "Какое решение помогло бы устранить этот пробел",
    "How this feature would help you and other users": "Как функция поможет вам и другим пользователям",
    "Describe the feature you would like to see...": "Опишите желаемую функцию…",
    "Please describe your auth or billing issue. More details will help our support team resolve your issue quicker. Some helpful information includes:": "Опишите проблему с авторизацией или оплатой. Подробности помогут службе поддержки быстрее её решить. Полезно указать:",
    "What quota or feature is being incorrectly limited": "Какая квота или функция ограничена неправильно",
    "What functionality you expect your account tier to have available that is missing": "Какая ожидаемая возможность вашего тарифа отсутствует",
    "Any error messages seen when trying to log in": "Ошибки, появляющиеся при входе",
    "Describe your auth or billing issue...": "Опишите проблему с авторизацией или оплатой…",
    "Use this form if you cannot connect to Remote Control. If your instance is already connected and you are experiencing issues in the browser, report directly from the Remote Control web page so that relevant logs are included. Some helpful information includes:": "Используйте эту форму, если не удаётся подключиться к удалённому управлению. Если подключение уже установлено, но проблема возникает в браузере, отправьте отчёт со страницы удалённого управления, чтобы приложить необходимые журналы. Полезно указать:",
    "Whether it never connects or is intermittent/flaky": "Подключение отсутствует постоянно или периодически пропадает",
    "Did restarting the desktop app help?": "Помог ли перезапуск настольного приложения?",
    "Describe your Remote Control issue...": "Опишите проблему с удалённым управлением…",
    "For any feedback that does not fit into the above categories.": "Для отзывов, не относящихся к перечисленным категориям.",
    "Enter your feedback here...": "Введите отзыв…",
    "Thought Process": "Ход рассуждения",
    "Thinking...": "Размышление…",
    "Waiting for user input": "Ожидание ответа пользователя",
    "Waiting for your input": "Ожидание вашего ответа",
    "The agent is waiting for your input.": "Агент ожидает вашего ответа.",
    "Allow Once": "Разрешить один раз",
    "Always Allow": "Всегда разрешать",
    "Approve this action": "Подтвердить действие",
    "Approve?": "Подтвердить?",
    "Run (unsandboxed)": "Запустить вне песочницы",
    "This command ran in the sandbox.": "Команда выполнена в песочнице.",
    "Allow checking zip file contents?": "Разрешить проверку содержимого ZIP-файла?",
    "Confirm the command is safe to run outside of the sandbox with full network and disk access.": "Подтвердите безопасность запуска команды вне песочницы с полным доступом к сети и хранилищу.",
    "Yes, allow this time": "Да, разрешить сейчас",
    "Yes, and always allow in this conversation": "Да, всегда разрешать в этом диалоге",
    "Yes, and always allow in this workspace": "Да, всегда разрешать в этом рабочем пространстве",
    "Yes, and always allow in this project": "Да, всегда разрешать в этом проекте",
    "Yes, and always allow": "Да, разрешать всегда",
    "Yes, save rule in this conversation": "Да, сохранить правило для этого диалога",
    "Yes, save rule in this workspace": "Да, сохранить правило для этого рабочего пространства",
    "Yes, save rule in this project": "Да, сохранить правило для этого проекта",
    "Yes, save rule globally": "Да, сохранить глобальное правило",
    "No": "Нет",
    "(tell the agent what to do instead)": "(укажите агенту, что сделать вместо этого)",
    "Edit permission target": "Изменить объект разрешения",
    "allow": "разрешить",
    "ask": "спрашивать",
    "deny": "запретить",
    "Ask": "Спрашивать",
    "e.g., /path/to/file": "например, /путь/к/файлу",
    "e.g., npm test": "например, npm test",
    "e.g., curl": "например, curl",
    "e.g., https://example.com": "например, https://example.com",
    "Failed to resolve permissions. Please try again.": "Не удалось определить разрешения. Повторите попытку.",
    "Failed to update permissions. Please try again.": "Не удалось обновить разрешения. Повторите попытку.",
    "Your quota for this model is running low.": "Квота для этой модели заканчивается.",
    "Model quota reached": "Квота модели исчерпана",
    "Loading models...": "Загрузка моделей…",
    "No Models Available": "Нет доступных моделей",
    "Workspace Settings": "Настройки рабочего пространства",
    "Configure workspace-specific permissions, resources, and customizations.": "Настройте разрешения, ресурсы и параметры этого рабочего пространства.",
    "Workspace File Access": "Доступ к файлам рабочего пространства",
    "Paths the agent can read inside this workspace.": "Пути внутри рабочего пространства, доступные агенту для чтения.",
    "Enter file or directory path...": "Введите путь к файлу или каталогу…",
    "Paths the agent can modify inside this workspace.": "Пути внутри рабочего пространства, которые агент может изменять.",
    "Workspace Command Access": "Доступ к командам рабочего пространства",
    "Terminal commands the agent can execute in this workspace.": "Команды терминала, которые агент может выполнять в этом рабочем пространстве.",
    "Enter command (e.g., git, blaze)...": "Введите команду, например git или blaze…",
    "Commands the agent can run outside the sandbox in this workspace.": "Команды, которые агент может выполнять вне песочницы в этом рабочем пространстве.",
    "Workspace Web Access": "Сетевой доступ рабочего пространства",
    "URLs the agent can read or open in this workspace.": "URL, которые агент может читать или открывать в этом рабочем пространстве.",
    "Enter URL pattern...": "Введите шаблон URL…",
    "URLs the agent can actuate on in this workspace.": "URL, которыми агент может управлять в этом рабочем пространстве."
  };

  const REVERSE = Object.fromEntries(Object.entries(RU).map(([en, ru]) => [ru, en]));
  let mode = readMode();
  let effective = resolveMode(mode);
  let observer = null;
  let queued = false;
  const originalText = new WeakMap();
  const originalAttributes = new WeakMap();
  const originalMcpDescriptions = new WeakMap();

  function readMode() {
    const saved = localStorage.getItem(STORAGE_MODE);
    return MODES.has(saved) ? saved : "system";
  }

  function resolveMode(value) {
    if (value === "ru" || value === "en") return value;
    const locale = (navigator.languages && navigator.languages[0]) || navigator.language || "en";
    return /^ru(?:-|$)/i.test(locale) ? "ru" : "en";
  }

  function translateExact(value) {
    if (!value) return value;
    const leading = value.match(/^\s*/)[0];
    const trailing = value.match(/\s*$/)[0];
    const core = value.slice(leading.length, value.length - trailing.length);
    if (!core) return value;
    const normalized = core.replace(/\s+/g, " ");
    const table = effective === "ru" ? RU : REVERSE;
    if (table[core]) return leading + table[core] + trailing;
    if (table[normalized]) return leading + table[normalized] + trailing;
    if (effective === "ru") {
      let match = normalized.match(/^Are you sure you want to delete (.+)\?$/);
      if (match) return leading + "Удалить «" + match[1] + "»?" + trailing;
      match = normalized.match(/^Canceled edit to (.+)$/);
      if (match) return leading + "Изменение файла " + match[1] + " отменено" + trailing;
      match = normalized.match(/^(\d+) results?$/);
      if (match) return leading + match[1] + " результатов" + trailing;
      match = normalized.match(/^Worked for (\d+)s$/);
      if (match) return leading + "Выполнено за " + match[1] + " с" + trailing;
      match = normalized.match(/^Worked for (\d+)m$/);
      if (match) return leading + "Выполнено за " + match[1] + " мин" + trailing;
      match = normalized.match(/^Worked for (\d+)h$/);
      if (match) return leading + "Выполнено за " + match[1] + " ч" + trailing;
      match = normalized.match(/^(\d+) files? changed$/);
      if (match) return leading + "Изменено файлов: " + match[1] + trailing;
      match = normalized.match(/^(\d+) tasks? running$/);
      if (match) return leading + "Выполняется задач: " + match[1] + trailing;
      match = normalized.match(/^Run (.+)$/);
      if (match) return leading + "Выполнить " + match[1] + trailing;
      match = normalized.match(/^(.+) finished$/);
      if (match) return leading + "Завершено: " + match[1] + trailing;
      match = normalized.match(/^Manage (.+) app settings\.$/);
      if (match) return leading + "Управление настройками приложения " + match[1] + "." + trailing;
      match = normalized.match(/^([\d.,]+)% of the customization budget is available\.$/);
      if (match) return leading + "Доступно " + match[1] + "% лимита токенов для настроек." + trailing;
      match = normalized.match(/^Send feedback as (.+)$/);
      if (match) return leading + "Отправить отзыв от имени " + match[1] + trailing;
      match = normalized.match(/^Your Plan: (.+)$/);
      if (match) return leading + "Ваш тариф: " + match[1] + trailing;
      match = normalized.match(/^When toggled on, (.+) collects usage data to help Google enhance performance and features\.$/);
      if (match) return leading + "Когда настройка включена, " + match[1] + " отправляет Google данные об использовании для улучшения производительности и функций." + trailing;
      match = normalized.match(/^Receive product updates, tips, and promotions from Google (.+) via email\.$/);
      if (match) return leading + "Получать по электронной почте новости, советы и предложения " + match[1] + "." + trailing;
      match = normalized.match(/^Sign in to use (.+)!$/);
      if (match) return leading + "Войдите, чтобы использовать " + match[1] + "." + trailing;
      match = normalized.match(/^Available AI Credits: (.+)$/);
      if (match) return leading + "Доступные AI-кредиты: " + match[1] + trailing;
      match = normalized.match(/^Show (\d+) breakdown$/);
      if (match) return leading + "Показать подробности (" + match[1] + ")" + trailing;
      match = normalized.match(/^No MCP servers found for "(.+)"$/);
      if (match) return leading + "Серверы MCP по запросу «" + match[1] + "» не найдены" + trailing;
      match = normalized.match(/^Build with (.+) Plugins$/);
      if (match) return leading + "Плагины для " + match[1] + trailing;
      match = normalized.match(/^Thought for (\d+)s$/);
      if (match) return leading + "Размышление — " + match[1] + " с" + trailing;
      const ruDuration = value => value
        .replace(/(\d+)\s+days?/gi, "$1 дн.")
        .replace(/(\d+)\s+hours?/gi, "$1 ч.")
        .replace(/(\d+)\s+minutes?/gi, "$1 мин.")
        .replace(/[.,]\s*$/, "")
        .replace(/\s+/g, " ")
        .trim();
      match = normalized.match(/^You have hit your weekly limit, it refreshes in (.+?)\. If on a supported paid plan, you can use AI credits in the interim or upgrade to a higher tier\.?$/i);
      if (match) return leading + "Недельный лимит исчерпан, он восстановится через " + ruDuration(match[1]) + ". На платном тарифе можно временно пользоваться AI-кредитами или перейти на тариф выше." + trailing;
      match = normalized.match(/^You have hit your weekly limit, the (?:5-hour|five-hour) limit does not currently apply\. Your weekly limit will fully refresh in (.+?)\.?$/i);
      if (match) return leading + "Недельный лимит исчерпан, пятичасовой лимит сейчас не действует. Недельный лимит полностью восстановится через " + ruDuration(match[1]) + "." + trailing;
      match = normalized.match(/^If on a supported paid plan, you can use AI credits in the interim or upgrade to a higher tier\.?$/i);
      if (match) return leading + "На платном тарифе можно временно пользоваться AI-кредитами или перейти на тариф выше." + trailing;
      match = normalized.match(/^You have hit your weekly limit, the (?:5-hour|five-hour) limit does not currently apply\.?$/i);
      if (match) return leading + "Недельный лимит исчерпан, пятичасовой лимит сейчас не действует." + trailing;
      match = normalized.match(/^You have hit your (weekly|5-hour|five-hour) limit, it refreshes in (.+?)\.?$/i);
      if (match) return leading + (match[1] === "weekly" ? "Недельный лимит исчерпан. Он восстановится через " : "Пятичасовой лимит исчерпан. Он восстановится через ") + ruDuration(match[2]) + "." + trailing;
      match = normalized.match(/^You have used some of your weekly limit, it will fully refresh in (.+)\.$/);
      if (match) {
        const duration = match[1].replace(/\bday(s)?\b/gi, "дн.").replace(/\bhour(s)?\b/gi, "ч.").replace(/\bminute(s)?\b/gi, "мин.").replace(/\.+$/, "");
        return leading + "Часть недельного лимита использована. Он полностью восстановится через " + duration + "." + trailing;
      }
      match = normalized.match(/^Your weekly limit will fully refresh in (.+)\.$/);
      if (match) {
        const duration = match[1].replace(/\bday(s)?\b/gi, "дн.").replace(/\bhour(s)?\b/gi, "ч.").replace(/\bminute(s)?\b/gi, "мин.").replace(/\.+$/, "");
        return leading + "Недельный лимит полностью восстановится через " + duration + "." + trailing;
      }
      match = normalized.match(/^You have used some of your (?:5-hour|five hour) limit, it will fully refresh in (.+)\.$/i);
      if (match) {
        const duration = match[1].replace(/\bday(s)?\b/gi, "дн.").replace(/\bhour(s)?\b/gi, "ч.").replace(/\bminute(s)?\b/gi, "мин.").replace(/\.+$/, "");
        return leading + "Часть пятичасового лимита использована. Он полностью восстановится через " + duration + "." + trailing;
      }
      if (normalized.includes("Opus 5.5 and Sonnet 5.5 are available on paid Pro and Ultra plans")) {
        return leading + "Opus 5.5 и Sonnet 5.5 доступны на платных тарифах Pro и Ultra. Со 2 ноября 2026 года доступ к сторонним моделям на вашем текущем тарифе будет прекращён." + trailing;
      }
      match = normalized.match(/^Third-party model access will no longer be available on your current plan starting on (.+)\.$/);
      if (match) return leading + "Сторонние модели станут недоступны на вашем текущем тарифе начиная с " + match[1] + "." + trailing;
      match = normalized.match(/^Yes, and always allow '(.+)' in this conversation$/);
      if (match) return leading + "Да, всегда разрешать «" + match[1] + "» в этом диалоге" + trailing;
      match = normalized.match(/^Yes, and always allow '(.+)' in this workspace$/);
      if (match) return leading + "Да, всегда разрешать «" + match[1] + "» в этом рабочем пространстве" + trailing;
      match = normalized.match(/^Yes, and always allow '(.+)' in this project$/);
      if (match) return leading + "Да, всегда разрешать «" + match[1] + "» в этом проекте" + trailing;
      match = normalized.match(/^Yes, and always allow '(.+)'$/);
      if (match) return leading + "Да, всегда разрешать «" + match[1] + "»" + trailing;
      match = normalized.match(/^Yes, save rule for '(.+)' in this conversation$/);
      if (match) return leading + "Да, сохранить правило для «" + match[1] + "» в этом диалоге" + trailing;
      match = normalized.match(/^Yes, save rule for '(.+)' in this workspace$/);
      if (match) return leading + "Да, сохранить правило для «" + match[1] + "» в этом рабочем пространстве" + trailing;
      match = normalized.match(/^Yes, save rule for '(.+)' globally$/);
      if (match) return leading + "Да, сохранить глобальное правило для «" + match[1] + "»" + trailing;
      if (normalized.startsWith("Run export PATH=")) {
        return leading + "Выполнить " + normalized.slice(4) + trailing;
      }
      if (normalized.startsWith("Prototype, build & run modern apps users love with Firebase")) {
        return leading + "Проектирование, создание и запуск современных приложений с серверными сервисами, AI и инструментами Firebase." + trailing;
      }
      if (normalized.startsWith("Reliable automation, in-depth debugging, and performance analysis in Chrome")) {
        return leading + "Надёжная автоматизация, глубокая отладка и анализ производительности в Chrome с помощью Chrome DevTools." + trailing;
      }
      if (normalized.startsWith("Skills providing tailored instructions for happy path Dart and Flutter development")) {
        return leading + "Навыки с пошаговыми рекомендациями для разработки на Dart и Flutter." + trailing;
      }
      if (normalized.startsWith("Build and prototype location-aware applications with Google Maps Platform")) {
        return leading + "Создание и прототипирование геозависимых приложений с Google Maps Platform." + trailing;
      }
      if (normalized.startsWith("Specialized suite of skills for data engineers and database practitioners")) {
        return leading + "Специализированный набор навыков для инженеров данных и специалистов по базам данных." + trailing;
      }
      if (normalized.startsWith("Build applications with the Gemini Interactions API and Live API")) {
        return leading + "Создание приложений с Gemini Interactions API и Live API." + trailing;
      }
      if (normalized.startsWith("Search and retrieve official documentation across Google Cloud, Gemini, Android")) {
        return leading + "Поиск официальной документации по Google Cloud, Gemini, Android и другим продуктам Google для разработчиков." + trailing;
      }
      if (normalized.startsWith("# Antigravity Android Agent Rules & Environment Guidelines")) {
        return leading + "# Правила агента Antigravity для Android и требования к среде ## 0. Язык пользователя (высший приоритет) — эта сборка Android…" + trailing;
      }
      if (normalized.startsWith("Reflect on recent successes or corrections to capture reusable skills")) {
        return leading + "Анализировать недавние успехи и исправления, чтобы сохранять переиспользуемые навыки и правила." + trailing;
      }
      if (normalized.startsWith("How to manage and create plugins")) {
        return leading + "Создание и управление плагинами — наборами навыков, агентов, правил, серверов MCP и хуков, которые устанавливаются, включаются и отключаются как единое целое." + trailing;
      }
    }
    return value;
  }

  function isProtectedText(node) {
    const parent = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    return !parent || !!parent.closest("pre, code, kbd, samp, textarea, [contenteditable='true'], [data-agy-no-translate]");
  }

  function translateTextNode(node) {
    if (!node || isProtectedText(node)) return;
    const current = node.nodeValue;
    let state = originalText.get(node);
    if (effective === "ru") {
      if (!state || state.translated === null || (current !== state.original && current !== state.translated)) {
        const original = state?.translated === null && current === state.original ? state.original : current;
        state = { original, translated: translateExact(original) };
        originalText.set(node, state);
      }
      if (node.nodeValue !== state.translated) node.nodeValue = state.translated;
      return;
    }
    if (!state) return;
    if (current !== state.original && current !== state.translated) {
      state = { original: current, translated: null };
      originalText.set(node, state);
    }
    if (node.nodeValue !== state.original) node.nodeValue = state.original;
  }

  function translateAttributes(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return;
    if (element.closest("pre, code, kbd, samp, [contenteditable='true'], [data-agy-no-translate]")) return;
    const attributes = ["title", "aria-label", "aria-description", "placeholder", "data-placeholder", "data-tooltip-content"];
    if (element.matches("input[type='button'], input[type='submit'], input[type='reset']")) attributes.push("value");
    let states = originalAttributes.get(element);
    if (!states) {
      states = new Map();
      originalAttributes.set(element, states);
    }
    for (const attr of attributes) {
      if (!element.hasAttribute(attr)) continue;
      const current = element.getAttribute(attr);
      let state = states.get(attr);
      if (effective === "ru") {
        if (!state || state.translated === null || (current !== state.original && current !== state.translated)) {
          const original = state?.translated === null && current === state.original ? state.original : current;
          state = { original, translated: translateExact(original) };
          states.set(attr, state);
        }
        if (current !== state.translated) element.setAttribute(attr, state.translated);
      } else if (state) {
        if (current !== state.original && current !== state.translated) {
          state = { original: current, translated: null };
          states.set(attr, state);
        }
        if (element.getAttribute(attr) !== state.original) element.setAttribute(attr, state.original);
      }
    }
  }

  function elementHasExactText(root, variants) {
    return [...root.querySelectorAll("*")].some(element => variants.has(element.textContent.trim()));
  }

  function nearestContainerWithLabels(start, labelVariants, maxDepth = 6) {
    let current = start;
    for (let depth = 0; current && depth < maxDepth; depth += 1, current = current.parentElement) {
      if (elementHasExactText(current, labelVariants)) return current;
    }
    return null;
  }

  function mcpCatalogSummary(title) {
    const database = /BigQuery|AlloyDB|Bigtable|Cloud SQL|Spanner|Database|Redis|MongoDB|Neon|Supabase|Prisma|ClickHouse|Firestore|Neo4j|Pinecone/i;
    const search = /Search|Perplexity|Exa|Parallel Search|Knowledge Catalog|Developer Knowledge/i;
    const finance = /FactSet|Daloopa|Finnhub|S&P Global|LSEG|Fiscal\.ai/i;
    const legal = /Harvey|LegalZoom|NetDocuments|iManage|Courtroom5|Docusign|Relativity/i;
    const cloud = /Google Cloud|Cloud Run|Kubernetes|Vertex AI|Firebase|Genkit|Grafana|Splunk|Wiz|Crowdstrike|Harness/i;
    const development = /GitHub|GitLab|Figma|Postman|Chrome DevTools|Dart|Flutter|Go$|Android|Vercel|Netlify|Heroku|Canva|Locofy|Sonar|Sonatype|Stitch|Miro|Atlassian|Linear|mabl|Opsera|Forge|Endor Labs|Arize/i;
    if (database.test(title)) return `Работа с данными ${title} через MCP.`;
    if (search.test(title)) return `Поиск информации с помощью ${title} через MCP.`;
    if (finance.test(title)) return `Поиск и анализ финансовых данных ${title} через MCP.`;
    if (legal.test(title)) return `Работа с юридическими данными ${title} через MCP.`;
    if (cloud.test(title)) return `Управление ресурсами ${title} через MCP.`;
    if (development.test(title)) return `Интеграция ${title} с инструментами разработки Antigravity.`;
    return `Подключение сервиса ${title} к Antigravity через MCP.`;
  }

  function translateDynamicMcpCatalog() {
    const descriptions = document.querySelectorAll("[data-testid='add-mcp-screen'] .text-xs.text-muted-foreground.mt-1.line-clamp-2");
    for (const description of descriptions) {
      const card = description.closest(".p-4.flex.items-start.justify-between") || description.parentElement?.parentElement;
      const titleElement = card?.querySelector(".text-sm.font-medium");
      const title = titleElement?.textContent.trim();
      if (!title) continue;
      const current = description.textContent.trim();
      let state = originalMcpDescriptions.get(description);
      if (!state || (current !== state.original && current !== state.translated)) {
        state = { original: current, translated: mcpCatalogSummary(title) };
        originalMcpDescriptions.set(description, state);
      }
      const desired = effective === "ru" ? state.translated : state.original;
      if (description.textContent !== desired) description.textContent = desired;
    }
  }

  function hasDirectText(element, variants) {
    return [...element.childNodes].some(node => node.nodeType === Node.TEXT_NODE && variants.has(node.nodeValue.trim()));
  }

  function markStackedSettingRow(labelVariants) {
    const labels = [...document.querySelectorAll("div,span,p,h1,h2,h3")].filter(element => hasDirectText(element, labelVariants));
    for (const label of labels) {
      let current = label.parentElement;
      for (let depth = 0; current && depth < 6; depth += 1, current = current.parentElement) {
        if (!current.querySelector("button,[role='switch']")) continue;
        current.classList.add("agy-stacked-setting-row");
        break;
      }
    }
  }

  function applyMobileLayoutFixes() {
    const buttons = [...document.querySelectorAll("button")];
    const defaultLabels = new Set(["Default", "По умолчанию"]);
    const narrowLabels = new Set(["Narrow", "Узкая"]);
    const wideLabels = new Set(["Wide", "Широкая"]);
    const widthHeadingLabels = new Set(["Conversation Width", "Ширина диалога"]);
    for (const button of buttons) {
      if (!defaultLabels.has(button.textContent.trim())) continue;
      const group = button.parentElement;
      if (!group || !elementHasExactText(group, narrowLabels) || !elementHasExactText(group, wideLabels)) continue;
      group.classList.add("agy-width-toggle");
      nearestContainerWithLabels(group.parentElement, widthHeadingLabels)?.classList.add("agy-width-setting-row");
    }

    markStackedSettingRow(new Set(["Notification Settings", "Настройки уведомлений"]));
    markBalancedSettingRow(new Set(["Security Preset", "Профиль безопасности"]));
    markBalancedSettingRow(new Set(["Artifact Review Policy", "Проверка артефактов"]));
    markBalancedSettingRow(new Set(["Outside of folders file access policy", "Доступ к файлам вне рабочих папок"]));
    markBalancedSettingRow(new Set(["Terminal Command Auto Execution", "Автовыполнение команд терминала"]));
    fixJsPolicyRow();
    equalizeSelectButtons();
  }

  function equalizeSelectButtons() {
    document.querySelectorAll(".agy-balanced-setting-row button, .agy-js-policy-row button, .agy-choice-button").forEach(button => {
      if (button.getAttribute("role") === "switch") return;
      if (button.closest("[role='listbox'], [role='menu'], [data-base-ui-portal], #agy-themed-select-overlay")) return;
      button.style.setProperty("width", "156px", "important");
      button.style.setProperty("min-width", "156px", "important");
      button.style.setProperty("max-width", "156px", "important");
      button.style.setProperty("flex", "0 0 156px", "important");
      button.style.setProperty("box-sizing", "border-box", "important");
    });
  }

  function markBalancedSettingRow(labelVariants) {
    const labels = [...document.querySelectorAll("div,span,p,h1,h2,h3")].filter(element => hasDirectText(element, labelVariants));
    for (const label of labels) {
      let current = label.parentElement;
      for (let depth = 0; current && depth < 6; depth += 1, current = current.parentElement) {
        if (!current.querySelector("button,[role='combobox'],select")) continue;
        current.classList.add("agy-balanced-setting-row");
        current.classList.remove("agy-stacked-setting-row", "agy-browser-policy-row");
        current.querySelectorAll(".agy-browser-policy-select").forEach(button => button.classList.remove("agy-browser-policy-select"));
        break;
      }
    }
  }

  function publishThemeVars() {
    const probe = document.getElementById("root") || document.body;
    const style = getComputedStyle(probe);
    for (const name of ["--background", "--foreground", "--card", "--card-foreground", "--popover", "--popover-foreground", "--muted", "--muted-foreground", "--border", "--primary", "--primary-foreground", "--secondary", "--secondary-foreground", "--accent"]) {
      const value = style.getPropertyValue(name).trim();
      if (value) document.documentElement.style.setProperty(name, value);
    }
  }

  function coversScreen(element) {
    const rect = element.getBoundingClientRect();
    return rect.width >= window.innerWidth * 0.9 && rect.height >= window.innerHeight * 0.82;
  }

  function readThemeRgb() {
    const probe = document.createElement("div");
    probe.dataset.agyNoTranslate = "true";
    probe.style.cssText = "position:fixed;left:-9999px;top:0;width:4px;height:4px;pointer-events:none;";
    (document.getElementById("root") || document.body).appendChild(probe);
    const tries = ["var(--popover)", "hsl(var(--popover))", "var(--card)", "hsl(var(--card))", "var(--background)", "hsl(var(--background))"];
    let rgb = null;
    for (const value of tries) {
      probe.style.background = value;
      const bg = getComputedStyle(probe).backgroundColor || "";
      const match = bg.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?/);
      if (!match) continue;
      const alpha = match[4] === undefined ? 1 : Number(match[4]);
      if (alpha < 0.2) continue;
      rgb = [Math.round(Number(match[1])), Math.round(Number(match[2])), Math.round(Number(match[3]))];
      break;
    }
    probe.remove();
    return rgb || [28, 28, 30];
  }

  function glassPrefs() {
    const transparency = Math.min(100, Math.max(0, Number(localStorage.getItem("agy-glass-transparency") ?? 18)));
    const dim = Math.min(100, Math.max(0, Number(localStorage.getItem("agy-glass-dim") ?? 8)));
    const alpha = Math.round((0.975 - transparency * 0.0005) * 1000) / 1000;
    const shade = Math.round((0.012 + dim * 0.00055) * 1000) / 1000;
    return { transparency, dim, alpha, shade };
  }

  function applyGlassPrefs() {
    const prefs = glassPrefs();
    const [r, g, b] = readThemeRgb();
    const light = (r + g + b) / 3 > 168;
    const alpha = Math.min(0.988, prefs.alpha + (light ? 0.012 : 0));
    const color = `rgba(${Math.round(r * (1 - prefs.shade))}, ${Math.round(g * (1 - prefs.shade))}, ${Math.round(b * (1 - prefs.shade))}, ${alpha})`;
    const root = document.documentElement;
    root.style.setProperty("--agy-pop-alpha", String(alpha));
    root.style.setProperty("--agy-pop-blur", "6px");
    root.style.setProperty("--agy-glass", color);
    return { ...prefs, alpha, color };
  }

  function paintGlass(element) {
    if (!element || coversScreen(element)) return;
    const role = element.getAttribute("role");
    if (role !== "listbox" && role !== "menu") return;
    const { color } = applyGlassPrefs();
    element.classList.add("agy-glass-surface");
    element.style.setProperty("--agy-glass", color);
    element.style.setProperty("background", color, "important");
    element.style.setProperty("background-color", color, "important");
    element.style.setProperty("background-image", "none", "important");
    element.style.setProperty("-webkit-backdrop-filter", "none", "important");
    element.style.setProperty("backdrop-filter", "none", "important");
  }

  function applyThemedOverlays(root = document) {
    const scope = root?.querySelectorAll ? root : document;
    const { color } = applyGlassPrefs();
    document.documentElement.style.setProperty("--agy-glass", color);
    publishThemeVars();
    scope.querySelectorAll("[role='listbox'], [role='menu']").forEach(element => {
      if (element.closest("#agy-language-overlay, #agy-themed-select-overlay, .agy-tools-page, .settings-modal-container, .settings-modal-backdrop, [data-testid='agent-input-box']")) return;
      const rect = element.getBoundingClientRect();
      if (rect.width < 40 || rect.height < 24) return;
      if (rect.height > window.innerHeight * 0.85 || rect.width > window.innerWidth - 4) return;
      element.classList.add("agy-themed-overlay-surface");
      paintGlass(element);
    });

    scope.querySelectorAll([
      "[data-testid='bottom-sheet-backdrop']",
      "[data-testid='lifted-context-menu-backdrop']",
      ".settings-modal-backdrop",
      ".aux-drawer-backdrop"
    ].join(",")).forEach(element => element.classList.add("agy-themed-overlay-backdrop"));

    scope.querySelectorAll(".fixed.inset-0").forEach(element => {
      const classes = typeof element.className === "string" ? element.className : "";
      if (classes.includes("bg-black/") || classes.includes("bg-overlay-")) {
        element.classList.add("agy-themed-overlay-backdrop");
      }
    });
  }

  function translateTree(root) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      translateTextNode(root);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
    if (root.nodeType === Node.ELEMENT_NODE) translateAttributes(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let item;
    while ((item = walker.nextNode())) {
      if (item.nodeType === Node.TEXT_NODE) {
        translateTextNode(item);
      } else translateAttributes(item);
    }
  }

  function labels() {
    return effective === "ru"
      ? { title: "Язык", hint: "Язык агента и системы", intro: "Выберите язык Antigravity", detail: "Выбор применяется к интерфейсу, ответам, планам и видимому рассуждению агента. Позже язык можно изменить в настройках.", system: "Системный", systemHint: "Использовать язык Android", ru: "Русский", ruHint: "Интерфейс и ответы на русском", en: "English", enHint: "Interface and answers in English", apply: "Продолжить", current: "Текущий язык", close: "Закрыть" }
      : { title: "Language", hint: "Agent and system language", intro: "Choose the Antigravity language", detail: "This applies to the interface, answers, plans, and visible agent reasoning. You can change it later in Settings.", system: "System", systemHint: "Use the Android language", ru: "Русский", ruHint: "Интерфейс и ответы на русском", en: "English", enHint: "Interface and answers in English", apply: "Continue", current: "Current language", close: "Close" };
  }

  function setMode(next, closeDialog) {
    if (!MODES.has(next)) return;
    mode = next;
    effective = resolveMode(mode);
    localStorage.setItem(STORAGE_MODE, mode);
    localStorage.setItem(STORAGE_ONBOARDED, "1");
    document.documentElement.lang = effective;
    document.documentElement.dataset.agyLanguage = effective;
    translateTree(document.body);
    translateDynamicMcpCatalog();
    applyMobileLayoutFixes();
    applyThemedOverlays();
    applyPluginsNodeWarning();
    refreshControls();
    document.querySelector("[data-agy-deferred]")?.removeAttribute("data-agy-lang");
    mergeDeferredSend();
    if (closeDialog) document.getElementById("agy-language-overlay")?.remove();
    window.dispatchEvent(new CustomEvent("agy-language-changed", { detail: { mode, language: effective } }));
  }

  function languageOptions(selected) {
    const text = labels();
    return [
      ["system", "🌐", text.system, text.systemHint],
      ["ru", "РУ", text.ru, text.ruHint],
      ["en", "EN", text.en, text.enHint]
    ].map(([value, icon, title, hint]) =>
      `<button type="button" class="agy-lang-option${selected === value ? " selected" : ""}" data-lang-mode="${value}"><span class="agy-lang-icon">${icon}</span><span><strong>${title}</strong><small>${hint}</small></span><span class="agy-lang-check">✓</span></button>`
    ).join("");
  }

  
  let nodeBannerChecked = false;

  function applyPluginsNodeWarning() {
    const pluginsHeading = [...document.querySelectorAll("h1, h2, h3, div")].find(heading => /^(?:Build With Google Plugins|Плагины Build with Google)$/i.test((heading.textContent || "").trim()));
    if (!pluginsHeading) {
      nodeBannerChecked = false;
      return;
    }
    const container = pluginsHeading.closest(".flex-col") || pluginsHeading.parentElement;
    if (!container || container.querySelector(".agy-nodejs-warning")) return;
    if (nodeBannerChecked) return;
    nodeBannerChecked = true;
    if (window.__agyNodePresent?.()) return;
    const banner = document.createElement("div");
    banner.className = "agy-nodejs-warning";
    banner.dataset.agyNoTranslate = "true";
    const title = document.createElement("div");
    title.className = "agy-nodejs-warning-title";
    title.textContent = "Для работы плагинов требуется Node.js";
    const text = document.createElement("div");
    text.className = "agy-nodejs-warning-text";
    text.textContent = "Плагины и расширения запускаются через Node.js.";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "agy-nodejs-install-btn";
    button.textContent = "Установить Node.js";
    const detail = document.createElement("div");
    detail.className = "agy-nodejs-install-detail";
    button.addEventListener("click", () => window.__agyInstallNode?.(button, detail));
    banner.append(title, text, button, detail);
    pluginsHeading.parentElement.insertBefore(banner, pluginsHeading.nextSibling);
  }

  function showLanguageDialog(onboarding) {
    document.getElementById("agy-language-overlay")?.remove();
    const text = labels();
    const overlay = document.createElement("div");
    overlay.id = "agy-language-overlay";
    overlay.dataset.agyNoTranslate = "true";
    overlay.innerHTML = `<section class="agy-language-card" role="dialog" aria-modal="true" aria-labelledby="agy-language-title">
      <div class="agy-language-logo">A</div>
      <h1 id="agy-language-title">${onboarding ? text.intro : text.title}</h1>
      <p>${text.detail}</p>
      <div class="agy-language-options">${languageOptions(mode)}</div>
      <div class="agy-language-actions">${onboarding ? "" : `<button type="button" class="agy-lang-secondary" data-close-language>${text.close}</button>`}<button type="button" class="agy-lang-primary" data-apply-language>${text.apply}</button></div>
    </section>`;
    document.body.appendChild(overlay);
    let selected = mode;
    overlay.addEventListener("click", event => {
      const option = event.target.closest("[data-lang-mode]");
      if (option) {
        selected = option.dataset.langMode;
        overlay.querySelectorAll(".agy-lang-option").forEach(item => item.classList.toggle("selected", item.dataset.langMode === selected));
      }
      if (event.target.closest("[data-apply-language]")) setMode(selected, true);
      if (!onboarding && (event.target === overlay || event.target.closest("[data-close-language]"))) overlay.remove();
    });
  }

  function injectLanguageIntoGeneral() {
    const heading = [...document.querySelectorAll("h1,h2,h3,div,span,p")].find(element =>
      element.offsetParent !== null &&
      !element.closest("[data-agy-language-setting]") &&
      hasDirectText(element, new Set(["Execution", "Выполнение"]))
    );
    const existing = document.querySelector("[data-agy-language-setting]");
    if (!heading?.parentElement) {
      existing?.remove();
      return;
    }
    const parent = heading.parentElement;
    const parentStyle = getComputedStyle(parent);
    const parentRow = (parentStyle.display === "flex" || parentStyle.display === "inline-flex") && !parentStyle.flexDirection.startsWith("column");
    const siblings = [...parent.children].filter(element => element.dataset.agyLanguageSetting !== "true");
    const headerOnly = siblings.length <= 2 && siblings.every(element => !element.querySelector("button, [role='combobox'], select"));
    let anchor = heading;
    if (parentRow && headerOnly && parent.parentElement) {
      anchor = parent;
    } else if (parentRow) {
      parent.style.setProperty("flex-wrap", "wrap", "important");
      heading.style.setProperty("flex", "1 0 100%", "important");
      heading.style.setProperty("width", "100%", "important");
      heading.style.setProperty("max-width", "100%", "important");
    }
    if (!anchor.parentElement) return;
    const host = anchor.parentElement;
    const hostStyle = getComputedStyle(host);
    if ((hostStyle.display === "flex" || hostStyle.display === "inline-flex") && !hostStyle.flexDirection.startsWith("column")) {
      host.style.setProperty("flex-wrap", "wrap", "important");
    }
    if (existing?.parentElement === host && existing.nextElementSibling === anchor) return;
    existing?.remove();
    host.insertBefore(buildLanguageRow(), anchor);
  }

  function languageChoices() {
    const text = labels();
    return [
      { value: "system", label: text.system },
      { value: "ru", label: text.ru },
      { value: "en", label: text.en }
    ];
  }

  function buildLanguageRow() {
    const row = document.createElement("div");
    row.dataset.agyLanguageSetting = "true";
    row.dataset.agyNoTranslate = "true";
    row.className = "agy-language-setting";
    const title = effective === "ru" ? "Язык приложения" : "App language";
    const current = languageChoices().find(item => item.value === mode)?.label || title;
    row.innerHTML = `<span><strong>${title}</strong></span><button type="button" class="agy-choice-button"></button>`;
    const button = row.querySelector("button");
    button.textContent = current;
    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      openChoiceMenu(languageChoices().map(item => ({
        label: item.label,
        selected: item.value === mode,
        onPick: () => setMode(item.value, false)
      })), button);
    });
    return row;
  }

  function refreshControls() {
    document.querySelector("[data-agy-language-setting]")?.remove();
    injectLanguageIntoGeneral();
  }

  let choiceOpenedAt = 0;

  function closeThemedSelect() {
    const overlay = document.getElementById("agy-themed-select-overlay");
    if (!overlay) return;
    try { overlay.hidePopover?.(); } catch (_) {}
    overlay.remove();
  }

  function openChoiceMenu(items, anchor) {
    closeThemedSelect();
    const overlay = document.createElement("div");
    overlay.id = "agy-themed-select-overlay";
    overlay.dataset.agyNoTranslate = "true";
    const panel = document.createElement("div");
    panel.className = "agy-anchor-menu";
    panel.dataset.agyNoTranslate = "true";
    panel.setAttribute("role", "listbox");
    items.forEach(item => {
      const choice = document.createElement("button");
      choice.type = "button";
      choice.className = "agy-anchor-option";
      choice.setAttribute("role", "option");
      choice.setAttribute("aria-selected", item.selected ? "true" : "false");
      choice.innerHTML = `<span></span><i aria-hidden="true"></i>`;
      choice.querySelector("span").textContent = item.label;
      choice.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        item.onPick?.();
        closeThemedSelect();
      });
      panel.appendChild(choice);
    });
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    const rect = anchor?.getBoundingClientRect?.() || { left: 16, right: window.innerWidth - 16, top: 120, bottom: 160, width: 140 };
    const longest = items.reduce((max, item) => Math.max(max, item.label.length), 0);
    const width = Math.round(Math.min(188, Math.max(rect.width, longest * 7.4 + 42)));
    panel.style.width = `${Math.round(width)}px`;
    let left = rect.right - width;
    left = Math.max(12, Math.min(left, window.innerWidth - 12 - width));
    let top = rect.bottom + 6;
    const height = panel.offsetHeight;
    if (top + height > window.innerHeight - 12) top = Math.max(12, rect.top - height - 6);
    panel.style.left = `${Math.round(left)}px`;
    panel.style.top = `${Math.round(top)}px`;
    paintGlass(panel);
    choiceOpenedAt = performance.now();
    const dismiss = event => {
      if (performance.now() - choiceOpenedAt < 280) return;
      if (!panel.contains(event.target)) closeThemedSelect();
    };
    overlay.addEventListener("pointerdown", dismiss);
  }

  function installThemedSelects() {}

  function installAndroidMicrophoneBridge() {
    let permissionConfirmed = false;
    let pendingButton = null;
    let lastIntercept = 0;

    const isRecordButton = button => {
      if (!(button instanceof HTMLButtonElement)) return false;
      const label = (button.getAttribute("aria-label") || "").toLowerCase();
      return label === "record voice memo" || label.includes("record audio") || label.includes("записать аудио");
    };

    const queryPermission = async () => {
      try {
        if (!navigator.permissions?.query) return null;
        const status = await navigator.permissions.query({ name: "microphone" });
        return status.state;
      } catch (_) {
        return null;
      }
    };

    const resumeRecording = async () => {
      if (!pendingButton?.isConnected) return;
      const state = await queryPermission();
      if (state === "granted") {
        const button = pendingButton;
        pendingButton = null;
        permissionConfirmed = true;
        button.disabled = false;
        button.click();
      }
    };

    const requestNativePermission = button => {
      pendingButton = button;
      button.disabled = false;
      try {
        // This marker is handled by the Android bridge in the localized APK.
        window.Android?.onUiError?.("__request_audio_permission__");
      } catch (_) {}
      let attempts = 0;
      const timer = window.setInterval(async () => {
        attempts += 1;
        await resumeRecording();
        if (!pendingButton || attempts >= 40) window.clearInterval(timer);
      }, 500);
    };

    const intercept = async event => {
      const button = event.target.closest?.("button");
      if (!isRecordButton(button) || permissionConfirmed) return;
      const now = performance.now();
      event.preventDefault();
      event.stopImmediatePropagation();
      if (now - lastIntercept < 600) return;
      lastIntercept = now;
      if (await queryPermission() === "granted") {
        permissionConfirmed = true;
        button.click();
      } else requestNativePermission(button);
    };

    const enableButtons = () => {
      document.querySelectorAll("button").forEach(button => {
        if (isRecordButton(button)) {
          button.disabled = false;
          button.style.pointerEvents = "auto";
          button.style.touchAction = "manipulation";
        }
      });
    };

    // Do not block microphone clicks with preventDefault/stopImmediatePropagation.
    // Native Antigravity recorder handles audio capture and permission directly.
    enableButtons();
    window.addEventListener("focus", () => window.setTimeout(async () => {
      if (!pendingButton?.isConnected) return;
      const state = await queryPermission();
      if (state === "denied") return;
      const button = pendingButton;
      pendingButton = null;
      permissionConfirmed = true;
      button.disabled = false;
      button.click();
    }, 350));
    enableButtons();
    new MutationObserver(enableButtons).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled", "aria-label"] });
  }

  let popperLoop = 0;
  let lastMenuTrigger = null;
  const cardByTrigger = new WeakMap();
  document.addEventListener("pointerdown", event => {
    const button = event.target?.closest?.("button, [role='combobox']");
    if (!button || button.closest("[data-base-ui-portal], [role='listbox'], [role='menu'], #agy-frame-overlay")) return;
    lastMenuTrigger = button;
    const card = findCardElement(button);
    if (card) {
      const rect = card.getBoundingClientRect();
      cardByTrigger.set(button, card);
      button.dataset.agyCardLeft = String(Math.round(rect.left));
      button.dataset.agyCardWidth = String(Math.round(card.offsetWidth || rect.width));
    }
    if (button.closest(".settings-modal-container, .settings-modal-backdrop")) {
      document.documentElement.classList.add("agy-noscroll-x");
      const root = document.scrollingElement;
      if (root && root.scrollLeft) root.scrollLeft = 0;
      document.querySelectorAll(".settings-modal-backdrop, .settings-modal-container").forEach(el => {
        if (el.scrollLeft) el.scrollLeft = 0;
      });
    }
  }, true);
  let frameOptionNodes = [];
  window.addEventListener("pointerdown", event => {
    const choice = event.target?.closest?.("#agy-frame-overlay [data-agy-choice]");
    if (!choice) return;
    event.preventDefault();
    event.stopPropagation();
    const option = frameOptionNodes[Number(choice.dataset.agyChoice)];
    document.getElementById("agy-frame-overlay")?.remove();
    frameOptionNodes = [];
    if (!option?.isConnected) return;
    option.style.setProperty("pointer-events", "auto", "important");
    option.click();
  }, true);

  function fixJsPolicyRow() {
    const variants = new Set(["Browser Javascript Execution Policy", "Browser JavaScript Execution Policy", "Политика выполнения JavaScript в браузере"]);
    const title = [...document.querySelectorAll("span,div")].find(element => hasDirectText(element, variants) && element.offsetParent !== null);
    if (!title) return;
    let row = title.parentElement;
    for (let depth = 0; row && depth < 6; depth += 1, row = row.parentElement) {
      if (row.querySelector(":scope > .shrink-0 button, :scope > button") && String(row.className).includes("w-full")) break;
    }
    if (!row || !row.isConnected || !String(row.className).includes("w-full")) return;
    row.classList.remove("agy-balanced-setting-row", "agy-browser-policy-row", "agy-stacked-setting-row");
    row.classList.add("agy-js-policy-row");
    row.querySelectorAll(".agy-browser-policy-select").forEach(button => button.classList.remove("agy-browser-policy-select"));
  }

  function framedSettingsMenu(popup) {
    const text = (popup.innerText || "").replace(/\s+/g, " ");
    const security = /Turbo mode|Турборежим|Full machine|Full access|Полный доступ/.test(text) && /Custom|Пользовательский/.test(text);
    const javascript = /JavaScript|браузерн/i.test(text) && /Не спрашивать|Don't ask|Always Proceed|Отключено|Disabled/.test(text);
    return security || javascript;
  }

  function settingsFrame() {
    const trigger = [...document.querySelectorAll("button[aria-expanded='true'], [role='combobox'][aria-expanded='true']")].find(element => !element.closest("[data-base-ui-portal], [role='listbox'], [role='menu']"));
    const language = document.querySelector(".agy-language-setting")?.getBoundingClientRect();
    let node = trigger?.parentElement;
    let best = null;
    for (let depth = 0; node && depth < 14; depth += 1, node = node.parentElement) {
      const rect = node.getBoundingClientRect();
      if (rect.width < window.innerWidth * 0.7 || rect.width > window.innerWidth - 6) continue;
      if (rect.height < 44 || rect.height > window.innerHeight * 0.62) continue;
      const delta = language && language.width > 80
        ? Math.abs(rect.width - language.width) + Math.abs(rect.left - language.left)
        : rect.height;
      if (!best || delta < best.delta) {
        best = {
          delta,
          left: Math.round(rect.left),
          width: Math.round(rect.width),
          top: rect.top,
          bottom: rect.bottom
        };
      }
    }
    if (best) return best;
    if (language && language.width > 80) {
      return { left: Math.round(language.left), width: Math.round(language.width), top: language.top, bottom: language.bottom };
    }
    return { left: 16, width: Math.max(160, window.innerWidth - 32), top: 80, bottom: 140 };
  }

  function visibleTrigger(popup) {
    const usable = element => {
      if (!element || !element.isConnected) return false;
      if (element.closest("[data-base-ui-portal], [role='listbox'], [role='menu']")) return false;
      const rect = element.getBoundingClientRect();
      return rect.width > 36 && rect.height > 18 && rect.bottom > 24 && rect.top < window.innerHeight - 8;
    };
    if (usable(lastMenuTrigger)) return lastMenuTrigger;
    const opened = [...document.querySelectorAll("button[aria-expanded='true'], [role='combobox'][aria-expanded='true'], button[data-state='open']")].filter(usable);
    const selected = popup.querySelector("[aria-selected='true'], [data-state='checked'], [aria-checked='true']");
    const label = ((selected?.innerText || "").split("\n").map(line => line.trim()).find(Boolean) || "").replace(/\s+/g, " ");
    if (label.length >= 3) {
      const pool = opened.length ? opened : [...document.querySelectorAll("button, [role='combobox']")].filter(usable);
      const match = pool.find(element => {
        const text = (element.innerText || "").replace(/\s+/g, " ").trim();
        return text.length > 1 && (text.includes(label.slice(0, 18)) || label.includes(text.slice(0, 14)));
      });
      if (match) return match;
    }
    return opened.sort((a, b) => a.getBoundingClientRect().width - b.getBoundingClientRect().width)[0] || null;
  }

  function cardOf(trigger) {
    const button = trigger.getBoundingClientRect();
    const minWidth = Math.max(button.width + 28, Math.min(button.width * 1.8, window.innerWidth * 0.72));
    let best = null;
    let node = trigger.parentElement;
    for (let depth = 0; node && depth < 16; depth += 1, node = node.parentElement) {
      if (node.getAttribute && node.getAttribute("data-base-ui-portal") !== null) break;
      const style = getComputedStyle(node);
      const radius = parseFloat(style.borderTopLeftRadius) || 0;
      const border = parseFloat(style.borderTopWidth) || 0;
      const shadow = style.boxShadow && style.boxShadow !== "none";
      const cls = typeof node.className === "string" ? node.className : "";
      const looksCard = radius >= 6 || (cls.includes("rounded") && cls.includes("border"));
      if (!looksCard || (border < 0.5 && !shadow && !cls.includes("border"))) continue;
      const rect = node.getBoundingClientRect();
      if (rect.width < minWidth || rect.width > window.innerWidth - 4) continue;
      if (rect.height < 44 || rect.height > 320) continue;
      if (!best || rect.width < best.width - 1) best = rect;
    }
    return best;
  }

  function menuShell(popup) {
    let node = popup.parentElement;
    while (node && node !== document.body) {
      if (node.hasAttribute("data-base-ui-inert")) break;
      const role = node.getAttribute("role");
      const transform = node.style.transform || "";
      const position = node.style.position || "";
      if (role === "presentation" || transform.includes("translate") || position === "fixed" || position === "absolute") {
        const rect = node.getBoundingClientRect();
        if (rect.width < window.innerWidth * 0.98 || rect.height < window.innerHeight * 0.9) return node;
      }
      node = node.parentElement;
    }
    return popup;
  }

  function pinShell(shell, popup, left, top, width, maxH) {
    shell.setAttribute("data-agy-anchor", "1");
    shell.style.setProperty("--agy-w", `${Math.round(width)}px`);
    popup.style.setProperty("max-height", `${Math.round(maxH)}px`, "important");
    popup.style.setProperty("overflow-x", "hidden", "important");
    popup.style.setProperty("overflow-y", "auto", "important");
    popup.style.setProperty("box-sizing", "border-box", "important");
    if (shell === popup) {
      popup.style.setProperty("width", `${Math.round(width)}px`, "important");
      popup.style.setProperty("max-width", `${Math.round(width)}px`, "important");
      popup.style.setProperty("min-width", `${Math.round(width)}px`, "important");
    } else {
      popup.style.setProperty("width", "100%", "important");
      popup.style.setProperty("max-width", "100%", "important");
      popup.style.setProperty("min-width", "0", "important");
    }
    popup.querySelectorAll("button, span, p").forEach(node => {
      node.style.setProperty("white-space", "normal", "important");
      node.style.setProperty("overflow-wrap", "break-word", "important");
      node.style.setProperty("max-width", "100%", "important");
    });
    const key = `${Math.round(left)}:${Math.round(top)}:${Math.round(width)}`;
    if (shell.dataset.agyTarget !== key) {
      shell.style.setProperty("--agy-x", "0px");
      shell.style.setProperty("--agy-y", "0px");
      shell.dataset.agyTarget = key;
    }
    for (let pass = 0; pass < 4; pass += 1) {
      const rect = popup.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      const dx = left - rect.left;
      const dy = top - rect.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      const x = parseFloat(shell.style.getPropertyValue("--agy-x")) || 0;
      const y = parseFloat(shell.style.getPropertyValue("--agy-y")) || 0;
      shell.style.setProperty("--agy-x", `${Math.round(x + dx)}px`);
      shell.style.setProperty("--agy-y", `${Math.round(y + dy)}px`);
    }
  }

  function placeInSettingsFrame(popup) {
    const trigger = visibleTrigger(popup);
    if (!trigger) return;
    const button = trigger.getBoundingClientRect();
    const card = cardOf(trigger);
    const width = Math.round(card ? card.width : Math.max(220, Math.min(window.innerWidth - 20, button.width + 48)));
    const left = Math.round(Math.max(4, Math.min(card ? card.left : button.left, window.innerWidth - width - 4)));
    const shell = menuShell(popup);
    shell.setAttribute("data-agy-anchor", "1");
    shell.style.setProperty("--agy-w", `${width}px`);
    const contentH = Math.max(popup.scrollHeight || 0, 72);
    const gap = 4;
    const edge = 8;
    const openBelow = button.top < window.innerHeight * 0.42;
    let maxH;
    let top;
    if (openBelow) {
      maxH = Math.min(contentH, Math.max(72, window.innerHeight - edge - (button.bottom + gap)));
      top = Math.round(button.bottom + gap);
    } else {
      maxH = Math.min(contentH, Math.max(72, button.top - gap - edge));
      top = Math.round(button.top - gap - maxH);
    }
    pinShell(shell, popup, left, top, width, maxH);
  }

  function placeUnderButton(popup, positioner) {
    const trigger = [...document.querySelectorAll("button[aria-expanded='true'], [role='combobox'][aria-expanded='true']")].find(element => !element.closest("[data-base-ui-portal], [role='listbox'], [role='menu']"));
    if (!trigger) {
      keepShortMenu(popup);
      return;
    }
    const bounds = trigger.getBoundingClientRect();
    const width = Math.max(88, Math.min(Math.round(bounds.width), window.innerWidth - 16));
    let left = Math.round(bounds.right - width);
    left = Math.max(8, Math.min(left, window.innerWidth - 8 - width));
    const height = Math.min(popup.scrollHeight || popup.getBoundingClientRect().height || 160, window.innerHeight - 16);
    let top = Math.round(bounds.bottom + 6);
    if (top + height > window.innerHeight - 8) top = Math.max(8, Math.round(bounds.top - height - 6));
    positioner.style.setProperty("position", "fixed", "important");
    positioner.style.setProperty("transform", "none", "important");
    positioner.style.setProperty("left", `${left}px`, "important");
    positioner.style.setProperty("right", "auto", "important");
    positioner.style.setProperty("top", `${top}px`, "important");
    positioner.style.setProperty("width", `${width}px`, "important");
    positioner.style.setProperty("max-width", `${width}px`, "important");
    positioner.style.setProperty("min-width", "0", "important");
    positioner.style.setProperty("padding", "0", "important");
    positioner.style.setProperty("margin", "0", "important");
    popup.style.setProperty("width", "100%", "important");
    popup.style.setProperty("max-width", "100%", "important");
    popup.style.setProperty("min-width", "0", "important");
    popup.style.setProperty("box-sizing", "border-box", "important");
    popup.style.setProperty("overflow-x", "hidden", "important");
    popup.style.setProperty("overflow-y", "auto", "important");
    popup.querySelectorAll("button, span").forEach(node => {
      node.style.setProperty("white-space", "nowrap", "important");
      node.style.setProperty("overflow", "hidden", "important");
      node.style.setProperty("text-overflow", "ellipsis", "important");
    });
  }

  function keepShortMenu(popup) {
    popup.style.removeProperty("width");
    popup.style.removeProperty("max-width");
    popup.style.removeProperty("min-width");
    const positioner = popup.parentElement;
    if (!positioner) return;
    const rect = popup.getBoundingClientRect();
    if (rect.left >= 8 && rect.right <= window.innerWidth - 8) return;
    if (positioner.dataset.agyNudged === "1") return;
    const shift = rect.left < 8 ? 8 - rect.left : window.innerWidth - 8 - rect.right;
    const match = (positioner.style.transform || "").match(/translate3d?\(\s*([-0-9.]+)px(?:\s*,|\s)\s*([-0-9.]+)px/i);
    if (!match) return;
    positioner.dataset.agyNudged = "1";
    positioner.style.setProperty("transform", `translate3d(${Math.round(parseFloat(match[1]) + shift)}px, ${Math.round(parseFloat(match[2]))}px, 0)`, "important");
  }

  function tightenShortMenu(popup) {
    const role = popup.getAttribute("role");
    if (role !== "listbox" && role !== "menu") return;
    const text = popup.innerText || "";
    if (/Terminals|Терминал|Диалоги|\bbash\b|apktool|Working|java: not found/i.test(text)) return;
    if (/Gemini|Claude|GPT|Модель|Остаток недельного|weekly limit|пятичасов/i.test(text)) return;
    const lines = text.split("\n").map(line => line.trim()).filter(Boolean);
    if (!lines.length || lines.some(line => line.length > 26)) return;
    const rect = popup.getBoundingClientRect();
    const trigger = [...document.querySelectorAll("button[aria-expanded='true']")].find(element => !element.closest("[data-base-ui-portal], [role='listbox'], [role='menu']"));
    const triggerW = trigger ? trigger.getBoundingClientRect().width : 120;
    if (rect.width <= Math.max(176, triggerW + 24)) return;
    const width = Math.round(Math.min(188, Math.max(triggerW, 124)));
    popup.classList.add("agy-tight-menu");
    popup.style.setProperty("width", `${width}px`, "important");
    popup.style.setProperty("max-width", `${width}px`, "important");
    popup.style.setProperty("min-width", "0", "important");
  }

  function balanceHorizontally(popup) {
    const positioner = popup.parentElement;
    if (!positioner || positioner === document.body) return;
    const rect = popup.getBoundingClientRect();
    if (rect.width < 80 || rect.height < 40 || rect.width > window.innerWidth - 8) return;
    const shift = (window.innerWidth - rect.width) / 2 - rect.left;
    if (Math.abs(shift) < 3) return;
    const match = (positioner.style.transform || "").match(/translate3d?\(\s*([-0-9.]+)px(?:\s*,|\s)\s*([-0-9.]+)px/i);
    if (!match) return;
    const x = Math.round(parseFloat(match[1]) + shift);
    const y = Math.round(parseFloat(match[2]));
    if (Math.round(parseFloat(match[1])) === x) return;
    positioner.style.setProperty("transform", `translate3d(${x}px, ${y}px, 0)`, "important");
  }

  function settingsColumn(trigger) {
    const button = trigger.getBoundingClientRect();
    let best = null;
    document.querySelectorAll("div.rounded-xl.border, div.border.rounded-xl").forEach(element => {
      if (!element.contains(trigger) || element.closest("[data-base-ui-portal]")) return;
      const rect = element.getBoundingClientRect();
      if (rect.width < Math.max(200, button.width + 48) || rect.width > window.innerWidth - 16) return;
      if (rect.height < 40 || rect.height > window.innerHeight * 0.72) return;
      if (rect.bottom < button.top - 4 || rect.top > button.bottom + 4) return;
      if (!best || rect.width < best.width - 1) best = rect;
    });
    if (!best) return null;
    const left = Math.round(best.left);
    let width = Math.round(best.width);
    const maxWidth = Math.round(window.innerWidth - left - 8);
    if (width > maxWidth) width = maxWidth;
    return { left, width };
  }

  function menuChoices(popup) {
    const roles = [...popup.querySelectorAll("[role='option'], [role='menuitem']")].filter(node => (node.innerText || "").trim());
    if (roles.length) return roles;
    return [...popup.querySelectorAll("button")].filter(node => {
      const text = (node.innerText || "").trim();
      const rect = node.getBoundingClientRect();
      return text.length > 1 && rect.height > 24 && rect.width > 40;
    });
  }

  function hideNativeMenu(popup) {
    const portal = popup.closest("[data-base-ui-portal]");
    popup.style.setProperty("visibility", "hidden", "important");
    popup.style.setProperty("pointer-events", "none", "important");
    const parent = popup.parentElement;
    if (parent && parent !== portal && parent !== document.body && !parent.contains(document.getElementById("agy-frame-overlay"))) {
      parent.style.setProperty("visibility", "hidden", "important");
      parent.style.setProperty("pointer-events", "none", "important");
    }
  }

  function showFrameMenu(popup) {
    const trigger = visibleTrigger(popup);
    if (!trigger) return;
    const options = menuChoices(popup);
    if (!options.length) return;
    const column = settingsColumn(trigger);
    const anchor = trigger.getBoundingClientRect();
    let overlay = document.getElementById("agy-frame-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "agy-frame-overlay";
      overlay.dataset.agyNoTranslate = "true";
      document.body.appendChild(overlay);
    }
    frameOptionNodes = options;
    const signature = options.map(option => (option.innerText || "").trim()).join("\n");
    if (overlay.dataset.agySig !== signature) {
      overlay.dataset.agySig = signature;
      overlay.replaceChildren(...options.map((option, index) => {
        const lines = (option.innerText || "").split("\n").map(line => line.trim()).filter(Boolean);
        const choice = document.createElement("button");
        choice.type = "button";
        choice.dataset.agyChoice = String(index);
        const selected = option.getAttribute("aria-selected") === "true" || option.hasAttribute("data-selected") || option.getAttribute("data-state") === "checked";
        if (selected) choice.setAttribute("aria-selected", "true");
        const title = document.createElement("b");
        title.textContent = lines[0] || "";
        choice.appendChild(title);
        if (lines.length > 1) {
          const detail = document.createElement("span");
          detail.textContent = lines.slice(1).join(" ");
          choice.appendChild(detail);
        }
        return choice;
      }));
    }
    const portal = popup.closest("[data-base-ui-portal]") || document.body;
    if (overlay.parentElement !== portal) portal.appendChild(overlay);
    const width = Math.round(Math.max(160, Math.min(column.width, window.innerWidth - 8)));
    const left = Math.round(Math.max(4, Math.min(column.left, window.innerWidth - width - 4)));
    const openBelow = anchor.top + anchor.height / 2 < window.innerHeight * 0.45;
    overlay.style.setProperty("position", "fixed", "important");
    overlay.style.setProperty("z-index", "2147483646", "important");
    overlay.style.setProperty("left", "0px", "important");
    overlay.style.setProperty("top", "0px", "important");
    overlay.style.setProperty("right", "auto", "important");
    overlay.style.setProperty("bottom", "auto", "important");
    overlay.style.setProperty("width", `${width}px`, "important");
    overlay.style.setProperty("max-width", `${width}px`, "important");
    overlay.style.setProperty("min-width", `${width}px`, "important");
    overlay.style.setProperty("margin", "0", "important");
    overlay.style.setProperty("transform", "translate3d(0px, 0px, 0px)", "important");
    const natural = Math.min(overlay.scrollHeight || 120, Math.round(window.innerHeight * 0.52));
    const gap = 4;
    let maxH;
    let top;
    if (openBelow) {
      maxH = Math.min(natural, Math.max(72, window.innerHeight - 8 - (anchor.bottom + gap)));
      top = anchor.bottom + gap;
    } else {
      maxH = Math.min(natural, Math.max(72, anchor.top - gap - 8));
      top = anchor.top - gap - maxH;
    }
    overlay.style.setProperty("max-height", `${Math.round(maxH)}px`, "important");
    let x = 0;
    let y = 0;
    for (let pass = 0; pass < 4; pass += 1) {
      const rect = overlay.getBoundingClientRect();
      const dx = left - rect.left;
      const dy = top - rect.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) break;
      x = Math.round(x + dx);
      y = Math.round(y + dy);
      overlay.style.setProperty("transform", `translate3d(${x}px, ${y}px, 0px)`, "important");
    }
    hideNativeMenu(popup);
  }

  function findCardElement(trigger) {
    if (!trigger?.isConnected) return null;
    const button = trigger.getBoundingClientRect();
    let best = null;
    let node = trigger.parentElement;
    for (let depth = 0; node && depth < 18 && node !== document.body; depth += 1, node = node.parentElement) {
      if (node.hasAttribute?.("data-base-ui-portal")) break;
      const cls = typeof node.className === "string" ? node.className : "";
      const style = getComputedStyle(node);
      const radius = parseFloat(style.borderTopLeftRadius) || 0;
      const border = parseFloat(style.borderTopWidth) || 0;
      const rounded = cls.includes("rounded-xl") || radius >= 10;
      if (!rounded || (border < 0.5 && !cls.includes("border"))) continue;
      const rect = node.getBoundingClientRect();
      if (rect.width < Math.max(160, button.width + 32)) continue;
      if (rect.height < 36 || rect.height > window.innerHeight * 0.92) continue;
      if (rect.right < button.left - 2 || rect.left > button.right + 2) continue;
      if (!best || rect.width < best.width - 1) best = { node, width: rect.width };
    }
    return best ? best.node : null;
  }

  function clampCard(rect) {
    const view = window.visualViewport;
    const origin = view?.offsetLeft || 0;
    const widthLimit = view?.width || window.innerWidth;
    const margin = 4;
    let left = rect.left;
    let width = rect.width;
    if (left < origin + margin) {
      width -= origin + margin - left;
      left = origin + margin;
    }
    if (left + width > origin + widthLimit - margin) width = origin + widthLimit - margin - left;
    left = Math.round(left);
    width = Math.round(width);
    if (width < 160) return null;
    return { left, width };
  }

  function frameShell(popup) {
    let node = popup;
    let shell = popup;
    while (node && node !== document.body) {
      if (node.hasAttribute("data-base-ui-portal")) break;
      const position = getComputedStyle(node).position;
      if (position === "fixed" || position === "absolute") shell = node;
      node = node.parentElement;
    }
    return shell;
  }

  function resetSettingsScroll() {
    const root = document.scrollingElement;
    if (root && root.scrollLeft) root.scrollLeft = 0;
    document.querySelectorAll(".settings-modal-backdrop, .settings-modal-container, .settings-modal-container *").forEach(el => {
      if (el.scrollLeft) el.scrollLeft = 0;
    });
  }

  function fitFramedMenu(popup) {
    resetSettingsScroll();
    const trigger = visibleTrigger(popup);
    const card = lockedCard(trigger);
    const popupBox = popup.classList.contains("w-max") ? popup : (popup.closest(".w-max") || popup);
    popupBox.classList.add("agy-card-fit");
    popupBox.style.setProperty("--agy-lock-w", `${card.width}px`);
    popupBox.style.setProperty("width", `${card.width}px`, "important");
    popupBox.style.setProperty("max-width", `${card.width}px`, "important");
    popupBox.style.setProperty("min-width", "0", "important");
    popupBox.style.setProperty("box-sizing", "border-box", "important");
    popupBox.style.setProperty("overflow-x", "hidden", "important");
    const shell = frameShell(popupBox);
    if (!shell.style.getPropertyValue("--agy-dx")) shell.style.setProperty("--agy-dx", "0px");
    shell.classList.add("agy-lock-pop");
    shell.style.setProperty("--agy-lock-w", `${card.width}px`);
    const rect = shell.getBoundingClientRect();
    if (rect.width < 8) return;
    const prev = parseFloat(shell.style.getPropertyValue("--agy-dx")) || 0;
    const next = Math.round(prev + card.left - rect.left);
    if (Math.abs(next - prev) >= 1) shell.style.setProperty("--agy-dx", `${next}px`);
  }

  function lockedCard(trigger) {
    const cachedLeft = trigger ? parseFloat(trigger.dataset.agyCardLeft) : NaN;
    const cachedWidth = trigger ? parseFloat(trigger.dataset.agyCardWidth) : NaN;
    if (cachedWidth >= 160 && Number.isFinite(cachedLeft)) {
      return clampLocked(cachedLeft, cachedWidth);
    }
    let cardEl = trigger ? cardByTrigger.get(trigger) : null;
    if (!cardEl?.isConnected && trigger) cardEl = findCardElement(trigger);
    if (cardEl?.isConnected) {
      const rect = cardEl.getBoundingClientRect();
      const width = cardEl.offsetWidth || rect.width;
      if (width >= 160) return clampLocked(rect.left, width);
    }
    let best = null;
    document.querySelectorAll("div.rounded-xl.border, div.border.rounded-xl").forEach(el => {
      if (el.closest("[data-base-ui-portal], [role='listbox']")) return;
      const rect = el.getBoundingClientRect();
      const width = el.offsetWidth || rect.width;
      if (width < 180 || rect.height < 36 || rect.height > window.innerHeight * 0.95) return;
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      if (!best || width < best.width) best = { left: rect.left, width };
    });
    if (best) return clampLocked(best.left, best.width);
    const view = window.visualViewport?.width || window.innerWidth;
    return { left: 8, width: Math.max(200, Math.round(view - 16)) };
  }

  function clampLocked(left, width) {
    const view = window.visualViewport?.width || window.innerWidth;
    let x = Math.round(left);
    let w = Math.round(width);
    if (x < 4) x = 4;
    if (x + w > view - 4) w = Math.round(view - 4 - x);
    if (w < 160) w = Math.max(160, Math.round(view - 16));
    if (x + w > view - 4) x = Math.max(4, Math.round(view - 4 - w));
    return { left: x, width: w };
  }

  function compactPoppers() {
    document.getElementById("agy-frame-overlay")?.remove();
    const popups = [...document.querySelectorAll(".max-w-\\[400px\\].w-max, [data-base-ui-portal] [role='listbox'], [data-base-ui-portal] [role='menu']")];
    let framed = false;
    popups.forEach(popup => {
      if (popup.closest("#agy-themed-select-overlay, #agy-language-overlay, .agy-confirmation-menu, .agy-tools-page")) return;
      if (popup.classList.contains("agy-card-lock") || popup.closest(".agy-card-lock")) return;
      if (framedSettingsMenu(popup)) {
        framed = true;
        fitFramedMenu(popup);
        return;
      }
      const rect = popup.getBoundingClientRect();
      if (rect.width < 2 && rect.height < 2) return;
      const text = popup.innerText || "";
      if (/Terminals|Терминал|Диалоги|\bbash\b|apktool/i.test(text)) return;
      const composer = (/Модель|Model/.test(text) && /Gemini|Claude/.test(text)) || /Остаток недельного|weekly limit|Остаток пятичасового/i.test(text);
      if (composer) {
        balanceHorizontally(popup);
        return;
      }
      tightenShortMenu(popup);
    });
    document.documentElement.classList.toggle("agy-frame-open", framed);
    document.documentElement.classList.remove("agy-lock-x");
  }

  function ensurePopperLoop() {
    if (popperLoop) return;
    const tick = () => {
      if (!document.querySelector("[data-base-ui-portal] [role='listbox'], [data-base-ui-portal] [role='menu']")) {
        popperLoop = 0;
        document.getElementById("agy-frame-overlay")?.remove();
        document.documentElement.classList.remove("agy-lock-x", "agy-frame-open", "agy-noscroll-x");
        return;
      }
      compactPoppers();
      popperLoop = requestAnimationFrame(tick);
    };
    popperLoop = requestAnimationFrame(tick);
  }

  function buttonLabel(button) {
    return (button?.innerText || button?.textContent || "").replace(/\s+/g, " ").trim();
  }

  function mergeDeferredSend() {
    const existing = document.querySelector("[data-agy-deferred]");
    if (existing && existing.dataset.agyLang === effective) return;
    document.querySelectorAll("[data-agy-deferred-source]").forEach(group => {
      group.hidden = false;
      group.removeAttribute("data-agy-deferred-source");
    });
    existing?.remove();
    const buttons = [...document.querySelectorAll("button")].filter(button =>
      button.offsetParent !== null &&
      button.getAttribute("role") !== "combobox" &&
      !button.closest("[role='listbox'], [role='menu'], [data-agy-deferred], [data-agy-language-setting]")
    );
    const queue = buttons.find(button => ["Queue", "В очередь"].includes(buttonLabel(button)));
    const immediate = buttons.find(button => ["Send Immediately", "Отправлять сразу"].includes(buttonLabel(button)));
    if (!queue || !immediate || queue.parentElement !== immediate.parentElement) return;
    const group = queue.parentElement;
    const row = group?.parentElement;
    if (!row) return;
    const queued = queue.getAttribute("aria-pressed") === "true" || queue.getAttribute("data-state") === "on" || /\bbg-secondary\b/.test(queue.className);
    group.dataset.agyDeferredSource = "true";
    group.hidden = true;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "agy-choice-button";
    button.dataset.agyDeferred = "true";
    button.dataset.agyNoTranslate = "true";
    button.dataset.agyLang = effective;
    const queueLabel = effective === "ru" ? "В очередь" : "Queue";
    const nowLabel = effective === "ru" ? "Отправлять сразу" : "Send Immediately";
    button.textContent = queued ? queueLabel : nowLabel;
    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      const isQueue = button.textContent === queueLabel;
      openChoiceMenu([
        { label: queueLabel, selected: isQueue, onPick: () => { button.textContent = queueLabel; if (queue.isConnected) queue.click(); } },
        { label: nowLabel, selected: !isQueue, onPick: () => { button.textContent = nowLabel; if (immediate.isConnected) immediate.click(); } }
      ], button);
    });
    row.appendChild(button);
  }

  function installGlassControls() {
    const prefs = glassPrefs();
    const label = [...document.querySelectorAll("span,div,h1,h2,h3")].find(element => hasDirectText(element, new Set(["Preset", "Предустановка"])) && element.offsetParent !== null);
    const existing = document.querySelector("[data-agy-glass-controls]");
    if (!label) {
      existing?.remove();
      return;
    }
    let anchor = label;
    for (let node = label.parentElement, depth = 0; node && depth < 8; depth += 1, node = node.parentElement) {
      const cls = typeof node.className === "string" ? node.className : "";
      if (cls.includes("rounded") && cls.includes("border")) {
        anchor = node;
        break;
      }
    }
    let box = existing;
    if (!box) {
      box = document.createElement("div");
      box.dataset.agyGlassControls = "true";
      box.dataset.agyNoTranslate = "true";
      box.className = "agy-glass-controls";
      box.innerHTML = `<label data-agy-field="transparency"><span></span><b></b><input type="range" min="0" max="100" step="1"></label><label data-agy-field="dim"><span></span><b></b><input type="range" min="0" max="100" step="1"></label>`;
      box.addEventListener("input", event => {
        const input = event.target;
        if (!(input instanceof HTMLInputElement)) return;
        const field = input.closest("[data-agy-field]")?.dataset.agyField;
        if (field === "transparency") localStorage.setItem("agy-glass-transparency", input.value);
        if (field === "dim") localStorage.setItem("agy-glass-dim", input.value);
        applyGlassPrefs();
        applyThemedOverlays();
        const value = input.parentElement?.querySelector("b");
        if (value) value.textContent = `${input.value}%`;
      });
    }
    const transparency = box.querySelector("[data-agy-field='transparency']");
    const dim = box.querySelector("[data-agy-field='dim']");
    transparency.querySelector("span").textContent = effective === "ru" ? "Прозрачность окон" : "Window transparency";
    dim.querySelector("span").textContent = effective === "ru" ? "Затемнение окон" : "Window dimming";
    const transparencyInput = transparency.querySelector("input");
    const dimInput = dim.querySelector("input");
    if (document.activeElement !== transparencyInput) transparencyInput.value = String(prefs.transparency);
    if (document.activeElement !== dimInput) dimInput.value = String(prefs.dim);
    transparency.querySelector("b").textContent = `${transparencyInput.value}%`;
    dim.querySelector("b").textContent = `${dimInput.value}%`;
    if (box.previousElementSibling !== anchor) anchor.insertAdjacentElement("afterend", box);
  }

  function repairTerminalPanel() {
    if (window.innerWidth > 800) return;
    document.querySelectorAll("[data-testid='terminal-surface']").forEach(surface => {
      let root = surface.parentElement;
      while (root && root !== document.body) {
        const type = root.style.containerType || "";
        if (type === "size" || type === "inline-size") break;
        root = root.parentElement;
      }
      if (!root || root === document.body) return;
      const panes = [...root.children];
      if (panes.length < 3) return;
      const main = panes[0];
      const sash = panes[panes.length - 2];
      const side = panes[panes.length - 1];
      side.style.setProperty("width", "0px", "important");
      side.style.setProperty("min-width", "0px", "important");
      side.style.setProperty("max-width", "0px", "important");
      side.style.setProperty("flex-basis", "0px", "important");
      side.style.setProperty("overflow", "hidden", "important");
      side.style.setProperty("visibility", "hidden", "important");
      side.style.setProperty("padding", "0", "important");
      sash.style.setProperty("display", "none", "important");
      main.style.setProperty("flex", "1 1 auto", "important");
      main.style.setProperty("width", "100%", "important");
      main.style.setProperty("max-width", "none", "important");
      main.style.setProperty("min-width", "0", "important");
      surface.style.setProperty("width", "100%", "important");
      surface.style.setProperty("max-width", "none", "important");
    });
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      translateTree(document.body);
      translateDynamicMcpCatalog();
      applyMobileLayoutFixes();
      applyThemedOverlays();
      compactPoppers();
      repairTerminalPanel();
      ensurePopperLoop();
      mergeDeferredSend();
      injectLanguageIntoGeneral();
      installGlassControls();
      applyPluginsNodeWarning();
    });
  }

  function trackVisualViewport() {
    const apply = () => {
      const viewport = window.visualViewport;
      const height = Math.round(viewport?.height || window.innerHeight);
      const width = Math.round(viewport?.width || window.innerWidth);
      document.documentElement.style.setProperty("--agy-vvh", `${height}px`);
      document.documentElement.style.setProperty("--agy-vvw", `${width}px`);
    };
    apply();
    window.visualViewport?.addEventListener("resize", apply, { passive: true });
    window.visualViewport?.addEventListener("scroll", apply, { passive: true });
    window.addEventListener("resize", apply);
  }

  function boot() {
    effective = resolveMode(mode);
    document.documentElement.lang = effective;
    document.documentElement.dataset.agyLanguage = effective;
    trackVisualViewport();
    translateTree(document.body);
    translateDynamicMcpCatalog();
    applyMobileLayoutFixes();
    applyThemedOverlays();
    installAndroidMicrophoneBridge();
    installThemedSelects();
    document.addEventListener("keydown", event => { if (event.key === "Escape") closeThemedSelect(); });
    observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["title", "aria-label", "aria-description", "placeholder", "data-placeholder", "data-tooltip-content", "value"] });
    if (localStorage.getItem(STORAGE_ONBOARDED) !== "1") showLanguageDialog(true);
  }

  window.addEventListener("languagechange", () => {
    if (mode === "system") setMode("system", false);
  });
  window.AntigravityLanguage = { getMode: () => mode, getLanguage: () => effective, setMode, open: () => showLanguageDialog(false) };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();

  // Global interceptor for external links in chat and documents
  document.addEventListener("click", function (event) {
    let target = event.target;
    while (target && target !== document.body) {
      if (target.tagName === "A" && target.href) {
        const href = target.getAttribute("href") || target.href;
        if (/^https?:\/\//i.test(href)) {
          let external = null;
          try { external = new URL(href, location.href); } catch (_) { external = null; }
          const host = external?.hostname || "";
          const inApp = !host || host === location.hostname || host === "localhost" || host === "127.0.0.1" || host === "app.antigravity.local" || host.endsWith(".androidplatform.net");
          if (!inApp) {
            event.preventDefault();
            event.stopPropagation();
            if (window.Android && typeof window.Android.openUrl === "function") {
              window.Android.openUrl(href);
            } else {
              window.open(href, "_blank");
            }
            return;
          }
        }
      }
      target = target.parentElement;
    }
  }, true);

})();
