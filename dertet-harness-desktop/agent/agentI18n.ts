// Backend-generated user-facing text (slash-command replies, agent activity labels) — mirrors
// src/i18n.ts's language set so replies match whatever language the renderer is currently showing,
// instead of always being Ukrainian regardless of the user's chosen UI language.

export type AgentLang = "uk" | "en" | "ru" | "pt" | "pl" | "kk" | "ro" | "de" | "fr";
export const AGENT_LANGS: AgentLang[] = ["uk", "en", "ru", "pt", "pl", "kk", "ro", "de", "fr"];

type Dict = Record<string, string>;

const HELP_UK =
  "Доступні команди:\n" +
  "/help, /commands — цей список\n" +
  "/status, /tokens — оцінка токенів + серія використання\n" +
  "/clear, /reset — очистити історію цього чату\n" +
  "/compact — стиснути історію в короткий підсумок\n" +
  "/model, /provider — поточний провайдер і модель\n" +
  "/memory — показати, що агент запам'ятав про тебе\n" +
  "/remember <текст> — вручну додати факт у пам'ять\n" +
  "/forget — стерти всю пам'ять про тебе\n" +
  "/lessons — показати вивчені уроки з минулих помилок\n" +
  "/forget-lessons — стерти уроки\n" +
  "/folders, /pwd — прикріплені папки проєкту\n" +
  "/mode — поточний режим (default/plan/auto)\n" +
  "/plan, /auto, /default — перемкнути режим\n" +
  "/rename <текст> — перейменувати цю сесію\n" +
  "/system — показати кастомний системний промпт із налаштувань\n" +
  "/whoami — зведення про цю сесію (модель, режим, папки)\n" +
  "/export — зберегти цей чат у .md файл\n" +
  "/history — історія інших сесій у цій самій папці проєкту\n" +
  "/doctor — перевірка стану (ключ, папки, файли)\n" +
  "/version — версія застосунку\n" +
  "/bug — як повідомити про баг\n" +
  "/plsfix [текст] — агент одразу глибоко досліджує й фіксить, без уточнюючих питань";

const HELP_EN =
  "Available commands:\n" +
  "/help, /commands — this list\n" +
  "/status, /tokens — token estimate + Dertet Code usage streak\n" +
  "/clear, /reset — clear this chat's history\n" +
  "/compact — compress the history into a short summary\n" +
  "/model, /provider — current provider and model\n" +
  "/memory — show what the agent has remembered about you\n" +
  "/remember <text> — manually add a fact to memory\n" +
  "/forget — wipe all memory about you\n" +
  "/lessons — show lessons learned from past mistakes\n" +
  "/forget-lessons — clear the lessons\n" +
  "/folders, /pwd — folders attached to this project\n" +
  "/mode — current mode (default/plan/auto)\n" +
  "/plan, /auto, /default — switch mode\n" +
  "/rename <text> — rename this session\n" +
  "/system — show the custom system prompt from settings\n" +
  "/whoami — summary of this session (model, mode, folders)\n" +
  "/export — save this chat to a .md file\n" +
  "/history — history from other sessions in this same project folder\n" +
  "/doctor — health check (key, folders, files)\n" +
  "/version — app version\n" +
  "/bug — how to report a bug\n" +
  "/plsfix [text] — the agent investigates deeply and fixes immediately, no clarifying questions";

const HELP_RU =
  "Доступные команды:\n" +
  "/help, /commands — этот список\n" +
  "/status, /tokens — оценка токенов + серия использования\n" +
  "/clear, /reset — очистить историю этого чата\n" +
  "/compact — сжать историю в краткий итог\n" +
  "/model, /provider — текущий провайдер и модель\n" +
  "/memory — показать, что агент запомнил о тебе\n" +
  "/remember <текст> — вручную добавить факт в память\n" +
  "/forget — стереть всю память о тебе\n" +
  "/lessons — показать усвоенные уроки из прошлых ошибок\n" +
  "/forget-lessons — стереть уроки\n" +
  "/folders, /pwd — привязанные папки проекта\n" +
  "/mode — текущий режим (default/plan/auto)\n" +
  "/plan, /auto, /default — переключить режим\n" +
  "/rename <текст> — переименовать эту сессию\n" +
  "/system — показать кастомный системный промпт из настроек\n" +
  "/whoami — сводка об этой сессии (модель, режим, папки)\n" +
  "/export — сохранить этот чат в .md файл\n" +
  "/history — история других сессий в этой же папке проекта\n" +
  "/doctor — проверка состояния (ключ, папки, файлы)\n" +
  "/version — версия приложения\n" +
  "/bug — как сообщить о баге\n" +
  "/plsfix [текст] — агент сразу глубоко разбирается и чинит, без уточняющих вопросов";

const HELP_PT =
  "Comandos disponíveis:\n" +
  "/help, /commands — esta lista\n" +
  "/status, /tokens — estimativa de tokens + sequência de uso\n" +
  "/clear, /reset — limpar o histórico deste chat\n" +
  "/compact — resumir o histórico\n" +
  "/model, /provider — provedor e modelo atuais\n" +
  "/memory — mostrar o que o agente lembra sobre você\n" +
  "/remember <texto> — adicionar manualmente um fato à memória\n" +
  "/forget — apagar toda a memória sobre você\n" +
  "/lessons — mostrar lições aprendidas de erros anteriores\n" +
  "/forget-lessons — apagar as lições\n" +
  "/folders, /pwd — pastas anexadas a este projeto\n" +
  "/mode — modo atual (default/plan/auto)\n" +
  "/plan, /auto, /default — trocar de modo\n" +
  "/rename <texto> — renomear esta sessão\n" +
  "/system — mostrar o prompt de sistema personalizado das configurações\n" +
  "/whoami — resumo desta sessão (modelo, modo, pastas)\n" +
  "/export — salvar este chat em um arquivo .md\n" +
  "/history — histórico de outras sessões nesta mesma pasta do projeto\n" +
  "/doctor — verificação de estado (chave, pastas, arquivos)\n" +
  "/version — versão do aplicativo\n" +
  "/bug — como reportar um bug\n" +
  "/plsfix [texto] — o agente investiga a fundo e corrige na hora, sem perguntas";

const HELP_PL =
  "Dostępne polecenia:\n" +
  "/help, /commands — ta lista\n" +
  "/status, /tokens — szacunek tokenów + seria użycia\n" +
  "/clear, /reset — wyczyść historię tego czatu\n" +
  "/compact — skróć historię do krótkiego podsumowania\n" +
  "/model, /provider — bieżący dostawca i model\n" +
  "/memory — pokaż, co agent zapamiętał o Tobie\n" +
  "/remember <tekst> — ręcznie dodaj fakt do pamięci\n" +
  "/forget — wymaż całą pamięć o Tobie\n" +
  "/lessons — pokaż wnioski z wcześniejszych błędów\n" +
  "/forget-lessons — wymaż wnioski\n" +
  "/folders, /pwd — foldery dołączone do tego projektu\n" +
  "/mode — bieżący tryb (default/plan/auto)\n" +
  "/plan, /auto, /default — przełącz tryb\n" +
  "/rename <tekst> — zmień nazwę tej sesji\n" +
  "/system — pokaż niestandardowy prompt systemowy z ustawień\n" +
  "/whoami — podsumowanie tej sesji (model, tryb, foldery)\n" +
  "/export — zapisz ten czat do pliku .md\n" +
  "/history — historia innych sesji w tym samym folderze projektu\n" +
  "/doctor — sprawdzenie stanu (klucz, foldery, pliki)\n" +
  "/version — wersja aplikacji\n" +
  "/bug — jak zgłosić błąd\n" +
  "/plsfix [tekst] — agent od razu dogłębnie bada i naprawia, bez pytań";

