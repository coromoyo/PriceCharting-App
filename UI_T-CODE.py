from customtkinter import *
import os
import math
import json
import pandas as pd
import tkinter as tk
from tkinter import ttk, filedialog


CONFIG_PATH = os.path.join(os.path.expanduser("~"), ".price_chart_speed.json")

DEFAULT_SETTINGS = {
    "data_path": r"C:\Users\kikat\Desktop\Database OTGPCE",
    "theme": "Dark",                              
    "autocomplete_max_suggestions": 8,
    "autocomplete_match_mode": "Substring",       
    "default_condition": "Loose price",
    "currency_symbol": "$",
    "offer_percentage": 60,                       
}

SETTINGS = {}

def load_settings():
    global SETTINGS
    SETTINGS = DEFAULT_SETTINGS.copy()
    try:
        if os.path.exists(CONFIG_PATH):
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                loaded = json.load(f)
            SETTINGS.update({k: loaded.get(k, v) for k, v in DEFAULT_SETTINGS.items()})
    except Exception:
        pass

def save_settings():
    try:
        with open(CONFIG_PATH, "w", encoding="utf-8") as f:
            json.dump(SETTINGS, f, indent=2)
    except Exception:
        pass

load_settings()


set_appearance_mode(SETTINGS["theme"].lower())
set_default_color_theme("dark-blue")

window = CTk()
window.geometry('1200x900')
window.title("Price Chart Speed — Multi-Tab + Settings")


_DF_CACHE = {}
xlsx_files = []

def list_xlsx_files(directory):
    try:
        return [os.path.splitext(f)[0] for f in os.listdir(directory) if f.lower().endswith('.xlsx')]
    except FileNotFoundError:
        return []

def load_console_df(console_name):
    if not console_name:
        return None
    if console_name in _DF_CACHE:
        return _DF_CACHE[console_name]
    file_path = os.path.join(SETTINGS["data_path"], f"{console_name}.xlsx")
    if not os.path.exists(file_path):
        return None
    df = pd.read_excel(file_path)
    _DF_CACHE[console_name] = df
    return df

def load_games_for_console(console_name):
    if not console_name:
        return []
    df = load_console_df(console_name)
    if df is None or df.empty or df.shape[1] < 3:
        return []
    return df.iloc[:, 2].dropna().astype(str).tolist()

def refresh_xlsx_files():
    global xlsx_files
    xlsx_files = list_xlsx_files(SETTINGS["data_path"])

refresh_xlsx_files()


def _norm(s: str) -> str:
    s = str(s).lower()
    return "".join(ch for ch in s if ch.isalnum())

_COND_KEYWORDS = {
    "looseprice": ["loose", "looseprice"],
    "cibprice": ["cib", "completeinbox", "completebox", "cibprice"],
    "newprice": ["new", "sealed", "newprice"],
    "gradedprice": ["graded", "gradedprice"],
    "boxonlyprice": ["boxonly", "boxonlyprice"],
    "manualonlyprice": ["manualonly", "manualonlyprice", "manual"],
}

def _keywords_for_condition(cond_text: str):
    n = _norm(cond_text)
    if "loose" in n: return _COND_KEYWORDS["looseprice"]
    if "cib" in n or "complete" in n: return _COND_KEYWORDS["cibprice"]
    if "new" in n or "sealed" in n: return _COND_KEYWORDS["newprice"]
    if "graded" in n: return _COND_KEYWORDS["gradedprice"]
    if "box" in n and "only" in n: return _COND_KEYWORDS["boxonlyprice"]
    if ("manual" in n and "only" in n) or n == "manual": return _COND_KEYWORDS["manualonlyprice"]
    return [n]

def _find_condition_column(df: pd.DataFrame, condition_text: str):
    cols = list(map(str, df.columns))
    norms = [_norm(c) for c in cols]
    target = _norm(condition_text)

    for i, cn in enumerate(norms):
        if cn == target: return i
    kws = _keywords_for_condition(condition_text)
    for i, cn in enumerate(norms):
        if any(kw in cn for kw in kws): return i
    for i, cn in enumerate(norms):
        if target and target in cn: return i
    return None

