from customtkinter import *
from tkinter import ttk
import math
from ..config import SETTINGS
from .. import data_storing
from ..data_storing import load_games_for_console
from ..pricing import _find_price
from .widgets import AutoCompleteCombo

class PriceTab(CTkFrame):
    """A self-contained tab with its own controls and table."""
    def __init__(self, master, initial_console=None, **kwargs):
        super().__init__(master, **kwargs)

        self.grid_columnconfigure((0,1,2,3), weight=1)
        self.grid_rowconfigure(5, weight=1)

        # Console
        self.console_dropdown = AutoCompleteCombo(
            self,
            values=data_storing.xlsx_files,   # <— refer to module var so it reflects refreshes
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
        if data_storing.xlsx_files:
            self.console_dropdown.set(initial_console or data_storing.xlsx_files[0])
        else:
            self.console_dropdown.set("No xlsx found")

        # Game
        first_games = load_games_for_console(self.console_dropdown.get() if data_storing.xlsx_files else None)
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

        pct = float(SETTINGS.get("offer_percentage", 0))
        offer_val = total * (pct / 100.0)
        self.offer_label.configure(text=f"Offer ({int(pct)}%): {cur}{offer_val:,.2f}")

    # ----- remove handlers -----
    def _on_table_click(self, event):
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
        try:
            for iid in self.table.selection():
                self.table.delete(iid)
            self.update_total()
        except Exception:
            pass

    # ----- apply new settings live -----
    def apply_settings(self):
        self.console_dropdown.set_max_suggestions(SETTINGS["autocomplete_max_suggestions"])
        self.console_dropdown.set_match_mode(SETTINGS["autocomplete_match_mode"])
        self.game_entry.set_max_suggestions(SETTINGS["autocomplete_max_suggestions"])
        self.game_entry.set_match_mode(SETTINGS["autocomplete_match_mode"])

        try:
            self.condition_dropdown.set(SETTINGS["default_condition"])
        except Exception:
            pass

        # Data path change may alter consoles
        self.console_dropdown.set_all_values(data_storing.xlsx_files)
        current_console = self.console_dropdown.get()
        if current_console not in data_storing.xlsx_files and data_storing.xlsx_files:
            self.console_dropdown.set(data_storing.xlsx_files[0])
            self.on_console_change(data_storing.xlsx_files[0])

        self.refresh_price()
        self.update_total()