const HELP_KK =
  "Қолжетімді командалар:\n" +
  "/help, /commands — осы тізім\n" +
  "/status, /tokens — токен бағасы + пайдалану сериясы\n" +
  "/clear, /reset — осы чаттың тарихын тазарту\n" +
  "/compact — тарихты қысқаша қорытындыға сығу\n" +
  "/model, /provider — ағымдағы провайдер мен модель\n" +
  "/memory — агент сен туралы не есте сақтағанын көрсету\n" +
  "/remember <мәтін> — жадыға факт қолмен қосу\n" +
  "/forget — сен туралы барлық жадты өшіру\n" +
  "/lessons — өткен қателерден алынған сабақтарды көрсету\n" +
  "/forget-lessons — сабақтарды өшіру\n" +
  "/folders, /pwd — жобаға тіркелген қалталар\n" +
  "/mode — ағымдағы режим (default/plan/auto)\n" +
  "/plan, /auto, /default — режимді ауыстыру\n" +
  "/rename <мәтін> — осы сессияны атын өзгерту\n" +
  "/system — баптаулардағы жеке жүйелік промптты көрсету\n" +
  "/whoami — осы сессия туралы қысқаша ақпарат (модель, режим, қалталар)\n" +
  "/export — осы чатты .md файлына сақтау\n" +
  "/history — осы жоба қалтасындағы басқа сессиялардың тарихы\n" +
  "/doctor — күй тексеруі (кілт, қалталар, файлдар)\n" +
  "/version — қолданба нұсқасы\n" +
  "/bug — қате туралы қалай хабарлау керек\n" +
  "/plsfix [мәтін] — агент бірден терең зерттеп, сұрақсыз түзетеді";

const HELP_RO =
  "Comenzi disponibile:\n" +
  "/help, /commands — această listă\n" +
  "/status, /tokens — estimare token-uri + serie de utilizare\n" +
  "/clear, /reset — șterge istoricul acestui chat\n" +
  "/compact — comprimă istoricul într-un rezumat scurt\n" +
  "/model, /provider — furnizorul și modelul curent\n" +
  "/memory — arată ce a reținut agentul despre tine\n" +
  "/remember <text> — adaugă manual un fapt în memorie\n" +
  "/forget — șterge toată memoria despre tine\n" +
  "/lessons — arată lecțiile învățate din greșeli trecute\n" +
  "/forget-lessons — șterge lecțiile\n" +
  "/folders, /pwd — folderele atașate acestui proiect\n" +
  "/mode — modul curent (default/plan/auto)\n" +
  "/plan, /auto, /default — schimbă modul\n" +
  "/rename <text> — redenumește această sesiune\n" +
  "/system — arată promptul de sistem personalizat din setări\n" +
  "/whoami — rezumatul acestei sesiuni (model, mod, foldere)\n" +
  "/export — salvează acest chat într-un fișier .md\n" +
  "/history — istoricul altor sesiuni din același folder de proiect\n" +
  "/doctor — verificare de stare (cheie, foldere, fișiere)\n" +
  "/version — versiunea aplicației\n" +
  "/bug — cum să raportezi o eroare\n" +
  "/plsfix [text] — agentul investighează profund și rezolvă imediat, fără întrebări";

const HELP_DE =
  "Verfügbare Befehle:\n" +
  "/help, /commands — diese Liste\n" +
  "/status, /tokens — Token-Schätzung + Nutzungsserie\n" +
  "/clear, /reset — Verlauf dieses Chats löschen\n" +
  "/compact — Verlauf zu einer kurzen Zusammenfassung komprimieren\n" +
  "/model, /provider — aktueller Anbieter und Modell\n" +
  "/memory — zeigen, was sich der Agent über dich gemerkt hat\n" +
  "/remember <Text> — manuell eine Tatsache im Gedächtnis speichern\n" +
  "/forget — alle Erinnerungen über dich löschen\n" +
  "/lessons — gelernte Lektionen aus früheren Fehlern anzeigen\n" +
  "/forget-lessons — Lektionen löschen\n" +
  "/folders, /pwd — mit diesem Projekt verknüpfte Ordner\n" +
  "/mode — aktueller Modus (default/plan/auto)\n" +
  "/plan, /auto, /default — Modus wechseln\n" +
  "/rename <Text> — diese Sitzung umbenennen\n" +
  "/system — den benutzerdefinierten System-Prompt aus den Einstellungen anzeigen\n" +
  "/whoami — Zusammenfassung dieser Sitzung (Modell, Modus, Ordner)\n" +
  "/export — diesen Chat als .md-Datei speichern\n" +
  "/history — Verlauf anderer Sitzungen im selben Projektordner\n" +
  "/doctor — Statusprüfung (Schlüssel, Ordner, Dateien)\n" +
  "/version — App-Version\n" +
  "/bug — wie man einen Fehler meldet\n" +
  "/plsfix [Text] — der Agent untersucht sofort gründlich und behebt es, ohne Rückfragen";

const HELP_FR =
  "Commandes disponibles :\n" +
  "/help, /commands — cette liste\n" +
  "/status, /tokens — estimation des tokens + série d'utilisation\n" +
  "/clear, /reset — effacer l'historique de ce chat\n" +
  "/compact — condenser l'historique en un court résumé\n" +
  "/model, /provider — fournisseur et modèle actuels\n" +
  "/memory — afficher ce que l'agent a retenu de toi\n" +
  "/remember <texte> — ajouter manuellement un fait à la mémoire\n" +
  "/forget — effacer toute la mémoire te concernant\n" +
  "/lessons — afficher les leçons tirées d'erreurs passées\n" +
  "/forget-lessons — effacer les leçons\n" +
  "/folders, /pwd — dossiers attachés à ce projet\n" +
  "/mode — mode actuel (default/plan/auto)\n" +
  "/plan, /auto, /default — changer de mode\n" +
  "/rename <texte> — renommer cette session\n" +
  "/system — afficher le prompt système personnalisé des paramètres\n" +
  "/whoami — résumé de cette session (modèle, mode, dossiers)\n" +
  "/export — enregistrer ce chat dans un fichier .md\n" +
  "/history — historique des autres sessions dans ce même dossier de projet\n" +
  "/doctor — vérification d'état (clé, dossiers, fichiers)\n" +
  "/version — version de l'application\n" +
  "/bug — comment signaler un bug\n" +
  "/plsfix [texte] — l'agent enquête en profondeur et corrige immédiatement, sans questions";

const BUG_UK =
  "Якщо щось працює не так — опиши проблему в наступному повідомленні (що робив(-ла), що очікував(-ла), " +
  "що сталось насправді) і, якщо це стосується коду, спробуй /plsfix, щоб агент одразу розібрався і " +
  "виправив без зайвих уточнень.";
const BUG_EN =
  "If something's broken — describe the problem in your next message (what you were doing, what you " +
  "expected, what actually happened), and if it's a code issue, try /plsfix so the agent investigates " +
  "and fixes it right away without extra questions.";
