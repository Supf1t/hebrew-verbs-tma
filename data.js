const groups = [
    { id: 1, name: "Быт и рутина", color: "#3b82f6" },       // Синяя тема
    { id: 2, name: "Движение и работа", color: "#10b981" }, // Зеленая тема
    { id: 3, name: "Общение и мысли", color: "#8b5cf6" },   // Фиолетовая тема
    { id: 4, name: "Чувства и процессы", color: "#f59e0b" } // Оранжевая тема
];

const verbsData = [
    // 1. Быт и рутина
    { id: 1, groupId: 1, hebrew: "לֶאֱכוֹל", pronunciation: "лаахоль", russian: "есть" },
    { id: 2, groupId: 1, hebrew: "לִשְׁתּוֹת", pronunciation: "лиштот", russian: "пить" },
    { id: 3, groupId: 1, hebrew: "לְבַשֵּׁל", pronunciation: "левашель", russian: "готовить еду" },
    { id: 4, groupId: 1, hebrew: "לְהָכִין", pronunciation: "леахин", russian: "готовить/подготавливать" },
    { id: 5, groupId: 1, hebrew: "לָגוּר", pronunciation: "лагур", russian: "жить" },
    { id: 6, groupId: 1, hebrew: "לִישׁוֹן", pronunciation: "лишон", russian: "спать" },
    { id: 7, groupId: 1, hebrew: "לָקוּם", pronunciation: "лакум", russian: "вставать" },
    { id: 8, groupId: 1, hebrew: "לָנוּחַ", pronunciation: "лануах", russian: "отдыхать" },
    { id: 9, groupId: 1, hebrew: "לְהִתְרַחֵץ", pronunciation: "леитрахец", russian: "мыться" },
    { id: 10, groupId: 1, hebrew: "לְהִתְלַבֵּשׁ", pronunciation: "леитлабеш", russian: "одеваться" },
    { id: 11, groupId: 1, hebrew: "לִנְעוֹל", pronunciation: "ланоль", russian: "обуваться/запирать" },
    { id: 12, groupId: 1, hebrew: "לַחֲבוֹשׁ", pronunciation: "лахбош", russian: "надевать головной убор" },
    { id: 13, groupId: 1, hebrew: "לִלְבּוֹשׁ", pronunciation: "лильбош", russian: "надевать одежду" },
    { id: 14, groupId: 1, hebrew: "לִפְתּוֹחַ", pronunciation: "лифтоах", russian: "открывать" },
    { id: 15, groupId: 1, hebrew: "לִסְגּוֹר", pronunciation: "лисгор", russian: "закрывать" },
    { id: 16, groupId: 1, hebrew: "לְסַדֵּר", pronunciation: "лесадер", russian: "приводить в порядок/убирать" },

    // 2. Движение, транспорт и работа
    { id: 17, groupId: 2, hebrew: "לָלֶכֶת", pronunciation: "лалехет", russian: "идти" },
    { id: 18, groupId: 2, hebrew: "לָבוֹא", pronunciation: "лаво", russian: "приходить" },
    { id: 19, groupId: 2, hebrew: "לִנְסוֹעַ", pronunciation: "линсоа", russian: "ехать" },
    { id: 20, groupId: 2, hebrew: "לָטוּס", pronunciation: "латус", russian: "лететь" },
    { id: 21, groupId: 2, hebrew: "לַחֲזוֹר", pronunciation: "лахзор", russian: "возвращаться" },
    { id: 22, groupId: 2, hebrew: "לָצֵאת", pronunciation: "лацет", russian: "выходить" },
    { id: 23, groupId: 2, hebrew: "לְהִכָּנֵס", pronunciation: "леиканес", russian: "входить" },
    { id: 24, groupId: 2, hebrew: "לַעֲלוֹת", pronunciation: "лаалот", russian: "подниматься" },
    { id: 25, groupId: 2, hebrew: "לָרֶדֶת", pronunciation: "ларедет", russian: "спускаться" },
    { id: 26, groupId: 2, hebrew: "לַעֲבוֹד", pronunciation: "лаавод", russian: "работать" },
    { id: 27, groupId: 2, hebrew: "לִקְנוֹת", pronunciation: "ликнот", russian: "покупать" },
    { id: 28, groupId: 2, hebrew: "לְשַׁלֵּם", pronunciation: "лешалем", russian: "платить" },
    { id: 29, groupId: 2, hebrew: "לִמְכּוֹר", pronunciation: "лимкор", russian: "продавать" },
    { id: 30, groupId: 2, hebrew: "לִשְׁלוֹחַ", pronunciation: "лишлоах", russian: "посылать" },
    { id: 31, groupId: 2, hebrew: "לְטַיֵּל", pronunciation: "летаель", russian: "гулять/путешествовать" },
    { id: 32, groupId: 2, hebrew: "לָרוּץ", pronunciation: "ларуц", russian: "бегать" },

    // 3. Общение, мысли и восприятие
    { id: 33, groupId: 3, hebrew: "לְדַבֵּר", pronunciation: "ледабер", russian: "разговаривать" },
    { id: 34, groupId: 3, hebrew: "לוֹמַר", pronunciation: "ломар", russian: "сказать" },
    { id: 35, groupId: 3, hebrew: "לִשְׁאוֹל", pronunciation: "лишоль", russian: "спрашивать" },
    { id: 36, groupId: 3, hebrew: "לַעֲנוֹת", pronunciation: "лаанот", russian: "отвечать" },
    { id: 37, groupId: 3, hebrew: "לְהָבִין", pronunciation: "леавин", russian: "понимать" },
    { id: 38, groupId: 3, hebrew: "לָדַעַת", pronunciation: "ладат", russian: "знать" },
    { id: 39, groupId: 3, hebrew: "לַחֲשׁוֹב", pronunciation: "лахшов", russian: "думать" },
    { id: 40, groupId: 3, hebrew: "לִזְכּוֹר", pronunciation: "лизкор", russian: "помнить" },
    { id: 41, groupId: 3, hebrew: "לִרְאוֹת", pronunciation: "лирот", russian: "видеть" },
    { id: 42, groupId: 3, hebrew: "לִשְׁמוֹעַ", pronunciation: "лишмоа", russian: "слышать" },
    { id: 43, groupId: 3, hebrew: "לְהַקְשִׁיב", pronunciation: "леакшив", russian: "слушать" },
    { id: 44, groupId: 3, hebrew: "לִקְרוֹא", pronunciation: "ликро", russian: "читать/звать" },
    { id: 45, groupId: 3, hebrew: "לִכְתּוֹב", pronunciation: "лихтов", russian: "писать" },
    { id: 46, groupId: 3, hebrew: "לְהַסְבִּיר", pronunciation: "леасбир", russian: "объяснять" },
    { id: 47, groupId: 3, hebrew: "לְהַכִּיר", pronunciation: "леакир", russian: "знать/знакомиться" },

    // 4. Состояние, чувства и процессы
    { id: 48, groupId: 4, hebrew: "לֶאֱהוֹב", pronunciation: "лаэов", russian: "любить" },
    { id: 49, groupId: 4, hebrew: "לְהַרְגִּישׁ", pronunciation: "леаргиш", russian: "чувствовать" },
    { id: 50, groupId: 4, hebrew: "לְהִפָּגֵשׁ", pronunciation: "леипагеш", russian: "встречаться" },
    { id: 51, groupId: 4, hebrew: "לַעֲזוֹר", pronunciation: "лаазор", russian: "помогать" },
    { id: 52, groupId: 4, hebrew: "לְשַׂחֵק", pronunciation: "лесахек", russian: "играть" },
    { id: 53, groupId: 4, hebrew: "לָשִׁיר", pronunciation: "лашир", russian: "петь" },
    { id: 54, groupId: 4, hebrew: "לְהַתְחִיל", pronunciation: "леатхиль", russian: "начинать" },
    { id: 55, groupId: 4, hebrew: "לִגְמוֹר", pronunciation: "лигмор", russian: "заканчивать" },
    { id: 56, groupId: 4, hebrew: "לְסַיֵּם", pronunciation: "лесаем", russian: "завершать" },
    { id: 57, groupId: 4, hebrew: "לְהַמְשִׁיךְ", pronunciation: "леамших", russian: "продолжать" },
    { id: 58, groupId: 4, hebrew: "לְהַפְסִיק", pronunciation: "леафсик", russian: "прекращать" },
    { id: 59, groupId: 4, hebrew: "לְחַפֵּשׂ", pronunciation: "лехапеш", russian: "искать" },
    { id: 60, groupId: 4, hebrew: "לְחַכּוֹת", pronunciation: "лехакот", russian: "ждать" },
    { id: 61, groupId: 4, hebrew: "לִרְצוֹת", pronunciation: "лирцот", russian: "хотеть" },
    { id: 62, groupId: 4, hebrew: "לְהִצְטַעֵר", pronunciation: "леицтаэр", russian: "сожалеть" }
];
