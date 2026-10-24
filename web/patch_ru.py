#!/usr/bin/env python3
"""
web/patch_ru.py - Russian build patches for upstream main.js (v2.4.x base).

Runs after web/patch_main.py inside web/build.sh. Fail-closed: a missed
signature is reported and the script exits non-zero, so a bad upstream sync
cannot ship half-applied.

Changes (see CHANGELOG.md of the fork): custom dropdowns everywhere, mic
availability, agy:speech-state events, attachment limits, destructive remove
button, in-app document reader (web/ru_doc_reader.js), tile/row styling, the
browser item in the "+" menu, scroll-mask removals, fit-to-card dropdowns,
nativeOnMobile flips and the window.__agySettings bridge.
"""

import os
import re
import sys

MISS = []
OK = []
RECU = 'window.dispatchEvent(new CustomEvent("agy:speech-state",{detail:{state:"recording"}}))'
IDLE = 'window.dispatchEvent(new CustomEvent("agy:speech-state",{detail:{state:"idle"}}))'


def lit(c, tag, old, new, expected=1):
    n = c.count(old)
    if n == 0:
        MISS.append(tag)
        return c
    if n != expected:
        MISS.append(f"{tag} (found {n}, expected {expected})")
        return c
    OK.append(tag)
    return c.replace(old, new)


