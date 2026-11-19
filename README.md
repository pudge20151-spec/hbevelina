# ARCHIVE 022 — CYBER TERMINAL RELEASE

## Запуск
1. Распакуйте архив целиком.
2. Откройте терминал в папке `ARCHIVE-022-RELEASE`.
3. Запустите локальный сервер:

```powershell
python -m http.server 8000
```

4. Откройте `http://localhost:8000` в браузере.

Можно открыть `index.html` напрямую, но локальный сервер надёжнее для загрузки ресурсов.

## CYBER TERMINAL
В разделе CYBER доступны четыре независимых досье: CHECKSCAM, OSINT, PHISHING и FUTURE. Открыть их можно нажатием на карточку или командами в строке COMMAND LINE:

- `open checkscam`
- `open osint`
- `open phishing`
- `open future`
- `help`
- `back`

В каждом досье есть кнопка `BACK TO CYBER` для возврата к терминалу.

## Редактирование
- Тексты и разметка: `index.html`.
- Логика навигации, загадок и сохранения прогресса: `script.js`.
- Внешний вид: `style.css`.
- Скриншот CHECKSCAM: `assets/checkscam-bot.png`.

Прогресс архива сохраняется в LocalStorage. Для повторного прохождения используйте RESET ARCHIVE в настройках сайта.


## HUB — обновлённая главная панель
Главная панель архива показывает прогресс прохождения, семь разделов и их статусы. Карточки автоматически обновляются при изменении прогресса. Заблокированные разделы остаются недоступными до выполнения условий открытия.


## HUB redesign V2
The main archive index now uses a two-column desktop directory, a dedicated progress panel, and a single-column mobile layout. Existing section navigation and saved progress logic are retained.