def _find_price(console_name: str, game_name: str, condition_text: str):
    df = load_console_df(console_name)
    if df is None or df.empty or df.shape[1] < 3: return None
    game_series = df.iloc[:, 2].astype(str)
    mask = game_series.str.casefold() == str(game_name).casefold()
    if not mask.any(): return None
    row = df[mask].iloc[0]
    col_idx = _find_condition_column(df, condition_text)
    if col_idx is None: return None
    val = row.iloc[col_idx]
    try:
        if pd.isna(val): return None
        if isinstance(val, str):
            v = val.replace(SETTINGS["currency_symbol"], "").replace("$", "").replace(",", "").strip()
            return float(v) if v else None
        return float(val)
    except Exception:
        return val


class AutoCompleteCombo(CTkComboBox):
    """
    CTkComboBox with live dropdown popup that filters as you type.
    Respects SETTINGS: autocomplete_max_suggestions and autocomplete_match_mode.
    Native CTk command still fires via _on_native_select.
    """
    def __init__(self, master, values=None, max_suggestions=None, match_mode=None, **kwargs):
        self._external_command = kwargs.pop("command", None)
        super().__init__(master, values=values or [], command=self._on_native_select, **kwargs)
        self._all_values = list(values or [])
        self._popup = None
        self._max_suggestions = max_suggestions if max_suggestions is not None else SETTINGS["autocomplete_max_suggestions"]
        self._match_mode = (match_mode or SETTINGS["autocomplete_match_mode"]).lower()  # "substring" or "prefix"

        # Bind typing + focus
        self.bind("<KeyRelease>", self._on_keyrelease)
        self.bind("<Return>", self._on_return)
        self.bind("<Escape>", self._on_escape)
        self.bind("<Down>", self._on_down)
        self.bind("<FocusOut>", self._on_focus_out)

    def _on_native_select(self, value=None):
        if callable(self._external_command):
            self._external_command(value if value is not None else self.get())

    def set_all_values(self, values):
        self._all_values = list(values or [])
        self.configure(values=self._all_values)
        self._update_popup(self._all_values[: self._max_suggestions])

    def set_max_suggestions(self, n: int):
        self._max_suggestions = max(1, int(n))
        self._update_popup(self._all_values[: self._max_suggestions])

    def set_match_mode(self, mode: str):
        mode = (mode or "substring").lower()
        self._match_mode = "prefix" if mode.startswith("prefix") else "substring"

    def _filter_values(self, typed):
        if not typed:
            return self._all_values[: self._max_suggestions]
        t = typed.lower()
        if self._match_mode == "prefix":
            filtered = [v for v in self._all_values if v.lower().startswith(t)]
        else:
            filtered = [v for v in self._all_values if t in v.lower()]
        return filtered[: self._max_suggestions] if filtered else []

   
    def _create_popup(self):
        if self._popup and self._popup.winfo_exists(): return
        self._popup = CTkToplevel(self)
        self._popup.overrideredirect(True)
        self._popup.attributes("-topmost", True)
        self._list_frame = CTkScrollableFrame(self._popup, width=self.winfo_width())
        self._list_frame.pack(fill="both", expand=True, padx=2, pady=2)
        self._popup.bind("<Escape>", lambda e: self._hide_popup())

    def _hide_popup(self):
        if self._popup and self._popup.winfo_exists():
            self._popup.destroy()
        self._popup = None

    def _place_popup(self, item_count):
        if not self._popup or not self._popup.winfo_exists(): return
        self.update_idletasks()
        x = self.winfo_rootx()
        y = self.winfo_rooty() + self.winfo_height()
        w = self.winfo_width()
        h = min(320, 10 + item_count * 34)
        self._popup.geometry(f"{w}x{h}+{x}+{y}")

    def _clear_list(self):
        for child in self._list_frame.winfo_children():
            child.destroy()

    def _fill_list(self, items):
        self._clear_list()
        for text in items:
            btn = CTkButton(
                self._list_frame,
                text=text,
                fg_color="#272822",
                text_color="#FF6F00",
                hover_color="#3a3b3c",
                anchor="w",
                command=lambda t=text: self._select_value(t),
            )
            btn.pack(fill="x", padx=2, pady=2)
            btn.bind("<Return>", lambda e, t=text: self._select_value(t))

    def _update_popup(self, items):
        if not items:
            self._hide_popup(); return
        self._create_popup()
        self._fill_list(items)
        self._place_popup(len(items))

    def _select_value(self, value):
        self.set(value)
        self.configure(values=[value])  
        self._hide_popup()
        if callable(self._external_command):
            self._external_command(value)

    
    def _on_keyrelease(self, event):
        if event.keysym in ("Return","Escape","Up","Down","Left","Right","Tab","Shift_L","Shift_R","Control_L","Control_R","Alt_L","Alt_R"):
            return
        typed = self.get()
        filtered = self._filter_values(typed)
        self.configure(values=filtered if filtered else self._all_values)
        self._update_popup(filtered if filtered else self._all_values[: self._max_suggestions])

    def _on_return(self, event=None):
        typed = self.get()
        filtered = self._filter_values(typed)
        if filtered: self._select_value(filtered[0])
        else: self._hide_popup()

    def _on_escape(self, event=None):
        self._hide_popup()
        self.configure(values=self._all_values[: self._max_suggestions])

    def _on_down(self, event=None):
        if self._popup and self._popup.winfo_exists():
            children = self._list_frame.winfo_children()
            if children: children[0].focus_set()
        return "break"

    def _on_focus_out(self, event=None):
        self.after(150, self._close_if_unfocused)

    def _close_if_unfocused(self):
        if not self.focus_get() and (not self._popup or not self._popup.focus_get()):
            self._hide_popup()


