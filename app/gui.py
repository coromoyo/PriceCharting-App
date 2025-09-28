from customtkinter import *
from tkinter import filedialog
from pricechart.config import CONFIG_PATH, DEFAULT_SETTINGS, SETTINGS, load_settings, save_settings
from pricechart import data_store
from pricechart.data_storing import refresh_xlsx_files
from pricechart.UI.tabs import PriceTab

# initialize theming (same as original)
set_appearance_mode(SETTINGS["theme"].lower())
set_default_color_theme("dark-blue")

# Main window
window = CTk()
window.geometry('1200x900')
window.title("Price Chart Speed — Multi-Tab + Settings")

# Layout: Toolbar + Tabview
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

# Settings Window
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
        initial = SETTINGS["data_path"]
        folder = filedialog.askdirectory(initialdir=initial if os.path.isdir(initial) else os.path.expanduser("~"))
        if folder:
            self.data_path_entry.delete(0, "end")
            self.data_path_entry.insert(0, folder)

    def _collect(self):
        try:
            max_sug = int(self.max_sug_entry.get().strip())
        except Exception:
            max_sug = DEFAULT_SETTINGS["autocomplete_max_suggestions"]
        try:
            offer_pct = float(self.offer_entry.get().strip())
        except Exception:
            offer_pct = DEFAULT_SETTINGS["offer_percentage"]
        offer_pct = max(0.0, min(100.0, offer_pct))
        return {
            "data_path": self.data_path_entry.get().strip(),
            "theme": self.theme_combo.get().strip() or "Dark",
            "autocomplete_max_suggestions": max(1, max_sug),
            "autocomplete_match_mode": "Prefix" if (self.match_mode_combo.get().strip() or "Substring").lower().startswith("prefix") else "Substring",
            "default_condition": self.default_cond_combo.get().strip() or "Loose price",
            "currency_symbol": self.currency_entry.get().strip() or "$",
            "offer_percentage": offer_pct,
        }

    def _apply_to_globals(self, new_vals):
        changed_path = new_vals["data_path"] != SETTINGS["data_path"]
        SETTINGS.update(new_vals)

        # Theme
        set_appearance_mode(SETTINGS["theme"].lower())

        # Data path refresh
        if changed_path:
            data_store._DF_CACHE.clear()
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

# Toolbar buttons
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

# Create initial tab & start
add_new_tab()
window.mainloop()
