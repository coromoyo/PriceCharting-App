from customtkinter import *
from ..config import SETTINGS

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