class PriceTab(CTkFrame):
    """A self-contained tab with its own controls and table."""
    def __init__(self, master, initial_console=None, **kwargs):
        super().__init__(master, **kwargs)

        self.grid_columnconfigure((0,1,2,3), weight=1)
        self.grid_rowconfigure(5, weight=1)

        # Console
        self.console_dropdown = AutoCompleteCombo(
            self,
            values=xlsx_files,
            fg_color="#272822",
            text_color="#FF6F00",
            button_hover_color='yellow',
            dropdown_fg_color="#272822",
            dropdown_text_color="#FF6F00",
            command=self.on_console_change,
            max_suggestions=SETTINGS["autocomplete_max_suggestions"],
            match_mode=SETTINGS["autocomplete_match_mode"],
        )
        self.console_dropdown.grid(row=0, column=0, sticky="ew", padx=5, pady=5)
        if xlsx_files:
            self.console_dropdown.set(initial_console or xlsx_files[0])
        else:
            self.console_dropdown.set("No xlsx found")

        # Game
        first_games = load_games_for_console(self.console_dropdown.get() if xlsx_files else None)
        self.game_entry = AutoCompleteCombo(
            self,
            values=first_games,
            width=120,
            fg_color="#272822",
            text_color="#FF6F00",
            command=self.on_game_change,
            max_suggestions=SETTINGS["autocomplete_max_suggestions"],
            match_mode=SETTINGS["autocomplete_match_mode"],
        )
        self.game_entry.grid(row=3, column=0, sticky="ew", padx=5, pady=5)
        if first_games:
            self.game_entry.set(first_games[0])

        
        self.condition_dropdown = CTkComboBox(
            self,
            text_color="#FF6F00",
            width=120,
            button_hover_color="#FF6F00",
            fg_color="#272822",
            dropdown_fg_color="#272822",
            values=[
                'Loose price', 'Cib price', 'New price',
                'Graded price', 'Box only price', 'Manual only price'
            ],
            command=lambda _: self.refresh_price(),
        )
        self.condition_dropdown.grid(row=3, column=1, sticky="ew", padx=5, pady=5)
        self.condition_dropdown.set(SETTINGS["default_condition"])

        # Price label
        self.price_label = CTkLabel(
            self,
            width=120,
            fg_color="#272822",
            text_color="#FF6F00",
            text="Price: —"
        )
        self.price_label.grid(row=3, column=2, sticky="ew", padx=5, pady=5)

        # Add button
        self.add_button = CTkButton(
            self, text='+', width=20, fg_color="#272822", text_color="#FF6F00",
            corner_radius=120, command=self.on_add
        )
        self.add_button.grid(row=3, column=3, sticky="ew", padx=5, pady=5)

        # Table
        table_frame = CTkFrame(self)
        table_frame.grid(row=5, column=0, columnspan=3, sticky="nsew", padx=5, pady=5)

        style = ttk.Style()
        style.theme_use("default")
        style.configure("Game.Treeview",
                        background="#272822",
                        foreground="#FF6F00",
                        fieldbackground="#272822",
                        bordercolor="#272822")
        style.configure("Game.Treeview.Heading", foreground="#FF6F00")
        style.map("Game.Treeview", background=[("selected", "#3a3b3c")])

        # ---- Treeview with Remove column ----
        self.table = ttk.Treeview(
            table_frame,
            columns=("game", "condition", "price", "remove"),
            show="headings",
            style="Game.Treeview"
        )
        self.table.heading("game", text="Game")
        self.table.heading("condition", text="Condition")
        self.table.heading("price", text="Price")
        self.table.heading("remove", text="")  # acts like a button cell

        self.table.column("game", anchor="w", width=420, stretch=True)
        self.table.column("condition", anchor="w", width=200, stretch=True)
        self.table.column("price", anchor="e", width=140, stretch=False)
        self.table.column("remove", anchor="center", width=90, stretch=False)

        ys = ttk.Scrollbar(table_frame, orient="vertical", command=self.table.yview)
        xs = ttk.Scrollbar(table_frame, orient="horizontal", command=self.table.xview)
        self.table.configure(yscroll=ys.set, xscroll=xs.set)

        self.table.grid(row=0, column=0, sticky="nsew")
        ys.grid(row=0, column=1, sticky="ns")
        xs.grid(row=1, column=0, sticky="ew")

        table_frame.grid_rowconfigure(0, weight=1)
        table_frame.grid_columnconfigure(0, weight=1)

        
        self.table.bind("<Button-1>", self._on_table_click)
        self.table.bind("<Delete>", self._on_delete_key)

        
        self.offer_label = CTkLabel(
            self,
            text=f"Offer ({SETTINGS['offer_percentage']}%): {SETTINGS['currency_symbol']}0.00",
            fg_color="#1e1e1e",
            text_color="#FF6F00",
            anchor="e",
            width=240
        )
        self.offer_label.grid(row=6, column=1, sticky="e", padx=10, pady=(5, 10))

        
        self.total_label = CTkLabel(
            self,
            text=f"Total: {SETTINGS['currency_symbol']}0.00",
            fg_color="#1e1e1e",
            text_color="#FF6F00",
            anchor="e",
            width=200
        )
        self.total_label.grid(row=6, column=2, sticky="e", padx=10, pady=(5, 10))

        
        self.refresh_price()

    
    def refresh_price(self):
        console = self.console_dropdown.get()
        game = self.game_entry.get()
        cond = self.condition_dropdown.get()
        if not (console and game and cond):
            self.price_label.configure(text="Price: —"); return
        price = _find_price(console, game, cond)
        cur = SETTINGS["currency_symbol"]
        if price is None or (isinstance(price, float) and (math.isnan(price))):
            self.price_label.configure(text="Price: —")
        else:
            try:
                price_float = float(price)
                self.price_label.configure(text=f"Price: {cur}{price_float:,.2f}")
            except Exception:
                self.price_label.configure(text=f"Price: {price}")

    def on_console_change(self, choice):
        games = load_games_for_console(choice)
        self.game_entry.set_all_values(games)
        if games:
            self.game_entry.set(games[0])
        else:
            self.game_entry.set("")
        self.refresh_price()

    def on_game_change(self, _=None):
        self.refresh_price()

    def on_add(self):
        game = self.game_entry.get().strip()
        cond = self.condition_dropdown.get().strip()
        lbl = self.price_label.cget("text")
        price_text = lbl.split(":", 1)[-1].strip() if ":" in lbl else "—"
        if not price_text:
            price_text = "—"
        if game:
            self.table.insert("", "end", values=(game, cond, price_text, "✖ Remove"))
            self.table.see(self.table.get_children()[-1])
            self.update_total()  # update sum (and offer) after adding

    # ----- totals & offer -----
    def update_total(self):
        total = 0.0
        for row_id in self.table.get_children():
            vals = self.table.item(row_id, "values")
            if len(vals) >= 3:
                price_text = str(vals[2])
                price_text = price_text.replace(SETTINGS["currency_symbol"], "").replace("$", "").replace(",", "").strip()
                try:
                    total += float(price_text)
                except Exception:
                    pass
        cur = SETTINGS['currency_symbol']
        self.total_label.configure(text=f"Total: {cur}{total:,.2f}")

        # Offer = total * offer_percentage / 100
        pct = float(SETTINGS.get("offer_percentage", 0))
        offer_val = total * (pct / 100.0)
        self.offer_label.configure(text=f"Offer ({int(pct)}%): {cur}{offer_val:,.2f}")

    # ----- remove handlers -----
    def _on_table_click(self, event):
        """If the click is on the 'remove' column, delete that row and update totals."""
        region = self.table.identify("region", event.x, event.y)
        if region != "cell":
            return
        col = self.table.identify_column(event.x)   # '#1'..'#4'
        row = self.table.identify_row(event.y)
        if not row:
            return
        if col == "#4":  # Remove column
            try:
                self.table.delete(row)
                self.update_total()
            except Exception:
                pass

    def _on_delete_key(self, event=None):
        """Delete selected rows via Delete key and update totals."""
        try:
            for iid in self.table.selection():
                self.table.delete(iid)
            self.update_total()
        except Exception:
            pass

    # ----- apply new settings live -----
    def apply_settings(self):
        # Autocomplete settings
        self.console_dropdown.set_max_suggestions(SETTINGS["autocomplete_max_suggestions"])
        self.console_dropdown.set_match_mode(SETTINGS["autocomplete_match_mode"])
        self.game_entry.set_max_suggestions(SETTINGS["autocomplete_max_suggestions"])
        self.game_entry.set_match_mode(SETTINGS["autocomplete_match_mode"])

        # Default condition
        try:
            self.condition_dropdown.set(SETTINGS["default_condition"])
        except Exception:
            pass

        # Data path change may alter consoles
        self.console_dropdown.set_all_values(xlsx_files)
        current_console = self.console_dropdown.get()
        if current_console not in xlsx_files and xlsx_files:
            self.console_dropdown.set(xlsx_files[0])
            self.on_console_change(xlsx_files[0])

        # Recompute price label currency, total, and offer
        self.refresh_price()
        self.update_total()