const BUG_RU =
  "Если что-то работает не так — опиши проблему в следующем сообщении (что делал(-а), что ожидал(-а), " +
  "что произошло на самом деле), и если это касается кода, попробуй /plsfix, чтобы агент сразу разобрался " +
  "и исправил без лишних уточнений.";
const BUG_PT =
  "Se algo não estiver funcionando — descreva o problema na próxima mensagem (o que estava fazendo, o " +
  "que esperava, o que realmente aconteceu) e, se for sobre código, tente /plsfix para o agente investigar " +
  "e corrigir na hora, sem perguntas extras.";
const BUG_PL =
  "Jeśli coś nie działa — opisz problem w następnej wiadomości (co robiłeś/-aś, czego oczekiwałeś/-aś, co " +
  "faktycznie się stało), a jeśli dotyczy to kodu, spróbuj /plsfix, aby agent od razu to zbadał i naprawił " +
  "bez dodatkowych pytań.";
const BUG_KK =
  "Егер бірдеңе дұрыс жұмыс істемесе — келесі хабарламада мәселені сипатта (не істеп жатқаныңды, нені " +
  "күткеніңді, шын мәнінде не болғанын), ал бұл кодқа қатысты болса, /plsfix көмегін көр — агент бірден " +
  "зерттеп, сұрақсыз түзетеді.";
const BUG_RO =
  "Dacă ceva nu funcționează — descrie problema în următorul mesaj (ce făceai, la ce te așteptai, ce s-a " +
  "întâmplat de fapt) și, dacă ține de cod, încearcă /plsfix ca agentul să investigheze și să rezolve " +
  "imediat, fără întrebări suplimentare.";
const BUG_DE =
  "Wenn etwas nicht funktioniert — beschreibe das Problem in deiner nächsten Nachricht (was du getan " +
  "hast, was du erwartet hast, was tatsächlich passiert ist), und bei einem Code-Problem probiere /plsfix, " +
  "damit der Agent sofort ermittelt und es ohne Rückfragen behebt.";
const BUG_FR =
  "Si quelque chose ne fonctionne pas — décris le problème dans ton prochain message (ce que tu faisais, " +
  "ce que tu attendais, ce qui s'est réellement passé), et si ça concerne le code, essaie /plsfix pour que " +
  "l'agent enquête et corrige immédiatement, sans questions supplémentaires.";

