# CykloWaze

Je webová aplikace, která zobrazuje data z Pražských cyklosčítačů

Vytvořeno na soutěži [#hackujstat](https://hackujstat.cz/)

## Bobr tým

- Martin Štrobl
- Michael Kříž
- Jakub Jeník
- František Kříž

## Jak aplikaci nainstalovat?

Pro tvorbu aplikace byla využita knihovna Flask. Před prvním nainstalováním je nutno zajistit instalaci pár věcí:
- Python 3.11 a vyšší (pravděpodobně půjde i nižší, ale na této jsme aplikaci testovali)
- MariaDB 10 či 11
- Balíčky z requirements.txt přes pip

Poté je nutné provést pár konfiguračních úkonů:
- Vygenerovat API klíče pro [REST API Mapy.cz](https://developer.mapy.cz/account/projects) a platformu [Golemio](https://api.golemio.cz/api-keys/dashboard)
- Ty poté doplňte v main.py, static/js/map.js a static/js/details.js do kolonek, kde je "xxx"
- Přihlásit se do MariaDB a spustit script db_create.sql

Poté můžete konečně spustit aplikaci :)