# =========================
# Layout: Toolbar + Tabview
# =========================
toolbar = CTkFrame(window)
toolbar.grid(row=0, column=0, sticky="ew", padx=10, pady=(10, 0))
toolbar.grid_columnconfigure(0, weight=1)

tabview = CTkTabview(window)
tabview.grid(row=1, column=0, sticky="nsew", padx=10, pady=10)
window.grid_rowconfigure(1, weight=1)
window.grid_columnconfigure(0, weight=1)

tab_counter = {"n": 0}
tab_frames = {}  # name -> PriceTab

def add_new_tab():
    tab_counter["n"] += 1
    default_name = f"Tab {tab_counter['n']}"
    try:
        dlg = CTkInputDialog(text="Name this tab:", title="New Tab")
        name = dlg.get_input()
        if not name:
            name = default_name
    except Exception:
        name = default_name

    base = name
    suffix = 1
    while name in getattr(tabview, "_name_list", []):
        suffix += 1
        name = f"{base} ({suffix})"

    tab = tabview.add(name)
    view = PriceTab(tab)
    view.pack(fill="both", expand=True)
    tab_frames[name] = view
    tabview.set(name)

def close_current_tab():
    current = tabview.get()
    if not current:
        return
    if len(getattr(tabview, "_name_list", [])) <= 1:
        return
    tabview.delete(current)
    tab_frames.pop(current, None)