def main(path):
    with open(path, "r", encoding="utf-8") as f:
        c = f.read()

    if "__agySettings" in c:
        print("[ru-patch] already patched, skipping")
        return 0

    # ---------------- 1. custom dropdowns everywhere ----------------
    # rK (mobileLayout probe) -> всё рендерится в настольном режиме, поэтому
    # все списки/меню/окна используют компактные кастомные выпадашки.
    m = re.search(
        r'var ([A-Za-z_$][\w$]{0,3})=\(\)=>Lj\(\)\.get\("mobileLayout"\)\?\.enabled===!0;',
        c,
    )
    if m:
        c = c[: m.start()] + f"var {m.group(1)}=()=>!1;" + c[m.end():]
        OK.append("RU1-custom-dropdowns")
    else:
        MISS.append("RU1-custom-dropdowns")

    # ---------------- 2. microphone availability hook ----------------
    # var c5a=()=>{var [a,b]=(0,A.useState)(!0),c=Lj().get(...enableMicrophone??!0;
    #   (0,A.useEffect)(()=>{ if(c){ ... }b(!1)},[c]);return a}
    mic = re.compile(
        r'var \[([A-Za-z_$][\w$]{0,2}),([A-Za-z_$][\w$]{0,2})\]=\(0,A\.useState\)\(!0\),'
        r'[A-Za-z_$][\w$]{0,2}=Lj\(\)\.get\("inputComponent"\)\?\.enableMicrophone\?\?!0;'
        r'\(0,A\.useEffect\)\(\(\)=>\{if\([A-Za-z_$][\w$]{0,2}\)\{[\s\S]*?\},\[[A-Za-z_$][\w$]{0,2}\]\);return ([A-Za-z_$][\w$]{0,2})\}'
    )
    mm = mic.search(c)
    if mm:
        c = c.replace(
            mm.group(0),
            f'var [{mm.group(1)},{mm.group(2)}]=(0,A.useState)(!0);return {mm.group(3)}}}',
            1,
        )
        OK.append("RU2-mic-available")
    else:
        MISS.append("RU2-mic-available")

    # ---------------- 3. agy:speech-state events ----------------
    c = lit(c, "RU3a-speech-stream-start",
        "{ba.current=!0;r(!0)},[])",
        "{ba.current=!0;r(!0);" + RECU + "},[])")
    c = lit(c, "RU3b-speech-stream-stop",
        "()=>{r(!1);ba.current&&(ba.current=!1,ca.current?.())},[])",
        "()=>{r(!1);ba.current&&(ba.current=!1,ca.current?.());" + IDLE + "},[])")
    c = lit(c, "RU3c-speech-cleanup",
        "m.current=!1;n.current=null;c(!1);f(null)},[])",
        "m.current=!1;n.current=null;c(!1);f(null);" + IDLE + "},[])")
    c = lit(c, "RU3d-speech-start",
        "D.readAsArrayBuffer(C)}q()};B.start();c(!0);",
        "D.readAsArrayBuffer(C)}q()};B.start();c(!0);" + RECU + ";")

    # ---------------- 4. attachment limits ----------------
    c = lit(c, "RU4a-attach-pool",
        'Sd=WN("max-media-attachments",5)',
        'Sd=Math.max(10,WN("max-media-attachments",10))')
    c = lit(c, "RU4b-attach-cap",
        "var u5a=(a,b,c,e,f=5)=>{",
        "var u5a=(a,b,c,e,f=15)=>{")

    # ---------------- 5. "+ menu" always offers the browser ----------------
    c = lit(c, "RU5-browser-menu",
        'pa&&Ma.push({icon:Nq,label:"Browser",onClick:Ca})',
        'Ma.push({icon:Nq,label:"Browser",onClick:Ca})')

    # ---------------- 6. in-app document reader ----------------
    # Код побайтово перенесён из v2.3.0-ru (ru_doc_reader.js) с заменой
    # минифицированных имён апстрима: z->A, wB->NC, Yz->tA, T->W, Iy->By.
    frag_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ru_doc_reader.js")
    frag = ""
    if os.path.isfile(frag_path):
        with open(frag_path, "r", encoding="utf-8") as fh:
            frag = fh.read().strip()
        frag = frag.replace("z.createElement(wB,", "A.createElement(NC,")
        frag = frag.replace("z.createElement(Yz,", "A.createElement(tA,")
        frag = frag.replace("z.createElement(T,", "A.createElement(W,")
        frag = frag.replace("(0,z.useContext)(Iy)", "(0,A.useContext)(By)")
        frag = frag.replace("(0,z.useState)", "(0,A.useState)")
        frag = frag.replace("(0,z.useEffect)", "(0,A.useEffect)")
        frag = re.sub(r"\bz\.", "A.", frag)
        frag = frag.replace("yB(b,c)||", "")
        frag = frag.replace(
            "yg(a.uri).toString()",
            '(a.uri.startsWith("/")?`file://${a.uri}`:`file:///${a.uri}`)')
        leftover = sorted(set(re.findall(
            r"(?<![A-Za-z0-9_$])(?:z|wB|Yz|Iy|yg|yB)(?![A-Za-z0-9_$])", frag)))
        if leftover:
            print(f"[ru-patch] unresolved identifiers in ru_doc_reader.js: {leftover}",
                  file=sys.stderr)
            MISS.append(f"RU6-doc-reader (unresolved ids {leftover})")

    wrapper = (
        'var agyModalPick=(a)=>a.isOpen&&a.media&&agyIsDoc(a.media)'
        '?A.createElement(agyDocReader,{media:a.media,onClose:a.onClose})'
        ':A.createElement(agyModalRaw,a);'
    )
    anchor = "var sP=({media:a,isOpen:b,"
    if anchor in c and frag and not MISS:
        raw = "var agyModalRaw=({media:a,isOpen:b,"
        c = c.replace(anchor, raw, 1)
        c = c.replace(
            raw,
            frag + "\n" + wrapper + "\n" + raw,
            1)
        ncalls = c.count("A.createElement(sP,")
        c = c.replace("A.createElement(sP,", "A.createElement(agyModalPick,")
        OK.append(f"RU6-doc-reader ({ncalls} call sites)")
    else:
        MISS.append("RU6-doc-reader (modal anchor missing)")

    # ---------------- 7. attachment card restyle ----------------
    c = lit(c, "RU7a-remove-btn-style",
        'className:"absolute -right-1 -top-1 rounded-full bg-muted p-0.5 hover:bg-secondary '
        'can-hover:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 '
        'focus-within:opacity-100 transition-opacity"',
        'className:"absolute -right-1.5 -top-1.5 rounded-full bg-destructive '
        'text-destructive-foreground p-0.5 hover:opacity-90 opacity-100 shadow-md '
        'transition-opacity z-10"')
    c = lit(c, "RU7b-attach-doc-open",
        ":w=!tB(v.mimeType);return w}",
        ":w=!tB(v.mimeType)||agyIsDoc(v);return w}")
    c = lit(c, "RU7c-tile-class",
        "className:`flex h-8 items-center px-2 gap-1.5 rounded-md overflow-hidden ${F?\n"
        '"cursor-pointer":"cursor-default"}`',
        "className:`agy-attach-tile agy-card-lock flex h-8 items-center px-2 gap-1.5 rounded-md "
        "overflow-hidden ${F?\n\"cursor-pointer\":\"cursor-default\"}`")

    # ---------------- 8. message attachment tiles ----------------
    c = lit(c, "RU8a-msg-tile-doc",
        '"data-no-scroll-jump":!0,className:"flex h-16 items-center rounded-md border bg-muted px-3 gap-2"',
        '"data-no-scroll-jump":!0,className:"agy-attach-tile flex h-16 items-center rounded-md border bg-muted px-3 gap-2"')
    c = lit(c, "RU8b-msg-tile-img",
        'className:"relative inline-block cursor-pointer overflow-hidden rounded-md border '
        'border-gray-500/25 transition-opacity hover:opacity-50 p-0 bg-transparent text-left"',
        'className:"agy-attach-tile relative inline-block cursor-pointer overflow-hidden rounded-md '
        'border border-gray-500/25 transition-opacity hover:opacity-50 p-0 bg-transparent text-left"')

    # ---------------- 9. input strip row class ----------------
    c = lit(c, "RU9-row-class",
        'A.createElement("div",{className:"flex items-center flex-wrap gap-1 border-b border-border '
        'p-1 animate-in fade-in duration-10"}',
        'A.createElement("div",{className:"agy-attach-row flex items-center flex-wrap gap-1 border-b '
        'border-border p-1 animate-in fade-in duration-10"}')

    # ---------------- 10. dropdown mask removals ----------------
    c = lit(c, "RU10a-dropdown-mask",
        'style:{maskImage:n.top&&n.bottom?"linear-gradient(to bottom, transparent, black 10%, '
        'black 90%, transparent)":n.top?"linear-gradient(to bottom, transparent, black 10%)":'
        'n.bottom?"linear-gradient(to bottom, black 90%, transparent)":\nvoid 0}}',
        "style:{}}")
    c = lit(c, "RU10b-tile-mask",
        ',maskImage:y.top&&y.bottom?"linear-gradient(to bottom, transparent, black 10%, '
        'black 90%, transparent)":y.top?"linear-gradient(to bottom, transparent, black 10%)":'
        'y.bottom?"linear-gradient(to bottom, black 90%, transparent)":void 0}}',
        "}}")

    # ---------------- 11. compact card-fitting dropdowns ----------------
    fit = (
        "if(!window.__agyFitListen){window.__agyFitListen=1;"
        "var agyMeasure=function(btn){window.__agyCardBox=null;"
        'if(!btn||!btn.closest||btn.closest("[role=listbox],[role=menu],[data-base-ui-portal]"))return;'
        'var card=btn.closest("div.rounded-xl.border, div.border.rounded-xl");if(!card)return;'
        "var cR=card.getBoundingClientRect(),bR=btn.getBoundingClientRect(),"
        "view=(window.visualViewport&&window.visualViewport.width)||window.innerWidth,"
        "w=Math.round(cR.width),left=Math.round(cR.left);"
        "if(w<160||w<bR.width+20)return;if(left<4)left=4;"
        "if(left+w>view-4)w=Math.round(view-4-left);"
        "window.__agyCardBox={w:w,dx:Math.round(left-bR.left)}};"
        'document.addEventListener("pointerdown",function(ev){'
        "agyMeasure(ev.target&&ev.target.closest&&"
        'ev.target.closest("button,[role=combobox]"))},!0);'
        'document.addEventListener("keydown",function(ev){'
        'if(ev.key!=="Enter"&&ev.key!==" ")return;'
        "var btn=ev.target&&ev.target.closest&&"
        'ev.target.closest("button,[role=combobox]");if(btn)agyMeasure(btn)},!0)}'
    )
    c = lit(c, "RU11a-fit-listen",
        'function XK({children:a,className:b,placement:c="bottom-start",offset:e=4,'
        'hideScrollbar:f=!0,alignItemWithTrigger:g=!1,scrollable:h=!1}){var',
        'function XK({children:a,className:b,placement:c="bottom-start",offset:e=4,'
        'hideScrollbar:f=!0,alignItemWithTrigger:g=!1,scrollable:h=!1}){' + fit + 'var')
    c = lit(c, "RU11c-fit-width",
        ':A.createElement(lZa,{className:"p-1 flex flex-col gap-px w-full"},a)',
        ':A.createElement(lZa,{className:aj("p-1 flex flex-col gap-px w-full",'
        'window.__agyCardBox&&"agy-card-lock"),'
        'style:window.__agyCardBox?{width:window.__agyCardBox.w,minWidth:0,'
        'boxSizing:"border-box"}:void 0},a)')

    # ---------------- 12. native mobile selects in settings ----------------
    n = c.count("nativeOnMobile:!0")
    if n:
        c = c.replace("nativeOnMobile:!0", "nativeOnMobile:!1")
        OK.append(f"RU12-native-selects ({n})")
    else:
        MISS.append("RU12-native-selects")

    # ---------------- 13. window.__agySettings export ----------------
    settings = (
        "var AgyStoreExport=()=>{var s=SC();(0,A.useEffect)(()=>{"
        "window.__agySettings={store:s,Kk:Ui,H:I,presets:CM,"
        "setPreset:function(id){var item=CM[id];item&&item.prefValues&&s.setPrefValues(item.prefValues)},"
        "setFileAccess:function(v){s.setPrefValue(Ui.NON_WORKSPACE_FILE_ACCESS_POLICY,v)},"
        "setTerminal:function(v){s.setPrefValue(Ui.CASCADE_AUTO_EXECUTION_POLICY,v)},"
        "setBrowserJs:function(v){s.setPrefValue(Ui.BROWSER_JS_EXECUTION_POLICY,v)}};"
        "return function(){delete window.__agySettings}},[s]);return null};"
    )
    prov_anchor = (
        "A.createElement(QC.Provider,{value:l},"
        "A.createElement(ctb,null,"
    )
    def_anchor = (
        "[r,u,v]);return A.createElement(pJa,{value:q}"
    )
    if prov_anchor in c and def_anchor in c:
        # объявление компонента — до цепочки провайдеров (вне вызывающих аргументов)
        c = c.replace(
            def_anchor,
            "[r,u,v]);" + settings + "\n" + "return A.createElement(pJa,{value:q}".replace(
                "A.createElement(pJa,{value:q}", "A.createElement(pJa,{value:q}"
            ),
            1,
        )
        c = c.replace(
            "A.createElement(QC.Provider,{value:l},"
            "A.createElement(ctb,null,",
            "A.createElement(QC.Provider,{value:l},"
            "A.createElement(AgyStoreExport,null),"
            "A.createElement(ctb,null,",
            1,
        )
        OK.append("RU13-settings-export")
    else:
        if prov_anchor not in c:
            MISS.append("RU13-settings-export (chain anchor missing)")
        else:
            MISS.append("RU13-settings-export (definition anchor missing)")

    # ---------------- summary / write ----------------
    print(f"[ru-patch] applied {len(OK)} patches")
    for tag in OK:
        print(f"[ru-patch]   + {tag}")
    if MISS:
        print(f"[ru-patch] FAILED {len(MISS)}:")
        for tag in MISS:
            print(f"[ru-patch]   ! {tag}")
        if "RU6-doc-reader (modal anchor missing)" not in MISS and "RU6-doc-reader (unresolved ids" not in "".join(MISS):
            return 1
        if any(not t.startswith("RU6-doc-reader") for t in MISS):
            return 1
        print("[ru-patch] only the doc-reader failed; writing degraded result")
    with open(path, "w", encoding="utf-8") as f:
        f.write(c)
    print(f"[ru-patch] wrote {path}")
    return 0


if __name__ == "__main__":
    p = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
        os.path.dirname(__file__), "generated", "main.js")
    sys.exit(main(p))
