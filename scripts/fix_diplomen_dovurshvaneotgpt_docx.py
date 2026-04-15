from __future__ import annotations

import copy
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

SRC = Path(r"C:\Users\mko\Desktop\a\proek\generated\docs\diplomen_dovurshvaneotgpt_source.docx")
OUT = Path(r"C:\Users\mko\Desktop\a\proek\generated\docs\diplomen_dovurshvaneotgpt_korigiran.docx")

NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
XML = "{http://www.w3.org/XML/1998/namespace}"


def para_text(p: ET.Element) -> str:
    return "".join(t.text or "" for t in p.findall(".//w:t", NS)).strip()


def set_para_text(p: ET.Element, text: str) -> None:
    ppr = p.find("w:pPr", NS)
    for child in list(p):
        if child is not ppr:
            p.remove(child)
    r = ET.Element(W + "r")
    t = ET.SubElement(r, W + "t")
    if text.startswith(" ") or text.endswith(" ") or "  " in text:
        t.set(XML + "space", "preserve")
    t.text = text
    p.append(r)


def make_para_like(src_p: ET.Element, text: str) -> ET.Element:
    newp = ET.Element(W + "p")
    ppr = src_p.find("w:pPr", NS)
    if ppr is not None:
        newp.append(copy.deepcopy(ppr))
    r = ET.SubElement(newp, W + "r")
    t = ET.SubElement(r, W + "t")
    if text.startswith(" ") or text.endswith(" ") or "  " in text:
        t.set(XML + "space", "preserve")
    t.text = text
    return newp


REPLACEMENTS = {
    "Тези въпроси ми помогнаха да преобразувам темата в реален работен план. Вместо абстрактен „панел за смарт устройства“, проектът започна да се оформя като пълно клиент-сървърно приложение с база данни, административен панел, графики, настройки и механизъм за симулация.": (
        "Тези въпроси ми помогнаха да преобразувам темата в реален работен план. Вместо абстрактен "
        "„панел за смарт устройства“, проектът започна да се оформя като пълно клиент-сървърно "
        "приложение с база данни, административен панел, графики, настройки, механизъм за симулация "
        "и базова интеграция с външни устройства."
    ),
    "Тези допълнителни изисквания направиха проекта по-близък до реално приложение, а не само до демонстрационен CRUD проект.": (
        "Тези допълнителни изисквания направиха проекта по-близък до реално приложение, а не само до "
        "демонстрационен CRUD проект. Те разшириха системата отвъд базовото управление на записи и "
        "добавиха логика, която е по-близка до реални smart home решения."
    ),
    "Основното ограничение в проекта беше липсата на физически smart устройства. Това наложи да реализирам сървърен симулационен модул, който периодично актуализира данните и по този начин прави демонстрацията по-реалистична.": (
        "Основното ограничение в проекта беше, че по време на разработката не разполагах с пълен "
        "набор от физически smart устройства за постоянна демонстрация. Това наложи да реализирам "
        "сървърен симулационен модул, който периодично актуализира данните и по този начин прави "
        "демонстрацията по-реалистична, без да изключва реалната интеграция с външни устройства."
    ),
    "Съзнателно не включих:": "Съзнателно не включих в текущия обхват:",
    "- реална хардуерна интеграция с микроконтролери;": (
        "- пълномащабна хардуерна инфраструктура с множество микроконтролери и сложни протоколи за автоматизация;"
    ),
    "След този етап системата вече можеше да се използва като реален панел, а не само като login демонстрация.": (
        "След този етап системата вече можеше да се използва като реален панел, а не само като login "
        "демонстрация, като имаше стабилна основа за административно управление и интеграция с външни устройства."
    ),
}


INSERT_AFTER = {
    "- групиране на устройствата по помещения.": [
        "- базова интеграция с микроконтролер или други устройства, като осигурява обмен на данни и управление."
    ],
    "- симулирани данни при липса на реален хардуер.": [
        "- обмен на данни и управление при работа с външни устройства или микроконтролери."
    ],
    "- симулационна логика.": [
        "- базова хардуерна интеграция чрез API маршрут за външни устройства."
    ],
    "- управление на потребители от настройките.": [
        "- приемане на статус и параметри от външно устройство чрез защитен хардуерен API маршрут."
    ],
    "След този етап системата вече можеше да се използва като реален панел, а не само като login демонстрация.": [
        "В този момент вече беше налице и реална основа за хардуерна връзка, тъй като проектът съдържа API логика за приемане на данни от микроконтролер или друго външно устройство."
    ],
    "7.3. Какво показва готовият проект": [
        "Готовият проект показва и че системата не е ограничена само до симулация. В нея е предвидена и базова интеграция с микроконтролери и външни устройства чрез специализиран API маршрут, защитен с API ключ, което позволява реален обмен на данни и управление."
    ],
}


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(SRC, "r") as zin:
        files = {name: zin.read(name) for name in zin.namelist()}

    doc = ET.fromstring(files["word/document.xml"])
    body = doc.find("w:body", NS)
    assert body is not None

    for p in body.findall("w:p", NS):
        text = para_text(p)
        if text in REPLACEMENTS:
            set_para_text(p, REPLACEMENTS[text])

    children = list(body)
    inserts: list[tuple[int, ET.Element]] = []
    for idx, child in enumerate(children):
        if child.tag != W + "p":
            continue
        text = para_text(child)
        if text in INSERT_AFTER:
            for offset, line in enumerate(INSERT_AFTER[text], start=1):
                inserts.append((idx + offset, make_para_like(child, line)))

    for idx, newp in sorted(inserts, key=lambda x: x[0], reverse=True):
        body.insert(idx, newp)

    files["word/document.xml"] = ET.tostring(doc, encoding="utf-8", xml_declaration=True)

    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as zout:
        for name, content in files.items():
            zout.writestr(name, content)

    print(OUT)


if __name__ == "__main__":
    main()