const DICT: Record<AgentLang, Dict> = {
  uk: {
    slash_help: HELP_UK,
    slash_model: "Провайдер: {0}\nМодель: {1}",
    slash_status: "Оцінка вхідних токенів у цьому чаті: ~{0}\nОцінка вихідних токенів у цьому чаті: ~{1}\nСерія використання Dertet Code: {2} дн. поспіль\n(оцінка токенів приблизна, не точний підрахунок провайдера)",
    slash_clear_done: "Історію цього чату очищено.",
    slash_compact_empty: "Нічого стискати — історія порожня.",
    slash_compact_prefix: "📎 Історію стиснуто в підсумок:\n\n{0}",
    slash_compact_failed: "Не вдалося стиснути історію: {0}",
    slash_memory_disabled: "Персоналізація вимкнена в налаштуваннях — агент нічого не запам'ятовує.",
    slash_memory_list: "Що агент запам'ятав про тебе:\n{0}",
    slash_memory_empty: "Поки що агент нічого не запам'ятав.",
    slash_remember_missing_arg: "Вкажи, що запам'ятати: /remember текст факту.",
    slash_remember_done: "Запам'ятав: {0}",
    slash_forget_done: "Всю пам'ять про тебе стерто.",
    slash_lessons_list: "Вивчені уроки з минулих помилок:\n{0}",
    slash_lessons_empty: "Поки що жодних уроків не записано.",
    slash_forget_lessons_done: "Уроки з минулих помилок стерто.",
    slash_folders_list: "Прикріплені папки:\n{0}",
    slash_folders_empty: "Жодної папки не прикріплено до цієї сесії.",
    slash_mode_current: "Поточний режим: {0}",
    slash_mode_switched: "Режим перемкнуто на: {0}",
    slash_rename_missing_arg: "Вкажи нову назву: /rename нова назва сесії.",
    slash_rename_done: "Сесію перейменовано на: {0}",
    slash_system_prompt: "Кастомний системний промпт із налаштувань:\n\n{0}",
    slash_system_prompt_empty: "Кастомний системний промпт не заданий у налаштуваннях.",
    slash_whoami: "Тип сесії: {0}\nПровайдер: {1}\nМодель: {2}\nРежим: {3}\nПапок прикріплено: {4}",
    slash_export_done: "Чат збережено у файл:\n{0}",
    slash_export_failed: "Не вдалося зберегти чат: {0}",
    slash_history_body: "Історія інших сесій у цій папці проєкту:\n\n{0}",
    slash_history_empty: "Немає збереженої історії інших сесій для цієї папки (або папка не прикріплена).",
    slash_doctor_header: "Перевірка стану сесії:\n{0}",
    slash_doctor_key_ok: "✅ API ключ заданий",
    slash_doctor_key_warn: "⚠️ API ключ порожній (може бути ок для локальної моделі)",
    slash_doctor_no_folders: "⚠️ Жодної папки проєкту не прикріплено",
    slash_doctor_folder_ok: "✅ Папка існує: {0}",
    slash_doctor_folder_missing: "❌ Папку не знайдено на диску: {0}",
    slash_version: "Dertet Harness Desktop v{0}",
    slash_bug: BUG_UK,
    agent_step_limit_reached: "Досягнуто ліміту кроків агента для цього повідомлення. Напишіть ще раз, щоб продовжити.",
    activity_thinking: "Думаю…",
    activity_search: "Шукаю «{0}»…",
    activity_open: "Відкриваю {0}…",
    activity_browser_read: "Читаю сторінку…",
    activity_browser_find: "Шукаю на сторінці «{0}»…",
    activity_browser_click: "Клікаю на сторінці…",
    activity_browser_type: "Вводжу текст на сторінці…",
    activity_browser_screenshot: "Роблю скріншот сторінки…",
    activity_browser_close: "Закриваю вкладку браузера…",
    activity_read_file: "Читаю {0}…",
    activity_list_dir: "Переглядаю {0}…",
    activity_write_file: "Записую {0}…",
    activity_edit_file: "Редагую {0}…",
    activity_run_command: "Виконую команду…",
    activity_update_dertetcode_md: "Оновлюю DertetCode.md…",
    activity_ask_user_choice: "Питаю користувача…",
    activity_video_probe: "Перевіряю відео {0}…",
    activity_video_add_audio: "Додаю аудіо до відео…",
    activity_video_trim: "Обрізаю відео…",
    activity_video_concat: "Склеюю відео…",
    activity_video_from_images: "Збираю відео з зображень…",
    activity_computer_use: "Керую екраном…",
    activity_generic: "Виконую {0}…"
  },
  en: {
    slash_help: HELP_EN,
    slash_model: "Provider: {0}\nModel: {1}",
    slash_status: "Estimated input tokens in this chat: ~{0}\nEstimated output tokens in this chat: ~{1}\nDertet Code usage streak: {2} day(s) in a row\n(token estimate is approximate, not the provider's exact count)",
    slash_clear_done: "This chat's history has been cleared.",
    slash_compact_empty: "Nothing to compress — history is empty.",
    slash_compact_prefix: "📎 History compressed into a summary:\n\n{0}",
    slash_compact_failed: "Failed to compress history: {0}",
    slash_memory_disabled: "Personalization is disabled in settings — the agent isn't remembering anything.",
    slash_memory_list: "What the agent has remembered about you:\n{0}",
    slash_memory_empty: "The agent hasn't remembered anything yet.",
    slash_remember_missing_arg: "Say what to remember: /remember fact text.",
    slash_remember_done: "Remembered: {0}",
    slash_forget_done: "All memory about you has been erased.",
    slash_lessons_list: "Lessons learned from past mistakes:\n{0}",
    slash_lessons_empty: "No lessons recorded yet.",
    slash_forget_lessons_done: "Lessons from past mistakes have been cleared.",
    slash_folders_list: "Attached folders:\n{0}",
    slash_folders_empty: "No folder is attached to this session.",
    slash_mode_current: "Current mode: {0}",
    slash_mode_switched: "Mode switched to: {0}",
    slash_rename_missing_arg: "Give it a new name: /rename new session name.",
    slash_rename_done: "Session renamed to: {0}",
    slash_system_prompt: "Custom system prompt from settings:\n\n{0}",
    slash_system_prompt_empty: "No custom system prompt set in settings.",
    slash_whoami: "Session type: {0}\nProvider: {1}\nModel: {2}\nMode: {3}\nFolders attached: {4}",
    slash_export_done: "Chat saved to file:\n{0}",
    slash_export_failed: "Failed to save chat: {0}",
    slash_history_body: "History from other sessions in this project folder:\n\n{0}",
    slash_history_empty: "No saved history from other sessions for this folder (or no folder is attached).",
    slash_doctor_header: "Session health check:\n{0}",
    slash_doctor_key_ok: "✅ API key is set",
    slash_doctor_key_warn: "⚠️ API key is empty (may be fine for a local model)",
    slash_doctor_no_folders: "⚠️ No project folder attached",
    slash_doctor_folder_ok: "✅ Folder exists: {0}",
    slash_doctor_folder_missing: "❌ Folder not found on disk: {0}",
    slash_version: "Dertet Harness Desktop v{0}",
    slash_bug: BUG_EN,
    agent_step_limit_reached: "Reached the agent's step limit for this message. Send another message to continue.",
    activity_thinking: "Thinking…",
    activity_search: "Searching \"{0}\"…",
    activity_open: "Opening {0}…",
    activity_browser_read: "Reading the page…",
    activity_browser_find: "Searching the page for \"{0}\"…",
    activity_browser_click: "Clicking on the page…",
    activity_browser_type: "Typing on the page…",
    activity_browser_screenshot: "Taking a screenshot of the page…",
    activity_browser_close: "Closing the browser tab…",
    activity_read_file: "Reading {0}…",
    activity_list_dir: "Browsing {0}…",
    activity_write_file: "Writing {0}…",
    activity_edit_file: "Editing {0}…",
    activity_run_command: "Running a command…",
    activity_update_dertetcode_md: "Updating DertetCode.md…",
    activity_ask_user_choice: "Asking you a question…",
    activity_video_probe: "Inspecting video {0}…",
    activity_video_add_audio: "Adding audio to the video…",
    activity_video_trim: "Trimming the video…",
    activity_video_concat: "Concatenating video clips…",
    activity_video_from_images: "Assembling a video from images…",
    activity_computer_use: "Controlling the screen…",
    activity_generic: "Running {0}…"
  },
  ru: {
    slash_help: HELP_RU,
    slash_model: "Провайдер: {0}\nМодель: {1}",
    slash_status: "Оценка входных токенов в этом чате: ~{0}\nОценка выходных токенов в этом чате: ~{1}\nСерия использования Dertet Code: {2} дн. подряд\n(оценка токенов приблизительная, не точный подсчёт провайдера)",
    slash_clear_done: "История этого чата очищена.",
    slash_compact_empty: "Нечего сжимать — история пуста.",
    slash_compact_prefix: "📎 История сжата в итог:\n\n{0}",
    slash_compact_failed: "Не удалось сжать историю: {0}",
    slash_memory_disabled: "Персонализация отключена в настройках — агент ничего не запоминает.",
    slash_memory_list: "Что агент запомнил о тебе:\n{0}",
    slash_memory_empty: "Пока агент ничего не запомнил.",
    slash_remember_missing_arg: "Укажи, что запомнить: /remember текст факта.",
    slash_remember_done: "Запомнил: {0}",
    slash_forget_done: "Вся память о тебе стёрта.",
    slash_lessons_list: "Усвоенные уроки из прошлых ошибок:\n{0}",
    slash_lessons_empty: "Пока никаких уроков не записано.",
    slash_forget_lessons_done: "Уроки из прошлых ошибок стёрты.",
    slash_folders_list: "Привязанные папки:\n{0}",
    slash_folders_empty: "К этой сессии не привязано ни одной папки.",
    slash_mode_current: "Текущий режим: {0}",
    slash_mode_switched: "Режим переключён на: {0}",
    slash_rename_missing_arg: "Укажи новое имя: /rename новое имя сессии.",
    slash_rename_done: "Сессия переименована в: {0}",
    slash_system_prompt: "Кастомный системный промпт из настроек:\n\n{0}",
    slash_system_prompt_empty: "Кастомный системный промпт не задан в настройках.",
    slash_whoami: "Тип сессии: {0}\nПровайдер: {1}\nМодель: {2}\nРежим: {3}\nПривязано папок: {4}",
    slash_export_done: "Чат сохранён в файл:\n{0}",
    slash_export_failed: "Не удалось сохранить чат: {0}",
    slash_history_body: "История других сессий в этой же папке проекта:\n\n{0}",
    slash_history_empty: "Нет сохранённой истории других сессий для этой папки (или папка не привязана).",
    slash_doctor_header: "Проверка состояния сессии:\n{0}",
    slash_doctor_key_ok: "✅ API-ключ задан",
    slash_doctor_key_warn: "⚠️ API-ключ пуст (может быть нормально для локальной модели)",
    slash_doctor_no_folders: "⚠️ Ни одна папка проекта не привязана",
    slash_doctor_folder_ok: "✅ Папка существует: {0}",
    slash_doctor_folder_missing: "❌ Папка не найдена на диске: {0}",
    slash_version: "Dertet Harness Desktop v{0}",
    slash_bug: BUG_RU,
    agent_step_limit_reached: "Достигнут лимит шагов агента для этого сообщения. Напишите ещё раз, чтобы продолжить.",
    activity_thinking: "Думаю…",
    activity_search: "Ищу «{0}»…",
    activity_open: "Открываю {0}…",
    activity_browser_read: "Читаю страницу…",
    activity_browser_find: "Ищу на странице «{0}»…",
    activity_browser_click: "Кликаю на странице…",
    activity_browser_type: "Ввожу текст на странице…",
    activity_browser_screenshot: "Делаю скриншот страницы…",
    activity_browser_close: "Закрываю вкладку браузера…",
    activity_read_file: "Читаю {0}…",
    activity_list_dir: "Просматриваю {0}…",
    activity_write_file: "Записываю {0}…",
    activity_edit_file: "Редактирую {0}…",
    activity_run_command: "Выполняю команду…",
    activity_update_dertetcode_md: "Обновляю DertetCode.md…",
    activity_ask_user_choice: "Спрашиваю пользователя…",
    activity_video_probe: "Проверяю видео {0}…",
    activity_video_add_audio: "Добавляю аудио к видео…",
    activity_video_trim: "Обрезаю видео…",
    activity_video_concat: "Склеиваю видео…",
    activity_video_from_images: "Собираю видео из изображений…",
    activity_computer_use: "Управляю экраном…",
    activity_generic: "Выполняю {0}…"
  },
  pt: {
    slash_help: HELP_PT,
    slash_model: "Provedor: {0}\nModelo: {1}",
    slash_status: "Tokens de entrada estimados neste chat: ~{0}\nTokens de saída estimados neste chat: ~{1}\nSequência de uso do Dertet Code: {2} dia(s) seguido(s)\n(estimativa aproximada, não a contagem exata do provedor)",
    slash_clear_done: "O histórico deste chat foi limpo.",
    slash_compact_empty: "Nada para compactar — o histórico está vazio.",
    slash_compact_prefix: "📎 Histórico compactado em um resumo:\n\n{0}",
    slash_compact_failed: "Falha ao compactar o histórico: {0}",
    slash_memory_disabled: "A personalização está desativada nas configurações — o agente não está memorizando nada.",
    slash_memory_list: "O que o agente lembra sobre você:\n{0}",
    slash_memory_empty: "O agente ainda não memorizou nada.",
    slash_remember_missing_arg: "Diga o que lembrar: /remember texto do fato.",
    slash_remember_done: "Memorizado: {0}",
    slash_forget_done: "Toda a memória sobre você foi apagada.",
    slash_lessons_list: "Lições aprendidas de erros anteriores:\n{0}",
    slash_lessons_empty: "Nenhuma lição registrada ainda.",
    slash_forget_lessons_done: "As lições de erros anteriores foram apagadas.",
    slash_folders_list: "Pastas anexadas:\n{0}",
    slash_folders_empty: "Nenhuma pasta está anexada a esta sessão.",
    slash_mode_current: "Modo atual: {0}",
    slash_mode_switched: "Modo alterado para: {0}",
    slash_rename_missing_arg: "Informe um novo nome: /rename novo nome da sessão.",
    slash_rename_done: "Sessão renomeada para: {0}",
    slash_system_prompt: "Prompt de sistema personalizado das configurações:\n\n{0}",
    slash_system_prompt_empty: "Nenhum prompt de sistema personalizado definido nas configurações.",
    slash_whoami: "Tipo de sessão: {0}\nProvedor: {1}\nModelo: {2}\nModo: {3}\nPastas anexadas: {4}",
    slash_export_done: "Chat salvo no arquivo:\n{0}",
    slash_export_failed: "Falha ao salvar o chat: {0}",
    slash_history_body: "Histórico de outras sessões nesta mesma pasta do projeto:\n\n{0}",
    slash_history_empty: "Nenhum histórico salvo de outras sessões para esta pasta (ou nenhuma pasta anexada).",
    slash_doctor_header: "Verificação de estado da sessão:\n{0}",
    slash_doctor_key_ok: "✅ Chave de API definida",
    slash_doctor_key_warn: "⚠️ Chave de API vazia (pode ser normal para um modelo local)",
    slash_doctor_no_folders: "⚠️ Nenhuma pasta de projeto anexada",
    slash_doctor_folder_ok: "✅ A pasta existe: {0}",
    slash_doctor_folder_missing: "❌ Pasta não encontrada no disco: {0}",
    slash_version: "Dertet Harness Desktop v{0}",
    slash_bug: BUG_PT,
    agent_step_limit_reached: "Limite de etapas do agente atingido para esta mensagem. Envie outra mensagem para continuar.",
    activity_thinking: "Pensando…",
    activity_search: "Pesquisando \"{0}\"…",
    activity_open: "Abrindo {0}…",
    activity_browser_read: "Lendo a página…",
    activity_browser_find: "Procurando na página por \"{0}\"…",
    activity_browser_click: "Clicando na página…",
    activity_browser_type: "Digitando na página…",
    activity_browser_screenshot: "Tirando uma captura de tela da página…",
    activity_browser_close: "Fechando a aba do navegador…",
    activity_read_file: "Lendo {0}…",
    activity_list_dir: "Explorando {0}…",
    activity_write_file: "Escrevendo {0}…",
    activity_edit_file: "Editando {0}…",
    activity_run_command: "Executando um comando…",
    activity_update_dertetcode_md: "Atualizando o DertetCode.md…",
    activity_ask_user_choice: "Perguntando a você…",
    activity_video_probe: "Inspecionando o vídeo {0}…",
    activity_video_add_audio: "Adicionando áudio ao vídeo…",
    activity_video_trim: "Cortando o vídeo…",
    activity_video_concat: "Unindo os clipes de vídeo…",
    activity_video_from_images: "Montando um vídeo a partir de imagens…",
    activity_computer_use: "Controlando a tela…",
    activity_generic: "Executando {0}…"
  },
  pl: {
    slash_help: HELP_PL,
    slash_model: "Dostawca: {0}\nModel: {1}",
    slash_status: "Szacowane tokeny wejściowe w tym czacie: ~{0}\nSzacowane tokeny wyjściowe w tym czacie: ~{1}\nSeria użycia Dertet Code: {2} dzień/dni z rzędu\n(szacunek przybliżony, nie dokładna liczba dostawcy)",
    slash_clear_done: "Historia tego czatu została wyczyszczona.",
    slash_compact_empty: "Nie ma co kompresować — historia jest pusta.",
    slash_compact_prefix: "📎 Historia skompresowana do podsumowania:\n\n{0}",
    slash_compact_failed: "Nie udało się skompresować historii: {0}",
    slash_memory_disabled: "Personalizacja jest wyłączona w ustawieniach — agent niczego nie zapamiętuje.",
    slash_memory_list: "Co agent zapamiętał o Tobie:\n{0}",
    slash_memory_empty: "Agent jeszcze niczego nie zapamiętał.",
    slash_remember_missing_arg: "Podaj, co zapamiętać: /remember treść faktu.",
    slash_remember_done: "Zapamiętano: {0}",
    slash_forget_done: "Cała pamięć o Tobie została wymazana.",
    slash_lessons_list: "Wnioski wyciągnięte z wcześniejszych błędów:\n{0}",
    slash_lessons_empty: "Nie zapisano jeszcze żadnych wniosków.",
    slash_forget_lessons_done: "Wnioski z wcześniejszych błędów zostały wymazane.",
    slash_folders_list: "Dołączone foldery:\n{0}",
    slash_folders_empty: "Do tej sesji nie dołączono żadnego folderu.",
    slash_mode_current: "Bieżący tryb: {0}",
    slash_mode_switched: "Tryb przełączony na: {0}",
    slash_rename_missing_arg: "Podaj nową nazwę: /rename nowa nazwa sesji.",
    slash_rename_done: "Sesję zmieniono na: {0}",
    slash_system_prompt: "Niestandardowy prompt systemowy z ustawień:\n\n{0}",
    slash_system_prompt_empty: "Nie ustawiono niestandardowego promptu systemowego w ustawieniach.",
    slash_whoami: "Typ sesji: {0}\nDostawca: {1}\nModel: {2}\nTryb: {3}\nDołączonych folderów: {4}",
    slash_export_done: "Czat zapisano do pliku:\n{0}",
    slash_export_failed: "Nie udało się zapisać czatu: {0}",
    slash_history_body: "Historia innych sesji w tym samym folderze projektu:\n\n{0}",
    slash_history_empty: "Brak zapisanej historii innych sesji dla tego folderu (lub nie dołączono folderu).",
    slash_doctor_header: "Sprawdzenie stanu sesji:\n{0}",
    slash_doctor_key_ok: "✅ Klucz API jest ustawiony",
    slash_doctor_key_warn: "⚠️ Klucz API jest pusty (może być w porządku dla modelu lokalnego)",
    slash_doctor_no_folders: "⚠️ Nie dołączono żadnego folderu projektu",
    slash_doctor_folder_ok: "✅ Folder istnieje: {0}",
    slash_doctor_folder_missing: "❌ Nie znaleziono folderu na dysku: {0}",
    slash_version: "Dertet Harness Desktop v{0}",
    slash_bug: BUG_PL,
    agent_step_limit_reached: "Osiągnięto limit kroków agenta dla tej wiadomości. Napisz ponownie, aby kontynuować.",
    activity_thinking: "Myślę…",
    activity_search: "Szukam „{0}”…",
    activity_open: "Otwieram {0}…",
    activity_browser_read: "Czytam stronę…",
    activity_browser_find: "Szukam na stronie „{0}”…",
    activity_browser_click: "Klikam na stronie…",
    activity_browser_type: "Wpisuję tekst na stronie…",
    activity_browser_screenshot: "Robię zrzut ekranu strony…",
    activity_browser_close: "Zamykam kartę przeglądarki…",
    activity_read_file: "Czytam {0}…",
    activity_list_dir: "Przeglądam {0}…",
    activity_write_file: "Zapisuję {0}…",
    activity_edit_file: "Edytuję {0}…",
    activity_run_command: "Wykonuję polecenie…",
    activity_update_dertetcode_md: "Aktualizuję DertetCode.md…",
    activity_ask_user_choice: "Pytam Cię…",
    activity_video_probe: "Sprawdzam wideo {0}…",
    activity_video_add_audio: "Dodaję dźwięk do wideo…",
    activity_video_trim: "Przycinam wideo…",
    activity_video_concat: "Łączę klipy wideo…",
    activity_video_from_images: "Tworzę wideo ze zdjęć…",
    activity_computer_use: "Steruję ekranem…",
    activity_generic: "Wykonuję {0}…"
  },
  kk: {
    slash_help: HELP_KK,
    slash_model: "Провайдер: {0}\nМодель: {1}",
    slash_status: "Осы чаттағы кіріс токендер бағасы: ~{0}\nОсы чаттағы шығыс токендер бағасы: ~{1}\nDertet Code пайдалану сериясы: {2} күн қатарынан\n(токен бағасы шамамен, провайдердің дәл саны емес)",
    slash_clear_done: "Осы чаттың тарихы тазартылды.",
    slash_compact_empty: "Сығатын ешнәрсе жоқ — тарих бос.",
    slash_compact_prefix: "📎 Тарих қорытындыға сығылды:\n\n{0}",
    slash_compact_failed: "Тарихты сығу мүмкін болмады: {0}",
    slash_memory_disabled: "Баптауларда дербестендіру өшірулі — агент ештеңе есте сақтамайды.",
    slash_memory_list: "Агент сен туралы не есте сақтады:\n{0}",
    slash_memory_empty: "Агент әзірге ештеңе есте сақтаған жоқ.",
    slash_remember_missing_arg: "Нені есте сақтау керегін көрсет: /remember факт мәтіні.",
    slash_remember_done: "Есте сақталды: {0}",
    slash_forget_done: "Сен туралы барлық жады өшірілді.",
    slash_lessons_list: "Өткен қателерден алынған сабақтар:\n{0}",
    slash_lessons_empty: "Әзірге ешбір сабақ жазылмаған.",
    slash_forget_lessons_done: "Өткен қателердің сабақтары өшірілді.",
    slash_folders_list: "Тіркелген қалталар:\n{0}",
    slash_folders_empty: "Осы сессияға ешбір қалта тіркелмеген.",
    slash_mode_current: "Ағымдағы режим: {0}",
    slash_mode_switched: "Режим ауыстырылды: {0}",
    slash_rename_missing_arg: "Жаңа атын көрсет: /rename жаңа сессия атауы.",
    slash_rename_done: "Сессияның аты өзгертілді: {0}",
    slash_system_prompt: "Баптаулардағы жеке жүйелік промпт:\n\n{0}",
    slash_system_prompt_empty: "Баптауларда жеке жүйелік промпт орнатылмаған.",
    slash_whoami: "Сессия түрі: {0}\nПровайдер: {1}\nМодель: {2}\nРежим: {3}\nТіркелген қалталар: {4}",
    slash_export_done: "Чат файлға сақталды:\n{0}",
    slash_export_failed: "Чатты сақтау мүмкін болмады: {0}",
    slash_history_body: "Осы жоба қалтасындағы басқа сессиялардың тарихы:\n\n{0}",
    slash_history_empty: "Осы қалта үшін басқа сессиялардың сақталған тарихы жоқ (немесе қалта тіркелмеген).",
    slash_doctor_header: "Сессия күйін тексеру:\n{0}",
    slash_doctor_key_ok: "✅ API кілті орнатылған",
    slash_doctor_key_warn: "⚠️ API кілті бос (локальді модель үшін жарамды болуы мүмкін)",
    slash_doctor_no_folders: "⚠️ Ешбір жоба қалтасы тіркелмеген",
    slash_doctor_folder_ok: "✅ Қалта бар: {0}",
    slash_doctor_folder_missing: "❌ Қалта дискіден табылмады: {0}",
    slash_version: "Dertet Harness Desktop v{0}",
    slash_bug: BUG_KK,
    agent_step_limit_reached: "Осы хабарлама үшін агенттің қадам шегіне жетті. Жалғастыру үшін тағы жаз.",
    activity_thinking: "Ойлануда…",
    activity_search: "«{0}» іздеуде…",
    activity_open: "{0} ашылуда…",
    activity_browser_read: "Бетті оқуда…",
    activity_browser_find: "Беттен «{0}» іздеуде…",
    activity_browser_click: "Бетте басуда…",
    activity_browser_type: "Бетке мәтін теруде…",
    activity_browser_screenshot: "Бет скриншотын жасауда…",
    activity_browser_close: "Браузер қойындысы жабылуда…",
    activity_read_file: "{0} оқылуда…",
    activity_list_dir: "{0} қаралуда…",
    activity_write_file: "{0} жазылуда…",
    activity_edit_file: "{0} өңделуде…",
    activity_run_command: "Команда орындалуда…",
    activity_update_dertetcode_md: "DertetCode.md жаңартылуда…",
    activity_ask_user_choice: "Сенен сұрауда…",
    activity_video_probe: "{0} видеосы тексерілуде…",
    activity_video_add_audio: "Видеоға аудио қосылуда…",
    activity_video_trim: "Видео қиылуда…",
    activity_video_concat: "Видео клиптер жалғануда…",
    activity_video_from_images: "Суреттерден видео жиналуда…",
    activity_computer_use: "Экран басқарылуда…",
    activity_generic: "{0} орындалуда…"
  },
  ro: {
    slash_help: HELP_RO,
    slash_model: "Furnizor: {0}\nModel: {1}",
    slash_status: "Token-uri de intrare estimate în acest chat: ~{0}\nToken-uri de ieșire estimate în acest chat: ~{1}\nSerie de utilizare Dertet Code: {2} zi(le) la rând\n(estimare aproximativă, nu numărătoarea exactă a furnizorului)",
    slash_clear_done: "Istoricul acestui chat a fost șters.",
    slash_compact_empty: "Nimic de comprimat — istoricul este gol.",
    slash_compact_prefix: "📎 Istoric comprimat într-un rezumat:\n\n{0}",
    slash_compact_failed: "Comprimarea istoricului a eșuat: {0}",
    slash_memory_disabled: "Personalizarea este dezactivată din setări — agentul nu reține nimic.",
    slash_memory_list: "Ce a reținut agentul despre tine:\n{0}",
    slash_memory_empty: "Agentul nu a reținut încă nimic.",
    slash_remember_missing_arg: "Spune ce să reții: /remember textul faptului.",
    slash_remember_done: "Reținut: {0}",
    slash_forget_done: "Toată memoria despre tine a fost ștearsă.",
    slash_lessons_list: "Lecții învățate din greșeli trecute:\n{0}",
    slash_lessons_empty: "Nicio lecție înregistrată încă.",
    slash_forget_lessons_done: "Lecțiile din greșeli trecute au fost șterse.",
    slash_folders_list: "Foldere atașate:\n{0}",
    slash_folders_empty: "Niciun folder nu este atașat acestei sesiuni.",
    slash_mode_current: "Mod curent: {0}",
    slash_mode_switched: "Mod schimbat în: {0}",
    slash_rename_missing_arg: "Dă-i un nume nou: /rename nume nou al sesiunii.",
    slash_rename_done: "Sesiune redenumită în: {0}",
    slash_system_prompt: "Prompt de sistem personalizat din setări:\n\n{0}",
    slash_system_prompt_empty: "Niciun prompt de sistem personalizat setat.",
    slash_whoami: "Tip de sesiune: {0}\nFurnizor: {1}\nModel: {2}\nMod: {3}\nFoldere atașate: {4}",
    slash_export_done: "Chat salvat în fișier:\n{0}",
    slash_export_failed: "Salvarea chatului a eșuat: {0}",
    slash_history_body: "Istoricul altor sesiuni din același folder de proiect:\n\n{0}",
    slash_history_empty: "Niciun istoric salvat pentru alte sesiuni din acest folder (sau niciun folder atașat).",
    slash_doctor_header: "Verificare stare sesiune:\n{0}",
    slash_doctor_key_ok: "✅ Cheia API este setată",
    slash_doctor_key_warn: "⚠️ Cheia API este goală (poate fi normal pentru un model local)",
    slash_doctor_no_folders: "⚠️ Niciun folder de proiect atașat",
    slash_doctor_folder_ok: "✅ Folderul există: {0}",
    slash_doctor_folder_missing: "❌ Folderul nu a fost găsit pe disc: {0}",
    slash_version: "Dertet Harness Desktop v{0}",
    slash_bug: BUG_RO,
    agent_step_limit_reached: "S-a atins limita de pași a agentului pentru acest mesaj. Trimite alt mesaj pentru a continua.",
    activity_thinking: "Mă gândesc…",
    activity_search: "Caut „{0}”…",
    activity_open: "Deschid {0}…",
    activity_browser_read: "Citesc pagina…",
    activity_browser_find: "Caut pe pagină „{0}”…",
    activity_browser_click: "Dau clic pe pagină…",
    activity_browser_type: "Tastez pe pagină…",
    activity_browser_screenshot: "Fac o captură de ecran a paginii…",
    activity_browser_close: "Închid fila browserului…",
    activity_read_file: "Citesc {0}…",
    activity_list_dir: "Răsfoiesc {0}…",
    activity_write_file: "Scriu {0}…",
    activity_edit_file: "Editez {0}…",
    activity_run_command: "Rulez o comandă…",
    activity_update_dertetcode_md: "Actualizez DertetCode.md…",
    activity_ask_user_choice: "Te întreb…",
    activity_video_probe: "Inspectez videoclipul {0}…",
    activity_video_add_audio: "Adaug audio la videoclip…",
    activity_video_trim: "Tai videoclipul…",
    activity_video_concat: "Unesc clipurile video…",
    activity_video_from_images: "Asamblez un videoclip din imagini…",
    activity_computer_use: "Controlez ecranul…",
    activity_generic: "Rulez {0}…"
  },
  de: {
    slash_help: HELP_DE,
    slash_model: "Anbieter: {0}\nModell: {1}",
    slash_status: "Geschätzte Eingabe-Tokens in diesem Chat: ~{0}\nGeschätzte Ausgabe-Tokens in diesem Chat: ~{1}\nDertet-Code-Nutzungsserie: {2} Tag(e) in Folge\n(Token-Schätzung ist ungefähr, nicht die exakte Zahl des Anbieters)",
    slash_clear_done: "Der Verlauf dieses Chats wurde gelöscht.",
    slash_compact_empty: "Nichts zu komprimieren — der Verlauf ist leer.",
    slash_compact_prefix: "📎 Verlauf zu einer Zusammenfassung komprimiert:\n\n{0}",
    slash_compact_failed: "Verlauf konnte nicht komprimiert werden: {0}",
    slash_memory_disabled: "Personalisierung ist in den Einstellungen deaktiviert — der Agent merkt sich nichts.",
    slash_memory_list: "Was sich der Agent über dich gemerkt hat:\n{0}",
    slash_memory_empty: "Der Agent hat sich bisher nichts gemerkt.",
    slash_remember_missing_arg: "Sag, was gemerkt werden soll: /remember Text der Tatsache.",
    slash_remember_done: "Gemerkt: {0}",
    slash_forget_done: "Alle Erinnerungen über dich wurden gelöscht.",
    slash_lessons_list: "Gelernte Lektionen aus früheren Fehlern:\n{0}",
    slash_lessons_empty: "Noch keine Lektionen aufgezeichnet.",
    slash_forget_lessons_done: "Lektionen aus früheren Fehlern wurden gelöscht.",
    slash_folders_list: "Verknüpfte Ordner:\n{0}",
    slash_folders_empty: "Mit dieser Sitzung ist kein Ordner verknüpft.",
    slash_mode_current: "Aktueller Modus: {0}",
    slash_mode_switched: "Modus gewechselt zu: {0}",
    slash_rename_missing_arg: "Gib einen neuen Namen an: /rename neuer Sitzungsname.",
    slash_rename_done: "Sitzung umbenannt in: {0}",
    slash_system_prompt: "Benutzerdefinierter System-Prompt aus den Einstellungen:\n\n{0}",
    slash_system_prompt_empty: "Kein benutzerdefinierter System-Prompt in den Einstellungen festgelegt.",
    slash_whoami: "Sitzungstyp: {0}\nAnbieter: {1}\nModell: {2}\nModus: {3}\nVerknüpfte Ordner: {4}",
    slash_export_done: "Chat in Datei gespeichert:\n{0}",
    slash_export_failed: "Chat konnte nicht gespeichert werden: {0}",
    slash_history_body: "Verlauf anderer Sitzungen in diesem Projektordner:\n\n{0}",
    slash_history_empty: "Kein gespeicherter Verlauf anderer Sitzungen für diesen Ordner (oder kein Ordner verknüpft).",
    slash_doctor_header: "Statusprüfung der Sitzung:\n{0}",
    slash_doctor_key_ok: "✅ API-Schlüssel ist gesetzt",
    slash_doctor_key_warn: "⚠️ API-Schlüssel ist leer (kann bei einem lokalen Modell in Ordnung sein)",
    slash_doctor_no_folders: "⚠️ Kein Projektordner verknüpft",
    slash_doctor_folder_ok: "✅ Ordner existiert: {0}",
    slash_doctor_folder_missing: "❌ Ordner auf der Festplatte nicht gefunden: {0}",
    slash_version: "Dertet Harness Desktop v{0}",
    slash_bug: BUG_DE,
    agent_step_limit_reached: "Das Schrittlimit des Agenten für diese Nachricht wurde erreicht. Schreib erneut, um fortzufahren.",
    activity_thinking: "Denke nach…",
    activity_search: "Suche „{0}“…",
    activity_open: "Öffne {0}…",
    activity_browser_read: "Lese die Seite…",
    activity_browser_find: "Suche auf der Seite nach „{0}“…",
    activity_browser_click: "Klicke auf der Seite…",
    activity_browser_type: "Tippe auf der Seite…",
    activity_browser_screenshot: "Erstelle einen Screenshot der Seite…",
    activity_browser_close: "Schließe den Browser-Tab…",
    activity_read_file: "Lese {0}…",
    activity_list_dir: "Durchsuche {0}…",
    activity_write_file: "Schreibe {0}…",
    activity_edit_file: "Bearbeite {0}…",
    activity_run_command: "Führe einen Befehl aus…",
    activity_update_dertetcode_md: "Aktualisiere DertetCode.md…",
    activity_ask_user_choice: "Frage dich…",
    activity_video_probe: "Prüfe Video {0}…",
    activity_video_add_audio: "Füge dem Video Audio hinzu…",
    activity_video_trim: "Schneide das Video…",
    activity_video_concat: "Füge Videoclips zusammen…",
    activity_video_from_images: "Erstelle ein Video aus Bildern…",
    activity_computer_use: "Steuere den Bildschirm…",
    activity_generic: "Führe {0} aus…"
  },
  fr: {
    slash_help: HELP_FR,
    slash_model: "Fournisseur : {0}\nModèle : {1}",
    slash_status: "Tokens d'entrée estimés dans ce chat : ~{0}\nTokens de sortie estimés dans ce chat : ~{1}\nSérie d'utilisation de Dertet Code : {2} jour(s) d'affilée\n(estimation approximative, pas le compte exact du fournisseur)",
    slash_clear_done: "L'historique de ce chat a été effacé.",
    slash_compact_empty: "Rien à condenser — l'historique est vide.",
    slash_compact_prefix: "📎 Historique condensé en un résumé :\n\n{0}",
    slash_compact_failed: "Échec de la condensation de l'historique : {0}",
    slash_memory_disabled: "La personnalisation est désactivée dans les paramètres — l'agent ne retient rien.",
    slash_memory_list: "Ce que l'agent a retenu de toi :\n{0}",
    slash_memory_empty: "L'agent n'a encore rien retenu.",
    slash_remember_missing_arg: "Indique quoi retenir : /remember texte du fait.",
    slash_remember_done: "Retenu : {0}",
    slash_forget_done: "Toute la mémoire te concernant a été effacée.",
    slash_lessons_list: "Leçons tirées d'erreurs passées :\n{0}",
    slash_lessons_empty: "Aucune leçon enregistrée pour l'instant.",
    slash_forget_lessons_done: "Les leçons d'erreurs passées ont été effacées.",
    slash_folders_list: "Dossiers attachés :\n{0}",
    slash_folders_empty: "Aucun dossier n'est attaché à cette session.",
    slash_mode_current: "Mode actuel : {0}",
    slash_mode_switched: "Mode changé en : {0}",
    slash_rename_missing_arg: "Donne un nouveau nom : /rename nouveau nom de session.",
    slash_rename_done: "Session renommée en : {0}",
    slash_system_prompt: "Prompt système personnalisé des paramètres :\n\n{0}",
    slash_system_prompt_empty: "Aucun prompt système personnalisé défini dans les paramètres.",
    slash_whoami: "Type de session : {0}\nFournisseur : {1}\nModèle : {2}\nMode : {3}\nDossiers attachés : {4}",
    slash_export_done: "Chat enregistré dans le fichier :\n{0}",
    slash_export_failed: "Échec de l'enregistrement du chat : {0}",
    slash_history_body: "Historique d'autres sessions dans ce même dossier de projet :\n\n{0}",
    slash_history_empty: "Aucun historique enregistré d'autres sessions pour ce dossier (ou aucun dossier attaché).",
    slash_doctor_header: "Vérification d'état de la session :\n{0}",
    slash_doctor_key_ok: "✅ Clé API définie",
    slash_doctor_key_warn: "⚠️ Clé API vide (peut être normal pour un modèle local)",
    slash_doctor_no_folders: "⚠️ Aucun dossier de projet attaché",
    slash_doctor_folder_ok: "✅ Le dossier existe : {0}",
    slash_doctor_folder_missing: "❌ Dossier introuvable sur le disque : {0}",
    slash_version: "Dertet Harness Desktop v{0}",
    slash_bug: BUG_FR,
    agent_step_limit_reached: "Limite d'étapes de l'agent atteinte pour ce message. Écris à nouveau pour continuer.",
    activity_thinking: "Je réfléchis…",
    activity_search: "Je recherche « {0} »…",
    activity_open: "J'ouvre {0}…",
    activity_browser_read: "Je lis la page…",
    activity_browser_find: "Je cherche « {0} » sur la page…",
    activity_browser_click: "Je clique sur la page…",
    activity_browser_type: "Je tape sur la page…",
    activity_browser_screenshot: "Je prends une capture d'écran de la page…",
    activity_browser_close: "Je ferme l'onglet du navigateur…",
    activity_read_file: "Je lis {0}…",
    activity_list_dir: "Je parcours {0}…",
    activity_write_file: "J'écris {0}…",
    activity_edit_file: "Je modifie {0}…",
    activity_run_command: "J'exécute une commande…",
    activity_update_dertetcode_md: "Je mets à jour DertetCode.md…",
    activity_ask_user_choice: "Je te pose une question…",
    activity_video_probe: "J'inspecte la vidéo {0}…",
    activity_video_add_audio: "J'ajoute de l'audio à la vidéo…",
    activity_video_trim: "Je découpe la vidéo…",
    activity_video_concat: "J'assemble les clips vidéo…",
    activity_video_from_images: "J'assemble une vidéo à partir d'images…",
    activity_computer_use: "Je contrôle l'écran…",
    activity_generic: "J'exécute {0}…"
  }
};

export function resolveAgentLang(lang: string | undefined): AgentLang {
  return (lang && (DICT as Record<string, Dict>)[lang]) ? (lang as AgentLang) : "uk";
}

export function at(lang: string | undefined, key: string, ...args: string[]): string {
  const l = resolveAgentLang(lang);
  let value = DICT[l][key] ?? DICT.uk[key] ?? key;
  args.forEach((a, i) => {
    value = value.split(`{${i}}`).join(a);
  });
  return value;
}