def rename_current_tab():
    current = tabview.get()
    if not current:
        return
    try:
        dlg = CTkInputDialog(text="New name for this tab:", title="Rename Tab")
        new_name = dlg.get_input()
        if not new_name or new_name == current:
            return
    except Exception:
        return

    base = new_name
    suffix = 1
    while new_name in getattr(tabview, "_name_list", []):
        suffix += 1
        new_name = f"{base} ({suffix})"

    frame = tab_frames.get(current)
    if not frame:
        return

    tabview.delete(current)
    new_tab = tabview.add(new_name)
    frame.master = new_tab
    frame.pack_forget()
    frame.pack(fill="both", expand=True)

    tab_frames.pop(current, None)
    tab_frames[new_name] = frame
    tabview.set(new_name)

# =========================
# Settings Window
# =========================
class SettingsWindow(CTkToplevel):
    def __init__(self, master):
        super().__init__(master)
        self.title("Settings")
        self.geometry("560x440")
        self.attributes("-topmost", True)

        self.grid_columnconfigure(1, weight=1)

        # Data path
        CTkLabel(self, text="Database folder (xlsx):").grid(row=0, column=0, padx=10, pady=10, sticky="e")
        self.data_path_entry = CTkEntry(self)
        self.data_path_entry.insert(0, SETTINGS["data_path"])
        self.data_path_entry.grid(row=0, column=1, padx=10, pady=10, sticky="ew")
        CTkButton(self, text="Browse…", command=self._browse).grid(row=0, column=2, padx=10, pady=10)

        # Theme
        CTkLabel(self, text="Theme:").grid(row=1, column=0, padx=10, pady=10, sticky="e")
        self.theme_combo = CTkComboBox(self, values=["Dark", "Light", "System"])
        self.theme_combo.set(SETTINGS["theme"])
        self.theme_combo.grid(row=1, column=1, padx=10, pady=10, sticky="w")

        # Autocomplete max suggestions
        CTkLabel(self, text="Autocomplete: max suggestions").grid(row=2, column=0, padx=10, pady=10, sticky="e")
        self.max_sug_entry = CTkEntry(self, width=100)
        self.max_sug_entry.insert(0, str(SETTINGS["autocomplete_max_suggestions"]))
        self.max_sug_entry.grid(row=2, column=1, padx=10, pady=10, sticky="w")

        # Autocomplete match mode
        CTkLabel(self, text="Autocomplete: match mode").grid(row=3, column=0, padx=10, pady=10, sticky="e")
        self.match_mode_combo = CTkComboBox(self, values=["Substring", "Prefix"])
        self.match_mode_combo.set(SETTINGS["autocomplete_match_mode"])
        self.match_mode_combo.grid(row=3, column=1, padx=10, pady=10, sticky="w")

        # Default condition
        CTkLabel(self, text="Default condition:").grid(row=4, column=0, padx=10, pady=10, sticky="e")
        self.default_cond_combo = CTkComboBox(self, values=[
            'Loose price', 'Cib price', 'New price',
            'Graded price', 'Box only price', 'Manual only price'
        ])
        self.default_cond_combo.set(SETTINGS["default_condition"])
        self.default_cond_combo.grid(row=4, column=1, padx=10, pady=10, sticky="w")

        # Currency symbol
        CTkLabel(self, text="Currency symbol:").grid(row=5, column=0, padx=10, pady=10, sticky="e")
        self.currency_entry = CTkEntry(self, width=100)
        self.currency_entry.insert(0, SETTINGS["currency_symbol"])
        self.currency_entry.grid(row=5, column=1, padx=10, pady=10, sticky="w")

        # Offer percentage
        CTkLabel(self, text="Offer percentage (%):").grid(row=6, column=0, padx=10, pady=10, sticky="e")
        self.offer_entry = CTkEntry(self, width=100)
        self.offer_entry.insert(0, str(SETTINGS["offer_percentage"]))
        self.offer_entry.grid(row=6, column=1, padx=10, pady=10, sticky="w")

        # Action buttons
        btn_row = CTkFrame(self)
        btn_row.grid(row=7, column=0, columnspan=3, pady=20)
        CTkButton(btn_row, text="Apply", command=self.apply).grid(row=0, column=0, padx=10)
        CTkButton(btn_row, text="Save", command=self.save).grid(row=0, column=1, padx=10)
        CTkButton(btn_row, text="Close", command=self.destroy).grid(row=0, column=2, padx=10)

    def _browse(self):
        folder = filedialog.askdirectory(initialdir=SETTINGS["data_path"] if os.path.isdir(SETTINGS["data_path"]) else os.path.expanduser("~"))
        if folder:
            self.data_path_entry.delete(0, "end")
            self.data_path_entry.insert(0, folder)

    def _collect(self):
        data_path = self.data_path_entry.get().strip()
        theme = self.theme_combo.get().strip() or "Dark"
        try:
            max_sug = int(self.max_sug_entry.get().strip())
        except Exception:
            max_sug = DEFAULT_SETTINGS["autocomplete_max_suggestions"]
        match_mode = self.match_mode_combo.get().strip() or "Substring"
        default_cond = self.default_cond_combo.get().strip() or "Loose price"
        currency = self.currency_entry.get().strip() or "$"
        try:
            offer_pct = float(self.offer_entry.get().strip())
        except Exception:
            offer_pct = DEFAULT_SETTINGS["offer_percentage"]
        # clamp to [0,100]
        offer_pct = max(0.0, min(100.0, offer_pct))
        return {
            "data_path": data_path,
            "theme": theme,
            "autocomplete_max_suggestions": max(1, max_sug),
            "autocomplete_match_mode": "Prefix" if match_mode.lower().startswith("prefix") else "Substring",
            "default_condition": default_cond,
            "currency_symbol": currency,
            "offer_percentage": offer_pct,
        }

    def _apply_to_globals(self, new_vals):
        changed_path = new_vals["data_path"] != SETTINGS["data_path"]
        SETTINGS.update(new_vals)

        # Theme
        set_appearance_mode(SETTINGS["theme"].lower())

        # Data path refresh
        if changed_path:
            _DF_CACHE.clear()
            refresh_xlsx_files()

        # Push settings to all tabs
        for name, frame in list(tab_frames.items()):
            if isinstance(frame, PriceTab):
                frame.apply_settings()

    def apply(self):
        vals = self._collect()
        self._apply_to_globals(vals)

    def save(self):
        vals = self._collect()
        self._apply_to_globals(vals)
        save_settings()

# =========================
# Toolbar buttons
# =========================
def open_settings():
    SettingsWindow(window)

add_btn = CTkButton(toolbar, text="New Tab", command=add_new_tab, fg_color="#2a2a2a")
rename_btn = CTkButton(toolbar, text="Rename Tab", command=rename_current_tab, fg_color="#2a2a2a")
close_btn = CTkButton(toolbar, text="Close Tab", command=close_current_tab, fg_color="#2a2a2a")
settings_btn = CTkButton(toolbar, text="Settings ⚙️", command=open_settings, fg_color="#2a2a2a")

add_btn.grid(row=0, column=1, padx=5, pady=5, sticky="w")
rename_btn.grid(row=0, column=2, padx=5, pady=5, sticky="w")
close_btn.grid(row=0, column=3, padx=5, pady=5, sticky="w")
settings_btn.grid(row=0, column=4, padx=5, pady=5, sticky="w")

# Create initial tab
add_new_tab()

window.mainloop()
