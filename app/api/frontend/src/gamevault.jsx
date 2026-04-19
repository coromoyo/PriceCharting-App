import { useState, useEffect, useRef } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart } from "recharts";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const SALES_TREND = [
  { month: "Oct", revenue: 3200, profit: 1100 },
  { month: "Nov", revenue: 4800, profit: 1900 },
  { month: "Dec", revenue: 7200, profit: 3100 },
  { month: "Jan", revenue: 5100, profit: 2000 },
  { month: "Feb", revenue: 6400, profit: 2700 },
  { month: "Mar", revenue: 5800, profit: 2300 },
];

const PLATFORM_PROFIT = [
  { name: "NES", value: 2400, color: "#F87171" },
  { name: "SNES", value: 3800, color: "#A78BFA" },
  { name: "N64", value: 1900, color: "#34D399" },
  { name: "PS1", value: 2100, color: "#60A5FA" },
  { name: "PS2", value: 1400, color: "#FBBF24" },
  { name: "GameBoy", value: 1700, color: "#2DD4BF" },
];

const INVENTORY_STAGES = [
  { stage: "Received", count: 23, color: "#94A3B8" },
  { stage: "Testing", count: 12, color: "#FBBF24" },
  { stage: "Cleaning", count: 8, color: "#A78BFA" },
  { stage: "Photos", count: 5, color: "#60A5FA" },
  { stage: "Ready to List", count: 18, color: "#34D399" },
  { stage: "Listed", count: 42, color: "#2DD4BF" },
];

const MOCK_QUOTES = [
  { id: "Q-1042", seller: "Marcus Johnson", items: 47, value: 1850, status: "pending", date: "2026-03-14", source: "Facebook Marketplace" },
  { id: "Q-1041", seller: "Sarah Chen", items: 23, value: 920, status: "draft", date: "2026-03-15", source: "Local Pickup" },
  { id: "Q-1040", seller: "RetroGameShop", items: 112, value: 4200, status: "accepted", date: "2026-03-10", source: "eBay Seller" },
  { id: "Q-1039", seller: "Mike Torres", items: 8, value: 340, status: "rejected", date: "2026-03-08", source: "OfferUp" },
  { id: "Q-1038", seller: "Emily Park", items: 31, value: 1100, status: "awaiting review", date: "2026-03-12", source: "Facebook Marketplace" },
  { id: "Q-1037", seller: "Jake Williams", items: 65, value: 2800, status: "accepted", date: "2026-03-05", source: "Yard Sale" },
  { id: "Q-1036", seller: "Lisa Nguyen", items: 19, value: 650, status: "expired", date: "2026-02-20", source: "Trade-In" },
  { id: "Q-1035", seller: "Dave Schmidt", items: 54, value: 2100, status: "in progress", date: "2026-03-16", source: "Auction" },
];

const MOCK_QUOTE_ITEMS = [
  { id: 1, title: "Super Mario World", platform: "SNES", condition: "CIB", qty: 1, market: 45, offer: 27, profit: 10.5, included: true, img: "🎮" },
  { id: 2, title: "The Legend of Zelda: A Link to the Past", platform: "SNES", condition: "Loose", qty: 1, market: 32, offer: 19, profit: 7.2, included: true, img: "🗡️" },
  { id: 3, title: "Chrono Trigger", platform: "SNES", condition: "CIB", qty: 1, market: 220, offer: 132, profit: 52, included: true, img: "⏰" },
  { id: 4, title: "Donkey Kong Country", platform: "SNES", condition: "Loose", qty: 1, market: 22, offer: 13, profit: 4.8, included: true, img: "🦍" },
  { id: 5, title: "Final Fantasy III", platform: "SNES", condition: "CIB", qty: 1, market: 85, offer: 51, profit: 19.5, included: true, img: "⚔️" },
  { id: 6, title: "Mega Man X", platform: "SNES", condition: "Loose", qty: 1, market: 28, offer: 17, profit: 5.9, included: true, img: "🤖" },
  { id: 7, title: "Street Fighter II Turbo", platform: "SNES", condition: "Loose", qty: 2, market: 15, offer: 9, profit: 2.8, included: true, img: "👊" },
  { id: 8, title: "Super Metroid", platform: "SNES", condition: "CIB", qty: 1, market: 95, offer: 57, profit: 22, included: true, img: "🚀" },
  { id: 9, title: "Mario Paint", platform: "SNES", condition: "Loose", qty: 1, market: 8, offer: 3, profit: -1.2, included: false, img: "🎨" },
  { id: 10, title: "SNES Console", platform: "SNES", condition: "Good", qty: 1, market: 75, offer: 40, profit: 15, included: true, img: "🕹️" },
  { id: 11, title: "Controller (x2)", platform: "SNES", condition: "Fair", qty: 2, market: 12, offer: 6, profit: 1.5, included: true, img: "🎛️" },
  { id: 12, title: "NBA Jam", platform: "SNES", condition: "Loose", qty: 1, market: 10, offer: 5, profit: 0.8, included: true, img: "🏀" },
];

const MOCK_INVENTORY = [
  { id: "INV-2201", title: "Pokémon Red", platform: "GameBoy", condition: "Loose", cost: 28, market: 52, status: "listed", location: "Bin A3", source: "Q-1040", date: "2026-03-10" },
  { id: "INV-2202", title: "Super Smash Bros.", platform: "N64", condition: "CIB", cost: 35, market: 68, status: "listed", location: "Shelf B1", source: "Q-1040", date: "2026-03-10" },
  { id: "INV-2203", title: "Final Fantasy VII", platform: "PS1", condition: "CIB", cost: 22, market: 42, status: "ready to list", location: "Bin C2", source: "Q-1037", date: "2026-03-05" },
  { id: "INV-2204", title: "GBA SP Console", platform: "GBA", condition: "Good", cost: 45, market: 90, status: "testing", location: "Workbench", source: "Q-1037", date: "2026-03-05" },
  { id: "INV-2205", title: "Metroid Prime", platform: "GameCube", condition: "CIB", cost: 18, market: 38, status: "cleaning", location: "Workbench", source: "Q-1040", date: "2026-03-10" },
  { id: "INV-2206", title: "Castlevania: SOTN", platform: "PS1", condition: "Loose", cost: 40, market: 78, status: "listed", location: "Bin D1", source: "Q-1037", date: "2026-03-05" },
  { id: "INV-2207", title: "Kirby Super Star", platform: "SNES", condition: "Loose", cost: 25, market: 48, status: "photos", location: "Photo Station", source: "Q-1040", date: "2026-03-10" },
  { id: "INV-2208", title: "Earthbound", platform: "SNES", condition: "Loose", cost: 120, market: 235, status: "listed", location: "Display Case", source: "Q-1037", date: "2026-03-05" },
  { id: "INV-2209", title: "Mario Kart 64", platform: "N64", condition: "Loose", cost: 18, market: 35, status: "received", location: "Intake", source: "Q-1040", date: "2026-03-10" },
  { id: "INV-2210", title: "Sonic Adventure 2", platform: "Dreamcast", condition: "CIB", cost: 30, market: 55, status: "listed", location: "Bin A5", source: "Q-1037", date: "2026-03-05" },
];

const MOCK_SALES = [
  { id: "S-501", title: "Zelda: OoT", platform: "N64", condition: "CIB", sold: 65, cost: 28, fees: 8.45, shipping: 4.50, profit: 24.05, margin: 37, date: "2026-03-15", channel: "eBay", source: "Q-1037", status: "sold" },
  { id: "S-500", title: "Pokémon Crystal", platform: "GBC", condition: "Loose", sold: 85, cost: 38, fees: 11.05, shipping: 4.00, profit: 31.95, margin: 37.6, date: "2026-03-14", channel: "eBay", source: "Q-1040", status: "sold" },
  { id: "S-499", title: "Mega Man X3", platform: "SNES", condition: "Loose", sold: 145, cost: 72, fees: 18.85, shipping: 5.00, profit: 49.15, margin: 33.9, date: "2026-03-13", channel: "Mercari", source: "Q-1037", status: "sold" },
  { id: "S-498", title: "Mario Party 2", platform: "N64", condition: "Loose", sold: 38, cost: 15, fees: 4.94, shipping: 4.50, profit: 13.56, margin: 35.7, date: "2026-03-12", channel: "eBay", source: "Q-1040", status: "sold" },
  { id: "S-497", title: "Resident Evil 2", platform: "PS1", condition: "CIB", sold: 42, cost: 18, fees: 5.46, shipping: 4.50, profit: 14.04, margin: 33.4, date: "2026-03-11", channel: "eBay", source: "Q-1037", status: "sold" },
  { id: "S-496", title: "Sonic 3 & Knuckles", platform: "Genesis", condition: "CIB", sold: 35, cost: 12, fees: 4.55, shipping: 4.00, profit: 14.45, margin: 41.3, date: "2026-03-10", channel: "Mercari", source: "Q-1040", status: "sold" },
  { id: "S-495", title: "Golden Sun", platform: "GBA", condition: "Loose", sold: 28, cost: 10, fees: 3.64, shipping: 3.50, profit: 10.86, margin: 38.8, date: "2026-03-09", channel: "eBay", source: "Q-1037", status: "refunded" },
  { id: "S-494", title: "Fire Emblem", platform: "GBA", condition: "Loose", sold: 55, cost: 25, fees: 7.15, shipping: 3.50, profit: 19.35, margin: 35.2, date: "2026-03-08", channel: "eBay", source: "Q-1040", status: "sold" },
];

const MOCK_TASKS = [
  { id: 1, title: "Test GBA SP Console", item: "INV-2204", due: "2026-03-16", priority: "high", status: "open" },
  { id: 2, title: "Clean Metroid Prime disc", item: "INV-2205", due: "2026-03-16", priority: "medium", status: "in progress" },
  { id: 3, title: "Photograph Kirby Super Star", item: "INV-2207", due: "2026-03-17", priority: "medium", status: "open" },
  { id: 4, title: "Create eBay listing - FF VII", item: "INV-2203", due: "2026-03-17", priority: "low", status: "open" },
  { id: 5, title: "Verify Earthbound label", item: "INV-2208", due: "2026-03-15", priority: "high", status: "done" },
];

const MOCK_SELLERS = [
  { id: 1, name: "Marcus Johnson", type: "Facebook Marketplace", quotes: 3, accepted: 1, totalSpent: 1850, totalProfit: 620, city: "Greensboro, NC" },
  { id: 2, name: "Sarah Chen", type: "Local Pickup", quotes: 5, accepted: 3, totalSpent: 2400, totalProfit: 980, city: "Burlington, NC" },
  { id: 3, name: "RetroGameShop", type: "eBay Seller", quotes: 8, accepted: 6, totalSpent: 12500, totalProfit: 4200, city: "Online" },
  { id: 4, name: "Mike Torres", type: "OfferUp", quotes: 2, accepted: 0, totalSpent: 0, totalProfit: 0, city: "Durham, NC" },
  { id: 5, name: "Emily Park", type: "Facebook Marketplace", quotes: 4, accepted: 2, totalSpent: 3100, totalProfit: 1100, city: "Raleigh, NC" },
];

const MOCK_PRESETS = [
  { id: 1, name: "Standard Buy", offerPct: 60, fees: 13, shipping: 4.5, labor: 2, risk: 5, desc: "Default buying strategy for average collections" },
  { id: 2, name: "Aggressive Buy", offerPct: 70, fees: 13, shipping: 4.5, labor: 2, risk: 3, desc: "Higher offers for premium collections" },
  { id: 3, name: "Trade-In Offer", offerPct: 45, fees: 0, shipping: 0, labor: 1, risk: 2, desc: "Walk-in trade offers, no shipping" },
  { id: 4, name: "Liquidation", offerPct: 35, fees: 13, shipping: 5, labor: 1, risk: 10, desc: "Low-ball offers for bulk lots" },
];

const MATCH_QUEUE = [
  { id: 1, original: "super mario wrld snes", matched: "Super Mario World", platform: "SNES", confidence: 92, status: "partial", issue: null },
  { id: 2, original: "zelda link past", matched: "The Legend of Zelda: A Link to the Past", platform: "SNES", confidence: 85, status: "partial", issue: "Abbreviated title" },
  { id: 3, original: "chrono trigger complete", matched: "Chrono Trigger", platform: "SNES", confidence: 98, status: "matched", issue: null },
  { id: 4, original: "mega man x snes cart", matched: "Mega Man X", platform: "SNES", confidence: 90, status: "matched", issue: null },
  { id: 5, original: "some random game idk", matched: null, platform: null, confidence: 0, status: "unmatched", issue: "No match found" },
  { id: 6, original: "ff3 snes", matched: "Final Fantasy III", platform: "SNES", confidence: 78, status: "partial", issue: "Ambiguous abbreviation" },
  { id: 7, original: "donkey kong country", matched: "Donkey Kong Country", platform: "SNES", confidence: 99, status: "matched", issue: null },
  { id: 8, original: "street fighter 2 turbo x2", matched: "Street Fighter II Turbo", platform: "SNES", confidence: 88, status: "partial", issue: "Quantity in title" },
];

// ─── DARK THEME STYLE CONSTANTS ───────────────────────────────────────────────

const ACCENT = "#2DD4BF";
const ACCENT_LIGHT = "#134E4A";
const ACCENT_BG = "#0F2E2B";
const BG_BASE = "#0B0F14";
const BG_CARD = "#111820";
const BG_ELEVATED = "#171F2A";
const SURFACE = "#151C25";
const BORDER = "#1E2A36";
const BORDER_LIGHT = "#263344";
const TEXT = "#E8ECF2";
const TEXT_SECONDARY = "#8899AA";
const TEXT_MUTED = "#556677";
const DANGER = "#F87171";
const DANGER_DIM = "#7F1D1D";
const WARNING = "#FBBF24";
const WARNING_DIM = "#78350F";
const SUCCESS = "#34D399";
const SUCCESS_DIM = "#064E3B";
const INFO_DIM = "#1E3A5F";

// ─── UTILITY COMPONENTS ───────────────────────────────────────────────────────

const StatusChip = ({ status }) => {
  const map = {
    draft: { bg: "#1E2A36", color: "#8899AA", label: "Draft" },
    "in progress": { bg: "#1E3A5F", color: "#60A5FA", label: "In Progress" },
    "awaiting review": { bg: WARNING_DIM, color: WARNING, label: "Awaiting Review" },
    pending: { bg: WARNING_DIM, color: WARNING, label: "Pending" },
    accepted: { bg: SUCCESS_DIM, color: SUCCESS, label: "Accepted" },
    rejected: { bg: DANGER_DIM, color: DANGER, label: "Rejected" },
    expired: { bg: "#1E2A36", color: TEXT_MUTED, label: "Expired" },
    sold: { bg: SUCCESS_DIM, color: SUCCESS, label: "Sold" },
    refunded: { bg: DANGER_DIM, color: DANGER, label: "Refunded" },
    listed: { bg: "#1E3A5F", color: "#60A5FA", label: "Listed" },
    "ready to list": { bg: SUCCESS_DIM, color: SUCCESS, label: "Ready to List" },
    testing: { bg: WARNING_DIM, color: WARNING, label: "Testing" },
    cleaning: { bg: "#2E1065", color: "#A78BFA", label: "Cleaning" },
    photos: { bg: "#1E3A5F", color: "#60A5FA", label: "Photos" },
    received: { bg: "#1E2A36", color: "#8899AA", label: "Received" },
    open: { bg: WARNING_DIM, color: WARNING, label: "Open" },
    "in progress": { bg: "#1E3A5F", color: "#60A5FA", label: "In Progress" },
    done: { bg: SUCCESS_DIM, color: SUCCESS, label: "Done" },
    blocked: { bg: DANGER_DIM, color: DANGER, label: "Blocked" },
    matched: { bg: SUCCESS_DIM, color: SUCCESS, label: "Matched" },
    partial: { bg: WARNING_DIM, color: WARNING, label: "Partial" },
    unmatched: { bg: DANGER_DIM, color: DANGER, label: "Unmatched" },
  };
  const s = map[status] || { bg: "#1E2A36", color: "#8899AA", label: status };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600, letterSpacing: "0.01em", background: s.bg, color: s.color, whiteSpace: "nowrap" }}>
      {s.label}
    </span>
  );
};

const PriorityDot = ({ priority }) => {
  const colors = { high: DANGER, medium: WARNING, low: SUCCESS };
  return <span style={{ width: 8, height: 8, borderRadius: "50%", background: colors[priority] || TEXT_MUTED, display: "inline-block" }} />;
};

const Card = ({ children, style = {}, onClick }) => (
  <div onClick={onClick} style={{ background: BG_CARD, borderRadius: 12, border: `1px solid ${BORDER}`, padding: 24, ...style, ...(onClick ? { cursor: "pointer", transition: "box-shadow 0.2s, border-color 0.2s" } : {}) }}
    onMouseEnter={onClick ? (e) => { e.currentTarget.style.boxShadow = "0 4px 32px rgba(0,0,0,0.3)"; e.currentTarget.style.borderColor = ACCENT; } : undefined}
    onMouseLeave={onClick ? (e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = BORDER; } : undefined}
  >
    {children}
  </div>
);

const MetricCard = ({ label, value, sub, icon, trend }) => (
  <Card style={{ flex: "1 1 160px", minWidth: 160 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <div style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: TEXT, fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em" }}>{value}</div>
        {sub && <div style={{ fontSize: 13, color: trend === "up" ? SUCCESS : trend === "down" ? DANGER : TEXT_SECONDARY, marginTop: 4, fontWeight: 500 }}>{sub}</div>}
      </div>
      <div style={{ fontSize: 24, opacity: 0.4 }}>{icon}</div>
    </div>
  </Card>
);

const SectionHeader = ({ title, action, onAction }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
    <h3 style={{ fontSize: 16, fontWeight: 700, color: TEXT, margin: 0, fontFamily: "'Outfit', sans-serif" }}>{title}</h3>
    {action && <button onClick={onAction} style={{ background: "none", border: "none", color: ACCENT, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "4px 8px", borderRadius: 6 }}>{action}</button>}
  </div>
);

const SearchBar = ({ value, onChange, placeholder }) => (
  <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: TEXT_MUTED, fontSize: 16 }}>⌕</span>
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || "Search..."} style={{ width: "100%", padding: "9px 12px 9px 36px", border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 14, color: TEXT, background: BG_ELEVATED, outline: "none", fontFamily: "'Source Sans 3', sans-serif", boxSizing: "border-box" }} />
  </div>
);

const FilterChip = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${active ? ACCENT : BORDER}`, background: active ? ACCENT_BG : BG_ELEVATED, color: active ? ACCENT : TEXT_SECONDARY, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s" }}>
    {label}
  </button>
);

const Btn = ({ children, variant = "primary", onClick, style = {}, small }) => {
  const styles = {
    primary: { background: ACCENT, color: "#0B0F14", border: "none" },
    secondary: { background: BG_ELEVATED, color: TEXT, border: `1px solid ${BORDER}` },
    ghost: { background: "transparent", color: TEXT_SECONDARY, border: "none" },
    danger: { background: DANGER_DIM, color: DANGER, border: "none" },
  };
  return (
    <button onClick={onClick} style={{ padding: small ? "6px 12px" : "9px 18px", borderRadius: 8, fontSize: small ? 12 : 14, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, transition: "all 0.15s", fontFamily: "'Source Sans 3', sans-serif", ...styles[variant], ...style }}>
      {children}
    </button>
  );
};

const EmptyState = ({ icon, title, desc }) => (
  <div style={{ textAlign: "center", padding: "48px 24px", color: TEXT_MUTED }}>
    <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
    <div style={{ fontSize: 16, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 4 }}>{title}</div>
    <div style={{ fontSize: 14 }}>{desc}</div>
  </div>
);

// ─── NAVIGATION ───────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "◫" },
  { id: "quotes", label: "Quotes", icon: "◈" },
  { id: "imports", label: "Imports", icon: "↗" },
  { id: "match", label: "Match Review", icon: "⊘" },
  { id: "inventory", label: "Inventory", icon: "▤" },
  { id: "tasks", label: "Tasks", icon: "☐" },
  { id: "sales", label: "Sales History", icon: "◉" },
  { id: "reports", label: "Reports", icon: "▥" },
  { id: "sellers", label: "Sellers", icon: "◎" },
  { id: "presets", label: "Presets", icon: "⚙" },
  { id: "settings", label: "Settings", icon: "⊡" },
];

const Sidebar = ({ active, onNavigate }) => (
  <nav style={{ width: 240, minHeight: "100vh", background: BG_CARD, borderRight: `1px solid ${BORDER}`, padding: "24px 0", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, zIndex: 100, overflowY: "auto" }}>
    <div style={{ padding: "0 24px 28px", display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${ACCENT}, #60A5FA)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#0B0F14", fontWeight: 800, fontSize: 16, fontFamily: "'Outfit', sans-serif" }}>G</div>
      <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 18, color: TEXT, letterSpacing: "-0.03em" }}>GameVault</span>
    </div>
    <div style={{ flex: 1 }}>
      {NAV_ITEMS.map((item) => (
        <button key={item.id} onClick={() => onNavigate(item.id)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "10px 24px", background: active === item.id ? ACCENT_BG : "transparent", color: active === item.id ? ACCENT : TEXT_SECONDARY, border: "none", cursor: "pointer", fontSize: 14, fontWeight: active === item.id ? 700 : 500, textAlign: "left", borderRight: active === item.id ? `3px solid ${ACCENT}` : "3px solid transparent", transition: "all 0.15s", fontFamily: "'Source Sans 3', sans-serif" }}>
          <span style={{ fontSize: 16, width: 20, textAlign: "center", opacity: active === item.id ? 1 : 0.5 }}>{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>
    <div style={{ padding: "16px 24px", borderTop: `1px solid ${BORDER}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: ACCENT_LIGHT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: ACCENT }}>JR</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>Jordan R.</div>
          <div style={{ fontSize: 11, color: TEXT_MUTED }}>Admin</div>
        </div>
      </div>
    </div>
  </nav>
);

// ─── TOOLTIP STYLE ────────────────────────────────────────────────────────────
const TOOLTIP_STYLE = { borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 13, background: BG_ELEVATED, color: TEXT };

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

const Dashboard = ({ onNavigate }) => {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setTimeout(() => setLoaded(true), 50); }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, opacity: loaded ? 1 : 0, transition: "opacity 0.35s" }}>
      {/* ── TOP BAR */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: TEXT, margin: 0, fontFamily: "'Outfit',sans-serif", letterSpacing: "-0.03em" }}>Dashboard</h1>
          <p style={{ fontSize: 12, color: TEXT_SECONDARY, margin: "2px 0 0" }}>Monday, March 16, 2026</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn small onClick={() => onNavigate("quotes")}>+ New Quote</Btn>
          <Btn small variant="secondary" onClick={() => onNavigate("imports")}>↗ Import</Btn>
          <Btn small variant="secondary" onClick={() => onNavigate("inventory")}>▤ Inventory</Btn>
          <Btn small variant="secondary" onClick={() => onNavigate("sales")}>◉ Sales</Btn>
          <Btn small variant="secondary" onClick={() => onNavigate("reports")}>▥ Reports</Btn>
        </div>
      </div>

      {/* ── 4-COLUMN GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 1fr 252px", gap: 16, alignItems: "start" }}>

        {/* COL 1 — Metrics */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { label: "Inventory Value", value: "$8,420", sub: "↑ 12% vs last month", trend: "up", icon: "📦" },
            { label: "Cost Basis",      value: "$3,860", icon: "💵" },
            { label: "Proj. Profit",    value: "$4,560", sub: "54% margin", trend: "up", icon: "📈" },
            { label: "Sold This Month", value: "$2,310", sub: "14 items", icon: "🏷️" },
            { label: "Accept Rate",     value: "62%",    sub: "↑ from 55%", trend: "up", icon: "✓" },
          ].map((m, i) => (
            <div key={i} style={{ padding: "10px 12px", borderRadius: 10, background: BG_CARD, border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 20, flexShrink: 0 }}>{m.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, color: TEXT_MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{m.label}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: TEXT, fontFamily: "'Outfit',sans-serif", letterSpacing: "-0.02em" }}>{m.value}</div>
                {m.sub && <div style={{ fontSize: 10, color: m.trend === "up" ? SUCCESS : m.trend === "down" ? DANGER : TEXT_SECONDARY }}>{m.sub}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* COL 2 — Active Quotes + Sales Chart */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, minHeight: 0 }}>
          <Card style={{ flexShrink: 0 }}>
            <SectionHeader title="Active Quotes" action="View All →" onAction={() => onNavigate("quotes")} />
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {MOCK_QUOTES.filter(q => ["draft","in progress","pending","awaiting review"].includes(q.status)).slice(0, 3).map(q => (
                <div key={q.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 10px", borderRadius: 7, background: SURFACE }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{q.seller}</div>
                    <div style={{ fontSize: 11, color: TEXT_MUTED }}>{q.items} items · ${q.value.toLocaleString()}</div>
                  </div>
                  <StatusChip status={q.status} />
                </div>
              ))}
            </div>
          </Card>
          <Card style={{ flexShrink: 0 }}>
            <SectionHeader title="Sales & Profit Trend" />
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={SALES_TREND}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={ACCENT} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: TEXT_MUTED }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: TEXT_MUTED }} tickFormatter={v => `$${v}`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="revenue" stroke={ACCENT} fill="url(#revGrad)" strokeWidth={2} name="Revenue" />
                  <Line type="monotone" dataKey="profit" stroke="#60A5FA" strokeWidth={2} dot={false} name="Profit" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* COL 3 — Match Queue + Inventory Pipeline + Profit by Platform */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, minHeight: 0 }}>
          <Card style={{ flexShrink: 0 }}>
            <SectionHeader title="Match Review Queue" action="Review →" onAction={() => onNavigate("match")} />
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {MATCH_QUEUE.filter(m => m.status !== "matched").slice(0, 3).map(m => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 10px", borderRadius: 7, background: SURFACE }}>
                  <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                    <div style={{ fontSize: 12, color: TEXT, fontFamily: "monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.original}</div>
                    <div style={{ fontSize: 11, color: TEXT_MUTED, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.matched ? `→ ${m.matched}` : "No match"}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                    {m.confidence > 0 && <span style={{ fontSize: 11, color: m.confidence > 85 ? SUCCESS : WARNING, fontWeight: 600 }}>{m.confidence}%</span>}
                    <StatusChip status={m.status} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card style={{ flexShrink: 0 }}>
            <SectionHeader title="Inventory Pipeline" action="View →" onAction={() => onNavigate("inventory")} />
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {INVENTORY_STAGES.map(s => (
                <div key={s.stage} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${BORDER}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: TEXT_SECONDARY }}>{s.stage}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.count}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card style={{ flexShrink: 0 }}>
            <SectionHeader title="Profit by Platform" />
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={PLATFORM_PROFIT} cx="50%" cy="50%" innerRadius="30%" outerRadius="60%" paddingAngle={3} dataKey="value">
                    {PLATFORM_PROFIT.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => `$${v}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, justifyContent: "center", flexShrink: 0 }}>
              {PLATFORM_PROFIT.map(p => (
                <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: TEXT_SECONDARY }}>
                  <span style={{ width: 7, height: 7, borderRadius: 1, background: p.color, display: "inline-block" }} />{p.name}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* COL 4 — Tasks + Alerts + Recent Sales */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, minHeight: 0 }}>
          <Card style={{ flexShrink: 0 }}>
            <SectionHeader title="Tasks" action="View →" onAction={() => onNavigate("tasks")} />
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {MOCK_TASKS.filter(t => t.status !== "done").slice(0, 3).map(t => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 7, background: SURFACE }}>
                  <PriorityDot priority={t.priority} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: TEXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</div>
                    <div style={{ fontSize: 10, color: TEXT_MUTED }}>Due: {t.due}</div>
                  </div>
                  <StatusChip status={t.status} />
                </div>
              ))}
            </div>
          </Card>
          <Card style={{ flexShrink: 0 }}>
            <SectionHeader title="Alerts & Warnings" />
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {[
                { icon: "⚠️", text: "3 items stale > 60 days", type: "warning" },
                { icon: "📉", text: "2 items at risk of loss", type: "danger" },
                { icon: "🔍", text: "5 unresolved matches",    type: "info" },
                { icon: "⏰", text: "2 overdue tasks",         type: "danger" },
              ].map((a, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 7, background: a.type === "danger" ? DANGER_DIM : a.type === "warning" ? WARNING_DIM : SURFACE }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{a.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 500, color: TEXT }}>{a.text}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card style={{ flexShrink: 0 }}>
            <SectionHeader title="Recent Sales" action="View →" onAction={() => onNavigate("sales")} />
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {MOCK_SALES.slice(0, 5).map(s => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px", borderRadius: 7, background: SURFACE, flexShrink: 0 }}>
                  <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: TEXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.title}</div>
                    <div style={{ fontSize: 10, color: TEXT_MUTED }}>{s.date} · {s.channel}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: s.profit > 0 ? SUCCESS : DANGER }}>${s.profit.toFixed(2)}</div>
                    <div style={{ fontSize: 10, color: TEXT_MUTED }}>{s.margin}%</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};

// ─── QUOTES MODULE ────────────────────────────────────────────────────────────

const QuotesList = ({ onOpenQuote, onNewQuote }) => {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const filtered = MOCK_QUOTES.filter(q => {
    if (filter !== "all" && q.status !== filter) return false;
    if (search && !q.seller.toLowerCase().includes(search.toLowerCase()) && !q.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: TEXT, margin: 0, fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.03em" }}>Quotes</h1>
          <p style={{ fontSize: 14, color: TEXT_SECONDARY, margin: "4px 0 0" }}>{MOCK_QUOTES.length} total quotes</p>
        </div>
        <Btn onClick={onNewQuote}>+ New Quote</Btn>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search quotes..." />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["all", "draft", "in progress", "pending", "accepted", "rejected"].map(f => (
            <FilterChip key={f} label={f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)} active={filter === f} onClick={() => setFilter(f)} />
          ))}
        </div>
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
              {["Quote", "Seller / Source", "Items", "Value", "Status", "Date", ""].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(q => (
              <tr key={q.id} style={{ borderBottom: `1px solid ${BORDER}`, cursor: "pointer" }} onClick={() => onOpenQuote(q)}
                onMouseEnter={e => e.currentTarget.style.background = SURFACE} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <td style={{ padding: "12px 16px", fontWeight: 600, color: ACCENT }}>{q.id}</td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ fontWeight: 600, color: TEXT }}>{q.seller}</div>
                  <div style={{ fontSize: 12, color: TEXT_MUTED }}>{q.source}</div>
                </td>
                <td style={{ padding: "12px 16px", color: TEXT_SECONDARY }}>{q.items}</td>
                <td style={{ padding: "12px 16px", fontWeight: 600, color: TEXT }}>${q.value.toLocaleString()}</td>
                <td style={{ padding: "12px 16px" }}><StatusChip status={q.status} /></td>
                <td style={{ padding: "12px 16px", color: TEXT_SECONDARY }}>{q.date}</td>
                <td style={{ padding: "12px 16px" }}>
                  <Btn small variant="ghost">→</Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

const QUOTE_STATUSES = [
  { id: "draft", label: "Draft" },
  { id: "in progress", label: "In Progress" },
  { id: "pending", label: "Pending Seller Response" },
  { id: "accepted", label: "Accepted" },
  { id: "rejected", label: "Rejected" },
  { id: "expired", label: "Expired" },
];
const CONDITIONS = ["Loose", "CIB", "New", "Console Only", "Box Only", "Manual Only"];
const CHANNELS = ["eBay", "Mercari", "Amazon", "Facebook", "Local", "Other"];
const getMarketByCondition = (base, condition) => {
  const m = { "Loose": 1, "CIB": 1.8, "New": 2.5, "Console Only": 0.7, "Box Only": 0.3, "Manual Only": 0.2 };
  return parseFloat((base * (m[condition] || 1)).toFixed(2));
};

const GAME_CATALOG = [
  { title: "Super Mario World", platform: "SNES", market: 25, img: "🎮" },
  { title: "The Legend of Zelda: A Link to the Past", platform: "SNES", market: 32, img: "🗡️" },
  { title: "Chrono Trigger", platform: "SNES", market: 220, img: "⏰" },
  { title: "Donkey Kong Country", platform: "SNES", market: 22, img: "🦍" },
  { title: "Final Fantasy III", platform: "SNES", market: 85, img: "⚔️" },
  { title: "Mega Man X", platform: "SNES", market: 28, img: "🤖" },
  { title: "Street Fighter II Turbo", platform: "SNES", market: 15, img: "👊" },
  { title: "Super Metroid", platform: "SNES", market: 95, img: "🚀" },
  { title: "Earthbound", platform: "SNES", market: 200, img: "🌍" },
  { title: "Kirby Super Star", platform: "SNES", market: 48, img: "⭐" },
  { title: "Star Fox", platform: "SNES", market: 16, img: "🦊" },
  { title: "Contra III", platform: "SNES", market: 22, img: "💣" },
  { title: "NBA Jam", platform: "SNES", market: 10, img: "🏀" },
  { title: "Mario Paint", platform: "SNES", market: 8, img: "🎨" },
  { title: "Pokémon Red", platform: "GameBoy", market: 52, img: "🔴" },
  { title: "Pokémon Blue", platform: "GameBoy", market: 50, img: "🔵" },
  { title: "Pokémon Yellow", platform: "GameBoy", market: 65, img: "⚡" },
  { title: "Tetris", platform: "GameBoy", market: 12, img: "🟦" },
  { title: "Super Mario Land", platform: "GameBoy", market: 14, img: "🍄" },
  { title: "The Legend of Zelda: Link's Awakening", platform: "GameBoy", market: 28, img: "🦅" },
  { title: "Pokémon Crystal", platform: "GBC", market: 85, img: "💎" },
  { title: "Pokémon Gold", platform: "GBC", market: 65, img: "🌕" },
  { title: "Pokémon Silver", platform: "GBC", market: 62, img: "🌕" },
  { title: "The Legend of Zelda: Oracle of Ages", platform: "GBC", market: 38, img: "🔮" },
  { title: "Super Mario 64", platform: "N64", market: 45, img: "⭐" },
  { title: "The Legend of Zelda: Ocarina of Time", platform: "N64", market: 35, img: "🎵" },
  { title: "Super Smash Bros.", platform: "N64", market: 48, img: "🥊" },
  { title: "Mario Kart 64", platform: "N64", market: 35, img: "🏎️" },
  { title: "GoldenEye 007", platform: "N64", market: 30, img: "🔫" },
  { title: "Banjo-Kazooie", platform: "N64", market: 40, img: "🐻" },
  { title: "Paper Mario", platform: "N64", market: 55, img: "📄" },
  { title: "Final Fantasy VII", platform: "PS1", market: 42, img: "🌩️" },
  { title: "Final Fantasy VIII", platform: "PS1", market: 22, img: "⚔️" },
  { title: "Resident Evil 2", platform: "PS1", market: 35, img: "🧟" },
  { title: "Castlevania: Symphony of the Night", platform: "PS1", market: 78, img: "🏰" },
  { title: "Spyro the Dragon", platform: "PS1", market: 20, img: "🐉" },
  { title: "Crash Bandicoot", platform: "PS1", market: 18, img: "🦊" },
  { title: "Metal Gear Solid", platform: "PS1", market: 25, img: "🐍" },
  { title: "Metroid Prime", platform: "GameCube", market: 38, img: "🚀" },
  { title: "The Legend of Zelda: Wind Waker", platform: "GameCube", market: 55, img: "⛵" },
  { title: "Super Mario Sunshine", platform: "GameCube", market: 48, img: "☀️" },
  { title: "Super Smash Bros. Melee", platform: "GameCube", market: 55, img: "🥊" },
  { title: "Sonic Adventure 2", platform: "Dreamcast", market: 30, img: "💨" },
  { title: "Golden Sun", platform: "GBA", market: 28, img: "☀️" },
  { title: "Fire Emblem", platform: "GBA", market: 55, img: "🔥" },
  { title: "Mega Man Zero", platform: "GBA", market: 32, img: "🤖" },
  { title: "Pokémon Ruby", platform: "GBA", market: 38, img: "💎" },
  { title: "Mario Kart: Super Circuit", platform: "GBA", market: 18, img: "🏎️" },
];

const matchGame = (raw) => {
  const q = raw.toLowerCase().trim();
  if (!q) return { game: null, confidence: 0, original: raw };
  const words = q.split(/\s+/).filter(w => w.length > 2);
  let best = null, bestScore = 0;
  for (const game of GAME_CATALOG) {
    const title = game.title.toLowerCase();
    const matchCount = words.filter(w => title.includes(w)).length;
    const score = words.length > 0 ? matchCount / words.length : 0;
    if (score > bestScore) { bestScore = score; best = game; }
  }
  const confidence = Math.round(bestScore * 100);
  return { game: confidence >= 30 ? best : null, confidence, original: raw };
};

const QuoteBuilder = ({ quote, onBack }) => {
  const today = new Date().toISOString().split("T")[0];
  const [seller, setSeller] = useState(quote.seller || "");
  const [source, setSource] = useState(quote.source || "");
  const [status, setStatus] = useState(quote.status || "draft");
  const [notes, setNotes] = useState(quote.notes || "");
  const [presetId, setPresetId] = useState(1);
  const [shipping, setShipping] = useState(4.50);
  const [feePct, setFeePct] = useState(13);
  const [channel, setChannel] = useState("eBay");
  const [riskBuffer, setRiskBuffer] = useState(5);
  const [packingCost, setPackingCost] = useState(0.50);
  const [laborCost, setLaborCost] = useState(2.00);
  const [targetMargin, setTargetMargin] = useState(30);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [configOpen, setConfigOpen] = useState(true);
  const [items, setItems] = useState(
    (quote.isNew ? [] : MOCK_QUOTE_ITEMS).map(i => ({ ...i, baseMarket: i.market, manualOffer: false }))
  );
  const [editingMatchId, setEditingMatchId] = useState(null);
  const [matchSearch, setMatchSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [toast, setToast] = useState(null);
  const [showAddSearch, setShowAddSearch] = useState(false);
  const [addQuery, setAddQuery] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [importMode, setImportMode] = useState("paste");
  const [importText, setImportText] = useState("");
  const [importResults, setImportResults] = useState([]);
  const [importStep, setImportStep] = useState("input");
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [showPnLModal, setShowPnLModal] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportStep, setExportStep] = useState("type");
  const [isEditingCustomOffer, setIsEditingCustomOffer] = useState(false);
  const [customOfferInput, setCustomOfferInput] = useState("");
  const [customOfferCOD, setCustomOfferCOD] = useState(60);
  const [offerCOD, setOfferCOD] = useState(55);
  const [itemShipping, setItemShipping] = useState({});
  const [filterState, setFilterState] = useState("Loose");
  const matchInputRef = useRef(null);
  const addSearchRef = useRef(null);
  useEffect(() => { if (editingMatchId && matchInputRef.current) matchInputRef.current.focus(); }, [editingMatchId]);
  useEffect(() => { if (showAddSearch && addSearchRef.current) addSearchRef.current.focus(); }, [showAddSearch]);

  const addCatalogItem = (game) => {
    setItems(prev => [...prev, {
      id: Date.now(), title: game.title, platform: game.platform, condition: "Loose",
      qty: 1, market: game.market, baseMarket: game.market, offer: 0, fees: 0,
      profit: 0, margin: 0, included: true, img: game.img, manualOffer: false,
    }]);
    setAddQuery("");
    showToast(`"${game.title}" added`);
  };

  const catalogResults = addQuery.length > 1
    ? GAME_CATALOG.filter(g => g.title.toLowerCase().includes(addQuery.toLowerCase()) || g.platform.toLowerCase().includes(addQuery.toLowerCase())).slice(0, 8)
    : [];

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const applyPreset = (id) => {
    const p = MOCK_PRESETS.find(p => p.id === id);
    if (!p) return;
    setPresetId(id); setFeePct(p.fees); setShipping(p.shipping); setLaborCost(p.labor); setRiskBuffer(p.risk);
    setItems(prev => prev.map(i => ({ ...i, manualOffer: false })));
    showToast(`Preset "${p.name}" applied`);
  };

  const calcItem = (item) => {
    const preset = MOCK_PRESETS.find(p => p.id === presetId) || MOCK_PRESETS[0];
    const effectiveOfferPct = preset.offerPct * (1 - riskBuffer / 100) / 100;
    const offer = item.manualOffer ? item.offer : parseFloat((item.market * effectiveOfferPct).toFixed(2));
    const fees = parseFloat((item.market * (feePct / 100)).toFixed(2));
    const profit = parseFloat((item.market - offer - fees - shipping - packingCost - laborCost).toFixed(2));
    const margin = item.market > 0 ? parseFloat(((profit / item.market) * 100).toFixed(1)) : 0;
    return { ...item, offer, fees, profit, margin };
  };

  const calcedItems = items.map(calcItem);
  const included = calcedItems.filter(i => i.included);
  const totalMarket = included.reduce((s, i) => s + i.market * i.qty, 0);
  const totalOffer = included.reduce((s, i) => s + i.offer * i.qty, 0);
  const totalFees = included.reduce((s, i) => s + i.fees * i.qty, 0);
  const totalShipping = included.reduce((s, i) => s + shipping * i.qty, 0);
  const totalOther = included.reduce((s, i) => s + (packingCost + laborCost) * i.qty, 0);
  const totalProfit = totalMarket - totalOffer - totalFees - totalShipping - totalOther;
  const totalOfferPct = totalMarket > 0 ? ((totalOffer / totalMarket) * 100).toFixed(1) : "0.0";
  const totalMarginPct = totalMarket > 0 ? ((totalProfit / totalMarket) * 100).toFixed(1) : "0.0";
  const customOfferCOGS = totalMarket * (customOfferCOD / 100);
  const offerCOGS = totalMarket * (offerCOD / 100);
  const pnlData = {
    salePrice: totalMarket,
    customOffer: { cogs: customOfferCOGS, cod: customOfferCOD, platformFees: totalFees, profit: totalMarket - totalFees - customOfferCOGS, profitMargin: customOfferCOGS > 0 ? (((totalMarket - totalFees - customOfferCOGS) / customOfferCOGS) * 100).toFixed(0) : 0 },
    offer: { cogs: offerCOGS, cod: offerCOD, platformFees: totalFees, profit: totalMarket - totalFees - offerCOGS, profitMargin: offerCOGS > 0 ? (((totalMarket - totalFees - offerCOGS) / offerCOGS) * 100).toFixed(0) : 0 },
    variance: (totalMarket - totalFees - offerCOGS) - (totalMarket - totalFees - customOfferCOGS),
  };

  const updateItem = (id, changes) => setItems(prev => prev.map(i => i.id === id ? { ...i, ...changes } : i));
  const toggleInclude = (id) => updateItem(id, { included: !items.find(i => i.id === id).included });
  const deleteItem = (id) => setItems(prev => prev.filter(i => i.id !== id));
  const setOfferManual = (id, val) => updateItem(id, { offer: parseFloat(val) || 0, manualOffer: true });
  const changeCondition = (id, condition) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    updateItem(id, { condition, market: getMarketByCondition(item.baseMarket, condition), manualOffer: false });
  };

  const toggleSelectAll = () => selectedIds.size === items.length ? setSelectedIds(new Set()) : setSelectedIds(new Set(items.map(i => i.id)));
  const toggleSelect = (id) => { const n = new Set(selectedIds); n.has(id) ? n.delete(id) : n.add(id); setSelectedIds(n); };
  const excludeLowMargin = () => { setItems(calcedItems.map(i => i.profit < 3 ? { ...i, included: false } : i)); showToast("Low margin items excluded"); };
  const bulkExclude = () => { setItems(items.map(i => selectedIds.has(i.id) ? { ...i, included: false } : i)); setSelectedIds(new Set()); showToast(`${selectedIds.size} items excluded`); };
  const bulkInclude = () => { setItems(items.map(i => selectedIds.has(i.id) ? { ...i, included: true } : i)); setSelectedIds(new Set()); showToast(`${selectedIds.size} items included`); };
  const adjustAllPct = (pct) => { setItems(calcedItems.map(i => ({ ...i, offer: parseFloat((i.offer * (1 + pct / 100)).toFixed(2)), manualOffer: true }))); showToast(`All offers ${pct > 0 ? "+" : ""}${pct}%`); };
  const resetOffers = () => { setItems(items.map(i => ({ ...i, manualOffer: false }))); showToast("Offers reset to preset"); };

  const calcTieredOffer = (market) => {
    if (market <= 10) return 2;
    if (market <= 30) return parseFloat((market * 0.45).toFixed(2));
    if (market <= 50) return parseFloat((market * 0.50).toFixed(2));
    if (market <= 99) return parseFloat((market * 0.55).toFixed(2));
    return parseFloat((market * 0.60).toFixed(2));
  };

  const applyTieredOffers = () => {
    const applyToAll = selectedIds.size === 0;
    setItems(prev => prev.map(i => {
      if (!applyToAll && !selectedIds.has(i.id)) return i;
      if (i.manualOffer) return i;
      return { ...i, offer: calcTieredOffer(i.market) };
    }));
    const count = applyToAll ? items.filter(i => !i.manualOffer).length : [...selectedIds].filter(id => !items.find(i => i.id === id)?.manualOffer).length;
    showToast(`Offers updated using tiered pricing (${count} item${count !== 1 ? "s" : ""})`);
  };

  const toggleRowExpansion = (id) => setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  const handleSort = (sortType) => {
    const sorted = [...items];
    if (sortType === "a-z") sorted.sort((a, b) => a.title.localeCompare(b.title));
    if (sortType === "z-a") sorted.sort((a, b) => b.title.localeCompare(a.title));
    if (sortType === "high-low") sorted.sort((a, b) => b.market - a.market);
    if (sortType === "low-high") sorted.sort((a, b) => a.market - b.market);
    setItems(sorted); setShowSortMenu(false);
  };
  const handleCustomOfferClick = () => { setCustomOfferInput(customOfferCOGS.toFixed(2)); setIsEditingCustomOffer(true); };
  const handleCustomOfferBlur = () => {
    const v = parseFloat(customOfferInput);
    if (!isNaN(v) && v >= 0 && totalMarket > 0) setCustomOfferCOD((v / totalMarket) * 100);
    setIsEditingCustomOffer(false);
  };
  const updateItemShipping = (id, cost) => setItemShipping(prev => ({ ...prev, [id]: parseFloat(cost) || 0 }));

  const processImport = () => {
    const lines = importText.split("\n").map(l => l.split(",")[0].replace(/"/g, "").trim()).filter(Boolean);
    setImportResults(lines.map(line => ({ ...matchGame(line), selected: matchGame(line).game != null })));
    setImportStep("review");
  };
  const toggleImportResult = (i) => setImportResults(prev => prev.map((r, idx) => idx === i ? { ...r, selected: !r.selected } : r));
  const confirmImport = () => {
    const toAdd = importResults.filter(r => r.selected && r.game).map(r => ({
      id: Date.now() + Math.random(), title: r.game.title, platform: r.game.platform,
      condition: "Loose", qty: 1, market: r.game.market, baseMarket: r.game.market,
      offer: 0, fees: 0, profit: 0, margin: 0, included: true, img: r.game.img, manualOffer: false,
    }));
    setItems(prev => [...prev, ...toAdd]);
    showToast(`${toAdd.length} item${toAdd.length !== 1 ? "s" : ""} imported`);
    setShowImport(false); setImportText(""); setImportResults([]); setImportStep("input");
  };
  const loadFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImportText(ev.target.result.split("\n").map(l => l.split(",")[0].replace(/"/g, "").trim()).filter(Boolean).join("\n"));
    reader.readAsText(file);
  };
  const handleCSV = (e) => loadFile(e.target.files[0]);
  const handleDrop = (e) => { e.preventDefault(); setIsDragOver(false); loadFile(e.dataTransfer.files[0]); };

  const exportCSV = () => {
    const rows = [["Title","Platform","Condition","Qty","Market","Offer","Fees","Profit","Margin%","Included"],
      ...calcedItems.map(i => [i.title,i.platform,i.condition,i.qty,i.market,i.offer,i.fees,i.profit,i.margin,i.included])];
    const blob = new Blob([rows.map(r => r.join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `quote-${quote.id}.csv`; a.click();
    showToast("CSV exported");
  };

  const profitColor = (p) => p > 10 ? SUCCESS : p > 3 ? WARNING : DANGER;
  const rowBg = (item) => !item.included ? "transparent" : item.profit < 0 ? DANGER_DIM : item.profit < 3 ? WARNING_DIM : "transparent";

  const iStyle = { background: BG_ELEVATED, border: `1px solid ${BORDER}`, borderRadius: 6, color: TEXT, padding: "7px 10px", fontSize: 13, fontFamily: "'Source Sans 3',sans-serif", outline: "none", width: "100%", colorScheme: "dark" };
  const lStyle = { fontSize: 11, color: TEXT_MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 4 };

  return (
    <div>
      {toast && <div style={{ position: "fixed", bottom: 32, right: 32, background: BG_ELEVATED, border: `1px solid ${ACCENT}`, borderRadius: 10, padding: "12px 20px", fontSize: 14, fontWeight: 600, color: ACCENT, zIndex: 9999, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>{toast}</div>}

      {/* ── P&L MODAL */}
      {showPnLModal && (
        <div onClick={() => setShowPnLModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: BG_ELEVATED, borderRadius: 12, padding: 24, maxWidth: 700, width: "100%", maxHeight: "90vh", overflowY: "auto", border: `1px solid ${BORDER}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: TEXT, fontFamily: "'Outfit',sans-serif", margin: 0 }}>P&L Analysis</h2>
              <button onClick={() => setShowPnLModal(false)} style={{ background: "none", border: "none", color: TEXT_MUTED, fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ background: BG_CARD, borderRadius: 8, overflow: "hidden", border: `1px solid ${BORDER}` }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: SURFACE }}>
                    {["", "Custom Offer", "Offer", "Variance"].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: h === "" ? "left" : "center", fontWeight: 600, color: TEXT_MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Sale Price", cu: pnlData.salePrice, of: pnlData.salePrice },
                    { label: "COGS", cu: pnlData.customOffer.cogs, of: pnlData.offer.cogs },
                    { label: "Platform Fees", cu: pnlData.customOffer.platformFees, of: pnlData.offer.platformFees },
                  ].map(row => (
                    <tr key={row.label} style={{ borderTop: `1px solid ${BORDER}` }}>
                      <td style={{ padding: "10px 14px", fontWeight: 600, color: TEXT }}>{row.label}</td>
                      <td style={{ padding: "10px 14px", textAlign: "center", color: TEXT }}>${row.cu.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: "10px 14px", textAlign: "center", color: TEXT }}>${row.of.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: "10px 14px" }} />
                    </tr>
                  ))}
                  <tr style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: TEXT }}>COD</td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                        <input type="number" value={parseFloat(customOfferCOD.toFixed(1))} onChange={e => setCustomOfferCOD(parseFloat(e.target.value) || 0)} style={{ width: 60, background: BG_BASE, border: `1px solid ${BORDER}`, borderRadius: 6, color: TEXT, padding: "4px 8px", fontSize: 13, textAlign: "center", outline: "none", colorScheme: "dark" }} min="0" max="100" />
                        <span style={{ color: TEXT_MUTED }}>%</span>
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                        <input type="number" value={offerCOD} onChange={e => setOfferCOD(parseFloat(e.target.value) || 0)} style={{ width: 60, background: BG_BASE, border: `1px solid ${BORDER}`, borderRadius: 6, color: TEXT, padding: "4px 8px", fontSize: 13, textAlign: "center", outline: "none", colorScheme: "dark" }} min="0" max="100" />
                        <span style={{ color: TEXT_MUTED }}>%</span>
                      </div>
                    </td>
                    <td />
                  </tr>
                  <tr style={{ borderTop: `1px solid ${BORDER}`, background: SUCCESS_DIM }}>
                    <td style={{ padding: "10px 14px", fontWeight: 700, color: SUCCESS }}>Profit</td>
                    <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: 700, color: SUCCESS }}>${pnlData.customOffer.profit.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: 700, color: SUCCESS }}>${pnlData.offer.profit.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: 700, color: SUCCESS }}>${pnlData.variance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: TEXT }}>Profit Margin</td>
                    <td style={{ padding: "10px 14px", textAlign: "center", color: TEXT }}>{pnlData.customOffer.profitMargin}%</td>
                    <td style={{ padding: "10px 14px", textAlign: "center", color: TEXT }}>{pnlData.offer.profitMargin}%</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
              <Btn onClick={() => setShowPnLModal(false)}>Close</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: BG_ELEVATED, border: `1px solid ${BORDER}`, borderRadius: 8, cursor: "pointer", fontSize: 16, color: TEXT_SECONDARY, padding: "8px 12px" }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 2 }}>Quotes / {quote.id}</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: TEXT, margin: 0, fontFamily: "'Outfit',sans-serif", letterSpacing: "-0.03em" }}>Quote Builder — {quote.id}</h1>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Btn variant="secondary" onClick={exportCSV}>↓ Export CSV</Btn>
          <Btn variant="secondary" onClick={() => showToast("Quote saved")}>Save Draft</Btn>
          {status === "accepted" && <Btn variant="secondary" onClick={() => showToast("Converting to inventory…")}>⊕ Convert to Inventory</Btn>}
          <Btn onClick={() => showToast("Quote sent to seller")}>Send to Seller</Btn>
        </div>
      </div>

      {/* ── METADATA */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 16, alignItems: "end" }}>
          <div><label style={lStyle}>Seller Name</label><input style={iStyle} value={seller} onChange={e => setSeller(e.target.value)} placeholder="Seller name…" /></div>
          <div><label style={lStyle}>Source / Platform</label><input style={iStyle} value={source} onChange={e => setSource(e.target.value)} placeholder="Facebook, eBay, Local…" /></div>
          <div>
            <label style={lStyle}>Status</label>
            <select style={iStyle} value={status} onChange={e => setStatus(e.target.value)}>
              {QUOTE_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div><label style={lStyle}>Notes</label><input style={iStyle} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Internal notes…" /></div>
          <div style={{ textAlign: "right", fontSize: 12, color: TEXT_MUTED, whiteSpace: "nowrap" }}>
            <div>Created: {quote.date || today}</div>
            <div style={{ marginTop: 2 }}>Updated: {today}</div>
            <div style={{ marginTop: 6 }}><StatusChip status={status} /></div>
          </div>
        </div>
      </Card>

      {/* ── PRICING CONFIG */}
      <Card style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>
        <button onClick={() => setConfigOpen(o => !o)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", background: "none", border: "none", cursor: "pointer", color: TEXT }}>
          <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>⚙ Pricing Configuration</span>
          <span style={{ color: TEXT_MUTED }}>{configOpen ? "▲" : "▼"}</span>
        </button>
        {configOpen && (
          <div style={{ padding: "0 20px 20px" }}>
            <div style={{ marginBottom: 14 }}>
              <label style={lStyle}>Pricing Preset</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {MOCK_PRESETS.map(p => (
                  <button key={p.id} onClick={() => applyPreset(p.id)} style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${presetId === p.id ? ACCENT : BORDER}`, background: presetId === p.id ? ACCENT_BG : BG_ELEVATED, color: presetId === p.id ? ACCENT : TEXT_SECONDARY, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{p.name}</button>
                ))}
              </div>
              <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 5 }}>{MOCK_PRESETS.find(p => p.id === presetId)?.desc}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12 }}>
              <div><label style={lStyle}>Offer %</label><div style={{ padding: "7px 10px", background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 6, fontSize: 13, color: ACCENT, fontWeight: 700 }}>{MOCK_PRESETS.find(p => p.id === presetId)?.offerPct || 0}%</div></div>
              <div><label style={lStyle}>Platform Fee</label><div style={{ position: "relative" }}><input style={{ ...iStyle, paddingRight: 24 }} type="number" min="0" max="30" step="0.5" value={feePct} onChange={e => setFeePct(parseFloat(e.target.value) || 0)} /><span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: TEXT_MUTED, fontSize: 12 }}>%</span></div></div>
              <div><label style={lStyle}>Shipping</label><div style={{ position: "relative" }}><span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: TEXT_MUTED, fontSize: 12 }}>$</span><input style={{ ...iStyle, paddingLeft: 20 }} type="number" min="0" step="0.5" value={shipping} onChange={e => setShipping(parseFloat(e.target.value) || 0)} /></div></div>
              <div><label style={lStyle}>Risk Buffer</label><div style={{ position: "relative" }}><input style={{ ...iStyle, paddingRight: 24 }} type="number" min="0" max="30" step="1" value={riskBuffer} onChange={e => setRiskBuffer(parseFloat(e.target.value) || 0)} /><span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: TEXT_MUTED, fontSize: 12 }}>%</span></div></div>
              <div><label style={lStyle}>Channel</label><select style={iStyle} value={channel} onChange={e => setChannel(e.target.value)}>{CHANNELS.map(c => <option key={c}>{c}</option>)}</select></div>
            </div>
            <button onClick={() => setShowAdvanced(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: TEXT_MUTED, fontSize: 12, fontWeight: 600, padding: "10px 0 0", display: "flex", alignItems: "center", gap: 4 }}>{showAdvanced ? "▲" : "▼"} Advanced Options</button>
            {showAdvanced && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
                <div><label style={lStyle}>Packing Cost</label><div style={{ position: "relative" }}><span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: TEXT_MUTED, fontSize: 12 }}>$</span><input style={{ ...iStyle, paddingLeft: 20 }} type="number" min="0" step="0.1" value={packingCost} onChange={e => setPackingCost(parseFloat(e.target.value) || 0)} /></div></div>
                <div><label style={lStyle}>Labor Cost</label><div style={{ position: "relative" }}><span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: TEXT_MUTED, fontSize: 12 }}>$</span><input style={{ ...iStyle, paddingLeft: 20 }} type="number" min="0" step="0.5" value={laborCost} onChange={e => setLaborCost(parseFloat(e.target.value) || 0)} /></div></div>
                <div><label style={lStyle}>Target Margin</label><div style={{ position: "relative" }}><input style={{ ...iStyle, paddingRight: 24 }} type="number" min="0" max="100" step="1" value={targetMargin} onChange={e => setTargetMargin(parseFloat(e.target.value) || 0)} /><span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: TEXT_MUTED, fontSize: 12 }}>%</span></div></div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* ── TABS */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 8 }}>
          {["Collection", "Match Review", "Summary"].map((tab, i) => (
            <button key={i} onClick={() => setActiveTab(i)} style={{ padding: "8px 20px", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer", border: "none", background: activeTab === i ? ACCENT : ACCENT_LIGHT, color: activeTab === i ? "#0B0F14" : TEXT_SECONDARY, transition: "all 0.15s", fontFamily: "'Source Sans 3',sans-serif" }}>{tab}</button>
          ))}
        </div>
        <button onClick={() => setActiveTab(3)} style={{ padding: "8px 20px", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer", border: "none", background: activeTab === 3 ? ACCENT : ACCENT_LIGHT, color: activeTab === 3 ? "#0B0F14" : TEXT_SECONDARY, transition: "all 0.15s", fontFamily: "'Source Sans 3',sans-serif" }}>Per SKU Count</button>
      </div>

      {/* ── PER SKU COUNT TAB */}
      {activeTab === 3 ? (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {calcedItems.map(item => {
              const iShip = itemShipping[item.id] ?? shipping;
              const iProfit = item.market - item.fees - item.offer - iShip;
              const iMargin = item.market > 0 ? ((iProfit / item.market) * 100).toFixed(1) : 0;
              return (
                <div key={item.id} style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 8, background: BG_ELEVATED, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{item.img}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: TEXT }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>{item.platform} · {item.condition}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: TEXT_MUTED }}>Market Price:</span><span style={{ fontWeight: 600, color: TEXT }}>${item.market.toFixed(2)}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: TEXT_MUTED }}>Buy Price:</span><span style={{ fontWeight: 600, color: WARNING }}>${item.offer.toFixed(2)}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: TEXT_MUTED }}>Platform Fees:</span><span style={{ fontWeight: 600, color: DANGER }}>-${item.fees.toFixed(2)}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: TEXT_MUTED }}>Shipping:</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ color: TEXT_MUTED, fontSize: 12 }}>$</span>
                        <input type="number" value={itemShipping[item.id] ?? ""} onChange={e => updateItemShipping(item.id, e.target.value)} placeholder={shipping.toFixed(2)} step="0.01" min="0" style={{ width: 70, background: BG_ELEVATED, border: `1px solid ${BORDER}`, borderRadius: 6, color: TEXT, padding: "4px 8px", fontSize: 12, textAlign: "right", outline: "none", colorScheme: "dark" }} />
                      </div>
                    </div>
                    <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 8, marginTop: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: TEXT_MUTED, fontWeight: 600 }}>Our Profit:</span>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 800, fontSize: 18, color: iProfit > 0 ? SUCCESS : DANGER, fontFamily: "'Outfit',sans-serif" }}>${iProfit.toFixed(2)}</div>
                        <div style={{ fontSize: 11, color: iProfit > 0 ? SUCCESS : DANGER }}>{iMargin}% margin</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <>
          {/* ── SEARCH AREA */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>Search</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1, position: "relative" }}>
                <input ref={addSearchRef} type="text" placeholder="Type game title or platform…" value={addQuery}
                  onChange={e => { setAddQuery(e.target.value); setShowAddSearch(e.target.value.length > 0); }}
                  onFocus={() => addQuery.length > 0 && setShowAddSearch(true)}
                  onBlur={() => setTimeout(() => setShowAddSearch(false), 200)}
                  onKeyDown={e => { if (e.key === "Escape") { setShowAddSearch(false); setAddQuery(""); } }}
                  style={{ width: "100%", padding: "9px 14px", background: BG_ELEVATED, border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, fontSize: 14, outline: "none", fontFamily: "'Source Sans 3',sans-serif", boxSizing: "border-box" }} />
                {showAddSearch && catalogResults.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", zIndex: 20, maxHeight: 240, overflowY: "auto" }}>
                    {catalogResults.map((g, i) => (
                      <div key={i} onClick={() => addCatalogItem(g)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", cursor: "pointer", borderBottom: i < catalogResults.length - 1 ? `1px solid ${BORDER}` : "none" }}
                        onMouseEnter={e => e.currentTarget.style.background = SURFACE} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 20 }}>{g.img}</span>
                          <div><div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{g.title}</div><div style={{ fontSize: 11, color: TEXT_MUTED }}>{g.platform}</div></div>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: ACCENT }}>${g.market}</span>
                      </div>
                    ))}
                  </div>
                )}
                {showAddSearch && addQuery.length > 1 && catalogResults.length === 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "12px 14px", fontSize: 13, color: TEXT_MUTED, zIndex: 20 }}>No matches for "{addQuery}"</div>
                )}
              </div>
              <select value={filterState} onChange={e => setFilterState(e.target.value)} style={{ padding: "9px 14px", background: ACCENT, color: "#0B0F14", fontWeight: 700, fontSize: 13, borderRadius: 8, border: "none", cursor: "pointer", outline: "none" }}>
                {CONDITIONS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn onClick={() => { const g = catalogResults[0]; if (g) addCatalogItem(g); else if (addQuery.trim()) showToast("No match found"); }}>+ Add Item</Btn>
              <Btn variant="secondary" onClick={excludeLowMargin}>Filter Low Margin</Btn>
            </div>
          </div>

          {/* ── IMPORT PANEL */}
          {showImport && (
            <div style={{ padding: "16px 20px", borderRadius: 12, border: `1px solid ${BORDER}`, background: BG_ELEVATED, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: TEXT, fontFamily: "'Outfit',sans-serif" }}>↗ Import Collection</span>
                <button onClick={() => { setShowImport(false); setImportStep("input"); setImportResults([]); setImportText(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: TEXT_MUTED, fontSize: 18 }}>✕</button>
              </div>
              {importStep === "input" && (
                <>
                  <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                    {["paste", "csv"].map(m => (
                      <button key={m} onClick={() => setImportMode(m)} style={{ padding: "6px 16px", borderRadius: 20, border: `1px solid ${importMode === m ? ACCENT : BORDER}`, background: importMode === m ? ACCENT_BG : BG_BASE, color: importMode === m ? ACCENT : TEXT_SECONDARY, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                        {m === "paste" ? "📋 Paste List" : "📄 Upload CSV"}
                      </button>
                    ))}
                  </div>
                  {importMode === "paste" ? (
                    <>
                      <textarea value={importText} onChange={e => setImportText(e.target.value)} placeholder={"One game per line:\nSuper Mario World\nZelda Link to the Past"} style={{ width: "100%", height: 120, background: BG_BASE, border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, padding: "10px 12px", fontSize: 13, fontFamily: "monospace", resize: "vertical", outline: "none", boxSizing: "border-box", colorScheme: "dark" }} />
                      <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 4 }}>{importText.split("\n").filter(Boolean).length} lines detected</div>
                    </>
                  ) : (
                    <div onDragOver={e => { e.preventDefault(); setIsDragOver(true); }} onDragLeave={() => setIsDragOver(false)} onDrop={handleDrop} onClick={() => document.getElementById("qb-file-upload").click()}
                      style={{ padding: "32px 24px", border: `2px dashed ${isDragOver ? ACCENT : BORDER}`, borderRadius: 10, textAlign: "center", background: isDragOver ? ACCENT_BG : BG_BASE, cursor: "pointer" }}>
                      <div style={{ fontSize: 36, marginBottom: 8 }}>{isDragOver ? "📂" : "📄"}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: isDragOver ? ACCENT : TEXT, marginBottom: 14 }}>{isDragOver ? "Drop to import" : "Drag & drop your CSV here"}</div>
                      <label htmlFor="qb-file-upload" onClick={e => e.stopPropagation()} style={{ padding: "8px 22px", background: BG_ELEVATED, border: `1px solid ${BORDER}`, borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, color: TEXT, display: "inline-block" }}>Browse Files</label>
                      <input type="file" accept=".csv,.xlsx,.txt" onChange={handleCSV} style={{ display: "none" }} id="qb-file-upload" />
                      {importText && <div style={{ marginTop: 12, fontSize: 12, color: SUCCESS }}>✓ {importText.split("\n").filter(Boolean).length} rows loaded</div>}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <Btn onClick={processImport} style={{ opacity: !importText.trim() ? 0.5 : 1 }}>Process {importText.split("\n").filter(Boolean).length > 0 ? `(${importText.split("\n").filter(Boolean).length})` : ""}</Btn>
                    <Btn variant="ghost" onClick={() => setImportText("")}>Clear</Btn>
                  </div>
                </>
              )}
              {importStep === "review" && (
                <>
                  <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginBottom: 12 }}>{importResults.filter(r => r.game).length} of {importResults.length} items matched</div>
                  <div style={{ maxHeight: 280, overflowY: "auto", border: `1px solid ${BORDER}`, borderRadius: 8, marginBottom: 12 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${BORDER}`, background: SURFACE }}>
                          {["", "Original", "Matched", "Platform", "Market", "Conf."].map(h => (
                            <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 600, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importResults.map((r, i) => (
                          <tr key={i} style={{ borderBottom: `1px solid ${BORDER}`, background: !r.game ? DANGER_DIM : r.selected ? "transparent" : BG_BASE, opacity: r.selected ? 1 : 0.5 }}>
                            <td style={{ padding: "8px 12px" }}><input type="checkbox" checked={r.selected && !!r.game} disabled={!r.game} onChange={() => toggleImportResult(i)} style={{ accentColor: ACCENT }} /></td>
                            <td style={{ padding: "8px 12px", color: TEXT_MUTED, fontFamily: "monospace", fontSize: 12 }}>{r.original}</td>
                            <td style={{ padding: "8px 12px", fontWeight: r.game ? 600 : 400, color: r.game ? TEXT : TEXT_MUTED }}>{r.game ? <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span>{r.game.img}</span>{r.game.title}</span> : <span style={{ color: DANGER }}>No match</span>}</td>
                            <td style={{ padding: "8px 12px", color: TEXT_SECONDARY }}>{r.game?.platform || "—"}</td>
                            <td style={{ padding: "8px 12px", color: r.game ? ACCENT : TEXT_MUTED, fontWeight: 600 }}>{r.game ? `$${r.game.market}` : "—"}</td>
                            <td style={{ padding: "8px 12px" }}>{r.game ? <span style={{ fontSize: 12, fontWeight: 700, color: r.confidence >= 80 ? SUCCESS : r.confidence >= 50 ? WARNING : DANGER }}>{r.confidence}%</span> : <span style={{ fontSize: 12, color: DANGER }}>0%</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn onClick={confirmImport}>Add {importResults.filter(r => r.selected && r.game).length} Items</Btn>
                    <Btn variant="secondary" onClick={() => setImportStep("input")}>← Back</Btn>
                    <Btn variant="ghost" onClick={() => { setShowImport(false); setImportStep("input"); setImportResults([]); setImportText(""); }}>Cancel</Btn>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── TABLE + RIGHT BUTTONS */}
          <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
            <div style={{ flex: 1, background: BG_CARD, borderRadius: 12, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderBottom: `1px solid ${BORDER}`, flexWrap: "wrap" }}>
                <input type="checkbox" checked={selectedIds.size === items.length && items.length > 0} onChange={toggleSelectAll} style={{ accentColor: ACCENT }} />
                <span style={{ fontSize: 13, color: TEXT_SECONDARY, fontWeight: 600 }}>
                  {items.length} items{selectedIds.size > 0 && <span style={{ color: ACCENT }}> · {selectedIds.size} selected</span>}
                </span>
                {selectedIds.size > 0 && <><Btn small variant="secondary" onClick={bulkInclude}>Include</Btn><Btn small variant="secondary" onClick={bulkExclude}>Exclude</Btn></>}
                <Btn small variant="ghost" onClick={() => adjustAllPct(-5)}>−5%</Btn>
                <Btn small variant="ghost" onClick={() => adjustAllPct(5)}>+5%</Btn>
                <Btn small variant="ghost" onClick={resetOffers}>Reset</Btn>
                <Btn small variant="secondary" onClick={applyTieredOffers}>Auto Offer (Tiered)</Btn>
              </div>
              {items.length === 0 ? (
                <EmptyState icon="🎮" title="No items yet" desc="Search for games above or use Import →" />
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: BG_BASE }}>
                      <th style={{ padding: "10px 14px", width: 40 }} />
                      <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 600, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.04em" }}>Title</th>
                      <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 600, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.04em" }}>State</th>
                      <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 600, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.04em" }}>Value</th>
                      <th style={{ padding: "10px 14px", width: 36 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {calcedItems.flatMap(item => {
                      const isExpanded = expandedRows[item.id];
                      const iShip = itemShipping[item.id] ?? shipping;
                      const iProfit = item.market - item.fees - item.offer - iShip;
                      const iMarginPct = item.market > 0 ? ((iProfit / item.market) * 100).toFixed(1) : 0;
                      const rows = [
                        <tr key={item.id} style={{ borderTop: `1px solid ${BORDER}`, cursor: "pointer", background: rowBg(item), opacity: item.included ? 1 : 0.45 }}
                          onClick={() => toggleRowExpansion(item.id)}
                          onMouseEnter={e => { if (item.included) e.currentTarget.style.background = SURFACE; }}
                          onMouseLeave={e => e.currentTarget.style.background = rowBg(item)}>
                          <td style={{ padding: "10px 14px" }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
                              <input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => toggleSelect(item.id)} style={{ accentColor: ACCENT }} />
                              <input type="checkbox" checked={item.included} onChange={() => toggleInclude(item.id)} style={{ accentColor: ACCENT }} title="Include in quote" />
                            </div>
                          </td>
                          <td style={{ padding: "10px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div style={{ width: 48, height: 48, borderRadius: 8, background: BG_ELEVATED, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{item.img}</div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, color: TEXT }}>{item.title} <span style={{ color: TEXT_MUTED, fontWeight: 400, fontSize: 12 }}>{item.platform}</span></div>
                                <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>{item.condition} · Qty {item.qty}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "10px 14px" }} onClick={e => e.stopPropagation()}>
                            <select value={item.condition} onChange={e => changeCondition(item.id, e.target.value)} style={{ background: ACCENT, border: "none", borderRadius: 6, color: "#0B0F14", padding: "5px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer", outline: "none" }}>
                              {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                            </select>
                          </td>
                          <td style={{ padding: "10px 14px", fontWeight: 700, fontSize: 15, color: TEXT }}>${item.market.toFixed(2)}</td>
                          <td style={{ padding: "10px 14px", textAlign: "center", color: TEXT_MUTED, fontSize: 12 }}>{isExpanded ? "▼" : "▶"}</td>
                        </tr>
                      ];
                      if (isExpanded) {
                        rows.push(
                          <tr key={`${item.id}-exp`} style={{ background: BG_ELEVATED, borderTop: `1px solid ${BORDER}` }}>
                            <td colSpan={5} style={{ padding: "16px 18px" }}>
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, fontSize: 13 }}>
                                <div>
                                  <div style={{ color: TEXT_MUTED, marginBottom: 4, fontSize: 12 }}>Market Price</div>
                                  <div style={{ fontWeight: 700, color: TEXT, fontSize: 16 }}>${item.market.toFixed(2)}</div>
                                </div>
                                <div>
                                  <div style={{ color: TEXT_MUTED, marginBottom: 4, fontSize: 12 }}>Buy Price {item.manualOffer ? "(manual)" : `(${(MOCK_PRESETS.find(p => p.id === presetId)?.offerPct * (1 - riskBuffer / 100)).toFixed(0)}%)`}</div>
                                  <div style={{ fontWeight: 700, color: WARNING, fontSize: 16 }}>{item.manualOffer && <span style={{ fontSize: 12 }}>✎ </span>}${item.offer.toFixed(2)}</div>
                                </div>
                                <div>
                                  <div style={{ color: TEXT_MUTED, marginBottom: 4, fontSize: 12 }}>Platform Fees</div>
                                  <div style={{ fontWeight: 700, color: DANGER, fontSize: 16 }}>-${item.fees.toFixed(2)}</div>
                                </div>
                                <div>
                                  <div style={{ color: TEXT_MUTED, marginBottom: 4, fontSize: 12 }}>Shipping</div>
                                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                    <span style={{ color: TEXT_MUTED, fontSize: 12 }}>$</span>
                                    <input type="number" value={itemShipping[item.id] ?? ""} onChange={e => updateItemShipping(item.id, e.target.value)} onClick={e => e.stopPropagation()} placeholder={shipping.toFixed(2)} step="0.01" min="0"
                                      style={{ width: 80, background: BG_BASE, border: `1px solid ${BORDER}`, borderRadius: 6, color: TEXT, padding: "5px 8px", fontSize: 13, outline: "none", colorScheme: "dark" }} />
                                  </div>
                                </div>
                              </div>
                              <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ display: "flex", gap: 8 }}>
                                  <Btn small variant="ghost" onClick={e => { e.stopPropagation(); setEditingMatchId(item.id); setMatchSearch(item.title); toggleRowExpansion(item.id); }}>✎ Edit Match</Btn>
                                  <Btn small variant="danger" onClick={e => { e.stopPropagation(); deleteItem(item.id); }}>✕ Remove</Btn>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                  <div style={{ fontSize: 11, color: TEXT_MUTED, marginBottom: 2 }}>Our Profit</div>
                                  <div style={{ fontWeight: 800, fontSize: 22, color: iProfit > 0 ? SUCCESS : DANGER, fontFamily: "'Outfit',sans-serif" }}>${iProfit.toFixed(2)}</div>
                                  <div style={{ fontSize: 12, color: iProfit > 0 ? SUCCESS : DANGER }}>{iMarginPct}% margin</div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      }
                      return rows;
                    })}
                  </tbody>
                  {included.length > 0 && (
                    <tfoot>
                      <tr style={{ borderTop: `2px solid ${BORDER}`, background: SURFACE }}>
                        <td colSpan={2} style={{ padding: "10px 14px", fontWeight: 700, color: TEXT_SECONDARY, fontSize: 12 }}>TOTALS ({included.length} / {items.length} items)</td>
                        <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600, color: TEXT }}>${totalMarket.toFixed(2)}</td>
                        <td colSpan={2} style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: totalProfit > 0 ? SUCCESS : DANGER }}>${totalProfit.toFixed(2)} profit</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              )}
            </div>

            {/* ── RIGHT BUTTON COLUMN */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, position: "relative" }}>
              <div style={{ position: "relative" }}>
                <Btn variant="secondary" onClick={() => setShowSortMenu(v => !v)} style={{ whiteSpace: "nowrap", width: "100%" }}>Sort</Btn>
                {showSortMenu && (
                  <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 4, background: BG_ELEVATED, border: `1px solid ${BORDER}`, borderRadius: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", zIndex: 20, minWidth: 160 }}>
                    {[["a-z", "A to Z"], ["z-a", "Z to A"], ["high-low", "High to Low"], ["low-high", "Low to High"]].map(([key, label]) => (
                      <button key={key} onClick={() => handleSort(key)} style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 14px", background: "none", border: "none", color: TEXT, fontSize: 14, cursor: "pointer", fontFamily: "'Source Sans 3',sans-serif" }}
                        onMouseEnter={e => e.currentTarget.style.background = SURFACE} onMouseLeave={e => e.currentTarget.style.background = "none"}>{label}</button>
                    ))}
                  </div>
                )}
              </div>
              <Btn variant="secondary" onClick={() => { setShowImport(v => !v); setImportStep("input"); setImportResults([]); }} style={{ whiteSpace: "nowrap" }}>↗ Import</Btn>
              <div style={{ flex: 1 }} />
              <div style={{ position: "relative" }}>
                <Btn variant="secondary" onClick={() => setShowExportMenu(v => !v)} style={{ whiteSpace: "nowrap", width: "100%" }}>↓ Export</Btn>
                {showExportMenu && (
                  <div style={{ position: "absolute", bottom: "100%", right: 0, marginBottom: 4, background: BG_ELEVATED, border: `1px solid ${BORDER}`, borderRadius: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", zIndex: 20, minWidth: 160 }}>
                    {exportStep === "type" ? (
                      <>
                        <button onClick={() => setExportStep("format")} style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 14px", background: "none", border: "none", color: TEXT, fontSize: 14, cursor: "pointer", fontFamily: "'Source Sans 3',sans-serif" }} onMouseEnter={e => e.currentTarget.style.background = SURFACE} onMouseLeave={e => e.currentTarget.style.background = "none"}>Export All</button>
                        <button onClick={() => setExportStep("format")} style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 14px", background: "none", border: "none", color: TEXT, fontSize: 14, cursor: "pointer", borderTop: `1px solid ${BORDER}`, fontFamily: "'Source Sans 3',sans-serif" }} onMouseEnter={e => e.currentTarget.style.background = SURFACE} onMouseLeave={e => e.currentTarget.style.background = "none"}>Export Selected</button>
                      </>
                    ) : (
                      <>
                        <div style={{ padding: "8px 14px", fontSize: 12, color: TEXT_MUTED, borderBottom: `1px solid ${BORDER}` }}>Select Format</div>
                        {["CSV", "PDF", "PNG", "XLSX"].map(fmt => (
                          <button key={fmt} onClick={() => { if (fmt === "CSV") exportCSV(); else showToast(`Exporting as ${fmt}`); setShowExportMenu(false); setExportStep("type"); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 14px", background: "none", border: "none", color: TEXT, fontSize: 14, cursor: "pointer", fontFamily: "'Source Sans 3',sans-serif" }} onMouseEnter={e => e.currentTarget.style.background = SURFACE} onMouseLeave={e => e.currentTarget.style.background = "none"}>{fmt}</button>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── BOTTOM STAT CARDS */}
          <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
            <div onClick={handleCustomOfferClick} style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "16px 24px", textAlign: "center", minWidth: 180, cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = BG_ELEVATED; e.currentTarget.style.borderColor = ACCENT; }}
              onMouseLeave={e => { e.currentTarget.style.background = BG_CARD; e.currentTarget.style.borderColor = BORDER; }}>
              <div style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>Custom Offer</div>
              {isEditingCustomOffer ? (
                <input type="number" value={customOfferInput} onChange={e => setCustomOfferInput(e.target.value)} onBlur={handleCustomOfferBlur} onKeyDown={e => { if (e.key === "Enter") handleCustomOfferBlur(); if (e.key === "Escape") setIsEditingCustomOffer(false); }} autoFocus step="0.01" min="0" onClick={e => e.stopPropagation()}
                  style={{ fontSize: 20, fontWeight: 700, background: BG_ELEVATED, border: `1px solid ${ACCENT}`, borderRadius: 6, color: TEXT, textAlign: "center", width: "100%", outline: "none", colorScheme: "dark", padding: "4px" }} />
              ) : (
                <div style={{ fontSize: 22, fontWeight: 800, color: TEXT, fontFamily: "'Outfit',sans-serif" }}>${customOfferCOGS.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              )}
            </div>
            <div onClick={() => setShowPnLModal(true)} style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "16px 24px", textAlign: "center", minWidth: 180, cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = BG_ELEVATED; e.currentTarget.style.borderColor = ACCENT; }}
              onMouseLeave={e => { e.currentTarget.style.background = BG_CARD; e.currentTarget.style.borderColor = BORDER; }}>
              <div style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>Offer ({offerCOD}% COD)</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: TEXT, fontFamily: "'Outfit',sans-serif" }}>${offerCOGS.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "16px 24px", textAlign: "center", minWidth: 180 }}>
              <div style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>Total Market Value</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: TEXT, fontFamily: "'Outfit',sans-serif" }}>${totalMarket.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: 20, marginTop: 16, fontSize: 12, color: TEXT_MUTED }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: SUCCESS, display: "inline-block" }} /> Profitable (&gt;$3)</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: WARNING, display: "inline-block" }} /> Low margin ($0–$3)</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: DANGER, display: "inline-block" }} /> Potential loss</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ color: WARNING }}>✎</span> Manual override</span>
          </div>
        </>
      )}

    </div>
  );
};

const QuotesModule = () => {
  const [selected, setSelected] = useState(null);

  const handleNewQuote = () => {
    const nextNum = parseInt(MOCK_QUOTES[0].id.split("-")[1]) + 1;
    setSelected({
      id: `Q-${nextNum}`,
      seller: "New Seller",
      items: 0,
      value: 0,
      status: "draft",
      date: new Date().toISOString().split("T")[0],
      source: "",
      isNew: true,
    });
  };

  if (selected) return <QuoteBuilder quote={selected} onBack={() => setSelected(null)} />;
  return <QuotesList onOpenQuote={setSelected} onNewQuote={handleNewQuote} />;
};

// ─── IMPORTS MODULE ───────────────────────────────────────────────────────────

const ImportsModule = () => {
  const [activeCard, setActiveCard] = useState(null);
  const [importText, setImportText] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [importResults, setImportResults] = useState([]);
  const [importStep, setImportStep] = useState("input");
  const [toast, setToast] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const loadFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImportText(ev.target.result.split("\n").map(l => l.split(",")[0].replace(/"/g, "").trim()).filter(Boolean).join("\n"));
      showToast(`File loaded — ${ev.target.result.split("\n").filter(Boolean).length} rows detected`);
    };
    reader.readAsText(file);
  };
  const handleFileInput = (e) => loadFile(e.target.files[0]);
  const handleDrop = (e) => { e.preventDefault(); setIsDragOver(false); loadFile(e.dataTransfer.files[0]); };

  const processImport = () => {
    const lines = importText.split("\n").map(l => l.trim()).filter(Boolean);
    setImportResults(lines.map(line => ({ ...matchGame(line), selected: matchGame(line).game != null })));
    setImportStep("review");
  };
  const toggleResult = (i) => setImportResults(prev => prev.map((r, idx) => idx === i ? { ...r, selected: !r.selected } : r));
  const confirmImport = () => {
    const count = importResults.filter(r => r.selected && r.game).length;
    showToast(`${count} item${count !== 1 ? "s" : ""} sent to match review`);
    setImportStep("input"); setImportText(""); setImportResults([]); setActiveCard(null);
  };

  const lineCount = importText.split("\n").filter(Boolean).length;

  const cards = [
    { id: "upload", icon: "📄", title: "Upload", desc: "Compatible with CSV and XLSX files" },
    { id: "paste",  icon: "📋", title: "Paste Text List", desc: "Paste a freeform list of game titles" },
    { id: "link",   icon: "🔗", title: "External Link", desc: "Import from PriceCharting collection URL" },
  ];

  return (
    <div>
      {toast && <div style={{ position: "fixed", bottom: 32, right: 32, background: BG_ELEVATED, border: `1px solid ${ACCENT}`, borderRadius: 10, padding: "12px 20px", fontSize: 14, fontWeight: 600, color: ACCENT, zIndex: 9999, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>{toast}</div>}

      <h1 style={{ fontSize: 28, fontWeight: 800, color: TEXT, margin: "0 0 8px", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.03em" }}>Import Collection</h1>
      <p style={{ fontSize: 14, color: TEXT_SECONDARY, margin: "0 0 28px" }}>Import items from a file, text list, or external link</p>

      {/* Original 3-card layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 20 }}>
        {cards.map(c => (
          <Card key={c.id} onClick={() => setActiveCard(activeCard === c.id ? null : c.id)}
            style={{ textAlign: "center", padding: 32, cursor: "pointer", borderColor: activeCard === c.id ? ACCENT : BORDER, background: activeCard === c.id ? ACCENT_BG : BG_CARD }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>{c.icon}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: activeCard === c.id ? ACCENT : TEXT, marginBottom: 6, fontFamily: "'Outfit', sans-serif" }}>{c.title}</div>
            <div style={{ fontSize: 13, color: TEXT_SECONDARY }}>{c.desc}</div>
          </Card>
        ))}
      </div>

      {/* Expanded panel — Upload */}
      {activeCard === "upload" && importStep === "input" && (
        <Card style={{ marginBottom: 24 }}>
          <div
            onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById("im-file-upload").click()}
            style={{ padding: "48px 24px", border: `2px dashed ${isDragOver ? ACCENT : BORDER}`, borderRadius: 10, textAlign: "center", background: isDragOver ? ACCENT_BG : BG_BASE, transition: "all 0.15s", cursor: "pointer", marginBottom: 16 }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>{isDragOver ? "📂" : "📄"}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: isDragOver ? ACCENT : TEXT, marginBottom: 6 }}>
              {isDragOver ? "Drop to import" : "Drag & drop your file here"}
            </div>
            <div style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 20 }}>Compatible with CSV and XLSX files</div>
            <label htmlFor="im-file-upload" onClick={e => e.stopPropagation()}
              style={{ padding: "9px 24px", background: BG_ELEVATED, border: `1px solid ${BORDER}`, borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600, color: TEXT, display: "inline-block" }}>
              Browse Files
            </label>
            <input type="file" accept=".csv,.xlsx,.txt" onChange={handleFileInput} style={{ display: "none" }} id="im-file-upload" />
            {importText && <div style={{ marginTop: 16, fontSize: 13, color: SUCCESS }}>✓ {lineCount} rows loaded</div>}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={processImport} style={{ opacity: !importText.trim() ? 0.5 : 1 }}>Process {lineCount > 0 ? `(${lineCount} items)` : ""}</Btn>
            {importText && <Btn variant="ghost" onClick={() => setImportText("")}>Clear</Btn>}
          </div>
        </Card>
      )}

      {/* Expanded panel — Paste */}
      {activeCard === "paste" && importStep === "input" && (
        <Card style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 8 }}>One game per line</label>
          <textarea
            value={importText}
            onChange={e => setImportText(e.target.value)}
            placeholder={"Super Mario World\nZelda Link to the Past\nChrono Trigger SNES\nPokémon Red GameBoy"}
            style={{ width: "100%", height: 180, background: BG_BASE, border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, padding: "12px 14px", fontSize: 13, fontFamily: "monospace", resize: "vertical", outline: "none", boxSizing: "border-box", colorScheme: "dark", marginBottom: 8 }}
          />
          <div style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 14 }}>{lineCount} line{lineCount !== 1 ? "s" : ""} detected</div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={processImport} style={{ opacity: !importText.trim() ? 0.5 : 1 }}>Process {lineCount > 0 ? `(${lineCount} items)` : ""}</Btn>
            {importText && <Btn variant="ghost" onClick={() => setImportText("")}>Clear</Btn>}
          </div>
        </Card>
      )}

      {/* Expanded panel — External Link */}
      {activeCard === "link" && importStep === "input" && (
        <Card style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 8 }}>PriceCharting Collection URL</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input placeholder="https://www.pricecharting.com/collection/..." style={{ flex: 1, background: BG_BASE, border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, padding: "9px 14px", fontSize: 13, outline: "none", fontFamily: "'Source Sans 3',sans-serif" }} />
            <Btn onClick={() => showToast("External import coming soon")}>Import</Btn>
          </div>
          <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 8 }}>Imports the collection list directly from a public PriceCharting profile URL</div>
        </Card>
      )}

      {/* Match review */}
      {importStep === "review" && (
        <Card style={{ marginBottom: 24, padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: TEXT, fontFamily: "'Outfit',sans-serif" }}>Match Review</div>
              <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 2 }}>{importResults.filter(r => r.game).length} of {importResults.length} matched</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn onClick={confirmImport}>Send {importResults.filter(r => r.selected && r.game).length} to Quote</Btn>
              <Btn variant="secondary" onClick={() => setImportStep("input")}>← Back</Btn>
            </div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}`, background: SURFACE }}>
                {["", "Original", "Matched Title", "Platform", "Market", "Confidence"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {importResults.map((r, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${BORDER}`, background: !r.game ? DANGER_DIM : r.selected ? "transparent" : BG_BASE, opacity: r.selected ? 1 : 0.5 }}>
                  <td style={{ padding: "10px 16px" }}><input type="checkbox" checked={r.selected && !!r.game} disabled={!r.game} onChange={() => toggleResult(i)} style={{ accentColor: ACCENT }} /></td>
                  <td style={{ padding: "10px 16px", color: TEXT_MUTED, fontFamily: "monospace", fontSize: 12 }}>{r.original}</td>
                  <td style={{ padding: "10px 16px", fontWeight: r.game ? 600 : 400, color: r.game ? TEXT : TEXT_MUTED }}>
                    {r.game ? <span style={{ display: "flex", alignItems: "center", gap: 8 }}><span>{r.game.img}</span>{r.game.title}</span> : <span style={{ color: DANGER }}>No match found</span>}
                  </td>
                  <td style={{ padding: "10px 16px", color: TEXT_SECONDARY }}>{r.game?.platform || "—"}</td>
                  <td style={{ padding: "10px 16px", color: r.game ? ACCENT : TEXT_MUTED, fontWeight: 600 }}>{r.game ? `$${r.game.market}` : "—"}</td>
                  <td style={{ padding: "10px 16px" }}>
                    {r.game
                      ? <span style={{ fontSize: 12, fontWeight: 700, color: r.confidence >= 80 ? SUCCESS : r.confidence >= 50 ? WARNING : DANGER }}>{r.confidence}%</span>
                      : <span style={{ fontSize: 12, color: DANGER }}>0%</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Card>
        <SectionHeader title="Recent Imports" />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { name: "marcus_collection.csv", items: 47, date: "2026-03-14", status: "review needed" },
            { name: "sarah_games_list.txt", items: 23, date: "2026-03-15", status: "matched" },
            { name: "pricecharting.com/collection/retro...", items: 112, date: "2026-03-10", status: "complete" },
          ].map((imp, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 8, background: SURFACE }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{imp.name}</div>
                <div style={{ fontSize: 12, color: TEXT_MUTED }}>{imp.items} items · {imp.date}</div>
              </div>
              <StatusChip status={imp.status === "review needed" ? "awaiting review" : imp.status === "matched" ? "accepted" : "done"} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ─── MATCH REVIEW MODULE ──────────────────────────────────────────────────────

const MatchReviewModule = () => {
  const [items, setItems] = useState(MATCH_QUEUE);
  const [filter, setFilter] = useState("all");
  const filtered = items.filter(i => filter === "all" || i.status === filter);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: TEXT, margin: 0, fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.03em" }}>Match Review</h1>
          <p style={{ fontSize: 14, color: TEXT_SECONDARY, margin: "4px 0 0" }}>{items.filter(i => i.status !== "matched").length} items need review</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="secondary">Accept All Confident</Btn>
          <Btn>Save & Continue</Btn>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {["all", "matched", "partial", "unmatched"].map(f => (
          <FilterChip key={f} label={f === "all" ? `All (${items.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${items.filter(i => i.status === f).length})`} active={filter === f} onClick={() => setFilter(f)} />
        ))}
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${BORDER}` }}>
              {["Original Text", "Matched Title", "Platform", "Confidence", "Status", "Issue", "Actions"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 600, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.id} style={{ borderBottom: `1px solid ${BORDER}`, background: m.status === "unmatched" ? DANGER_DIM : "transparent" }}>
                <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 13, color: TEXT }}>{m.original}</td>
                <td style={{ padding: "10px 14px", fontWeight: 600, color: m.matched ? TEXT : TEXT_MUTED }}>{m.matched || "—"}</td>
                <td style={{ padding: "10px 14px", color: TEXT_SECONDARY }}>{m.platform || "—"}</td>
                <td style={{ padding: "10px 14px" }}>
                  {m.confidence > 0 ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 48, height: 6, borderRadius: 3, background: BORDER_LIGHT, overflow: "hidden" }}>
                        <div style={{ width: `${m.confidence}%`, height: "100%", borderRadius: 3, background: m.confidence > 90 ? SUCCESS : m.confidence > 75 ? WARNING : DANGER }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: m.confidence > 90 ? SUCCESS : m.confidence > 75 ? WARNING : DANGER }}>{m.confidence}%</span>
                    </div>
                  ) : <span style={{ color: TEXT_MUTED }}>—</span>}
                </td>
                <td style={{ padding: "10px 14px" }}><StatusChip status={m.status} /></td>
                <td style={{ padding: "10px 14px", fontSize: 12, color: TEXT_MUTED }}>{m.issue || "—"}</td>
                <td style={{ padding: "10px 14px" }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    <Btn small variant="secondary">✓</Btn>
                    <Btn small variant="ghost">✎</Btn>
                    <Btn small variant="ghost">✕</Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

// ─── INVENTORY MODULE ─────────────────────────────────────────────────────────

const InventoryModule = () => {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const filtered = MOCK_INVENTORY.filter(i => {
    if (filter !== "all" && i.status !== filter) return false;
    if (search && !i.title.toLowerCase().includes(search.toLowerCase()) && !i.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: TEXT, margin: 0, fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.03em" }}>Inventory</h1>
          <p style={{ fontSize: 14, color: TEXT_SECONDARY, margin: "4px 0 0" }}>{MOCK_INVENTORY.length} items in stock</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="secondary">Export</Btn>
          <Btn>+ Add Item</Btn>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search inventory..." />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["all", "received", "testing", "cleaning", "photos", "ready to list", "listed"].map(f => (
            <FilterChip key={f} label={f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)} active={filter === f} onClick={() => setFilter(f)} />
          ))}
        </div>
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${BORDER}` }}>
              {["ID", "Title", "Platform", "Condition", "Cost", "Market", "P/L", "Status", "Location", "Source"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: h === "Cost" || h === "Market" || h === "P/L" ? "right" : "left", fontSize: 11, fontWeight: 600, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => {
              const pl = item.market - item.cost;
              return (
                <tr key={item.id} style={{ borderBottom: `1px solid ${BORDER}` }} onMouseEnter={e => e.currentTarget.style.background = SURFACE} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "10px 14px", fontWeight: 600, color: ACCENT, fontSize: 12 }}>{item.id}</td>
                  <td style={{ padding: "10px 14px", fontWeight: 600, color: TEXT }}>{item.title}</td>
                  <td style={{ padding: "10px 14px", color: TEXT_SECONDARY }}>{item.platform}</td>
                  <td style={{ padding: "10px 14px", color: TEXT_SECONDARY }}>{item.condition}</td>
                  <td style={{ padding: "10px 14px", textAlign: "right", color: TEXT_SECONDARY }}>${item.cost}</td>
                  <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 600, color: TEXT }}>${item.market}</td>
                  <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: pl > 0 ? SUCCESS : DANGER }}>{pl > 0 ? "+" : ""}${pl}</td>
                  <td style={{ padding: "10px 14px" }}><StatusChip status={item.status} /></td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: TEXT_MUTED }}>{item.location}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: ACCENT }}>{item.source}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

// ─── TASKS MODULE ─────────────────────────────────────────────────────────────

const TasksModule = () => {
  const [tasks, setTasks] = useState(MOCK_TASKS);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: TEXT, margin: 0, fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.03em" }}>Tasks</h1>
        <Btn>+ New Task</Btn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
        {["open", "in progress", "done"].map(status => (
          <div key={status}>
            <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_SECONDARY, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
              <span style={{ background: BORDER, borderRadius: 10, padding: "2px 8px", fontSize: 11, color: TEXT_MUTED }}>{tasks.filter(t => t.status === status).length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {tasks.filter(t => t.status === status).map(t => (
                <Card key={t.id} style={{ padding: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <PriorityDot priority={t.priority} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{t.title}</span>
                  </div>
                  <div style={{ fontSize: 12, color: TEXT_MUTED }}>
                    {t.item} · Due: {t.due}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── SALES HISTORY MODULE ─────────────────────────────────────────────────────

const SalesModule = () => {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const filtered = MOCK_SALES.filter(s => {
    if (filter !== "all" && s.status !== filter) return false;
    if (search && !s.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const totalProfit = filtered.reduce((s, i) => s + i.profit, 0);
  const totalRevenue = filtered.reduce((s, i) => s + i.sold, 0);
  const avgMargin = filtered.length > 0 ? (filtered.reduce((s, i) => s + i.margin, 0) / filtered.length).toFixed(1) : 0;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: TEXT, margin: 0, fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.03em" }}>Sales History</h1>
          <p style={{ fontSize: 14, color: TEXT_SECONDARY, margin: "4px 0 0" }}>{MOCK_SALES.length} recorded sales</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="secondary">Export</Btn>
          <Btn>+ Record Sale</Btn>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <Card style={{ flex: 1, padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 600, textTransform: "uppercase" }}>Revenue</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: TEXT, fontFamily: "'Outfit', sans-serif" }}>${totalRevenue.toFixed(2)}</div>
        </Card>
        <Card style={{ flex: 1, padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 600, textTransform: "uppercase" }}>Profit</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: SUCCESS, fontFamily: "'Outfit', sans-serif" }}>${totalProfit.toFixed(2)}</div>
        </Card>
        <Card style={{ flex: 1, padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 600, textTransform: "uppercase" }}>Avg Margin</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: TEXT, fontFamily: "'Outfit', sans-serif" }}>{avgMargin}%</div>
        </Card>
        <Card style={{ flex: 1, padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 600, textTransform: "uppercase" }}>Refunds</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: DANGER, fontFamily: "'Outfit', sans-serif" }}>{MOCK_SALES.filter(s => s.status === "refunded").length}</div>
        </Card>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search sales..." />
        <div style={{ display: "flex", gap: 6 }}>
          {["all", "sold", "refunded"].map(f => (
            <FilterChip key={f} label={f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)} active={filter === f} onClick={() => setFilter(f)} />
          ))}
        </div>
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${BORDER}` }}>
              {["ID", "Title", "Platform", "Sold", "Cost", "Fees", "Shipping", "Profit", "Margin", "Channel", "Date", "Status"].map(h => (
                <th key={h} style={{ padding: "10px 12px", textAlign: ["Sold", "Cost", "Fees", "Shipping", "Profit", "Margin"].includes(h) ? "right" : "left", fontSize: 11, fontWeight: 600, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} style={{ borderBottom: `1px solid ${BORDER}`, background: s.status === "refunded" ? DANGER_DIM : "transparent" }} onMouseEnter={e => e.currentTarget.style.background = s.status === "refunded" ? "#991B1B33" : SURFACE} onMouseLeave={e => e.currentTarget.style.background = s.status === "refunded" ? DANGER_DIM : "transparent"}>
                <td style={{ padding: "10px 12px", fontWeight: 600, color: ACCENT, fontSize: 12 }}>{s.id}</td>
                <td style={{ padding: "10px 12px", fontWeight: 600, color: TEXT }}>{s.title}</td>
                <td style={{ padding: "10px 12px", color: TEXT_SECONDARY }}>{s.platform}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600 }}>${s.sold}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", color: TEXT_SECONDARY }}>${s.cost}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", color: TEXT_MUTED }}>${s.fees}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", color: TEXT_MUTED }}>${s.shipping}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: s.profit > 0 ? SUCCESS : DANGER }}>${s.profit.toFixed(2)}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", color: TEXT_SECONDARY }}>{s.margin}%</td>
                <td style={{ padding: "10px 12px", color: TEXT_SECONDARY }}>{s.channel}</td>
                <td style={{ padding: "10px 12px", color: TEXT_SECONDARY }}>{s.date}</td>
                <td style={{ padding: "10px 12px" }}><StatusChip status={s.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

// ─── REPORTS MODULE ───────────────────────────────────────────────────────────

const ReportsModule = () => {
  const profitByMonth = [
    { month: "Oct", profit: 1100, revenue: 3200, items: 18 },
    { month: "Nov", profit: 1900, revenue: 4800, items: 24 },
    { month: "Dec", profit: 3100, revenue: 7200, items: 38 },
    { month: "Jan", profit: 2000, revenue: 5100, items: 22 },
    { month: "Feb", profit: 2700, revenue: 6400, items: 30 },
    { month: "Mar", profit: 2300, revenue: 5800, items: 26 },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: TEXT, margin: 0, fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.03em" }}>Reports</h1>
        <Btn variant="secondary">Export All</Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <Card>
          <SectionHeader title="Monthly Profit & Revenue" />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={profitByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: TEXT_MUTED }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: TEXT_MUTED }} tickFormatter={v => `$${v}`} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="revenue" fill={ACCENT} radius={[4, 4, 0, 0]} name="Revenue" />
              <Bar dataKey="profit" fill="#60A5FA" radius={[4, 4, 0, 0]} name="Profit" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SectionHeader title="Profit by Platform" />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={PLATFORM_PROFIT} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: TEXT_MUTED }} tickFormatter={v => `$${v}`} />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: TEXT_SECONDARY }} width={60} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => `$${v}`} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {PLATFORM_PROFIT.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
        {[
          { title: "Quote Performance", stats: [{ label: "Acceptance Rate", value: "62%" }, { label: "Avg Offer %", value: "58%" }, { label: "Total Quotes", value: "42" }, { label: "Projected vs Actual", value: "+8%" }] },
          { title: "Inventory Health", stats: [{ label: "Total Items", value: "108" }, { label: "Inventory Value", value: "$8,420" }, { label: "Avg Days to Sell", value: "18" }, { label: "Dead Stock", value: "3 items" }] },
          { title: "Top Sources", stats: [{ label: "FB Marketplace", value: "$1,720 profit" }, { label: "eBay Sellers", value: "$4,200 profit" }, { label: "Local Pickup", value: "$980 profit" }, { label: "Yard Sales", value: "$620 profit" }] },
        ].map((section, i) => (
          <Card key={i}>
            <SectionHeader title={section.title} />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {section.stats.map((s, j) => (
                <div key={j} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: TEXT_SECONDARY }}>{s.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{s.value}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ─── SELLERS MODULE ───────────────────────────────────────────────────────────

const SellersModule = () => (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: TEXT, margin: 0, fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.03em" }}>Sellers & Sources</h1>
      <Btn>+ Add Seller</Btn>
    </div>
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${BORDER}` }}>
            {["Name", "Source Type", "Location", "Quotes", "Accepted", "Total Spent", "Total Profit", "ROI"].map(h => (
              <th key={h} style={{ padding: "12px 16px", textAlign: ["Total Spent", "Total Profit", "ROI"].includes(h) ? "right" : "left", fontSize: 11, fontWeight: 600, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MOCK_SELLERS.map(s => (
            <tr key={s.id} style={{ borderBottom: `1px solid ${BORDER}` }} onMouseEnter={e => e.currentTarget.style.background = SURFACE} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <td style={{ padding: "12px 16px", fontWeight: 600, color: TEXT }}>{s.name}</td>
              <td style={{ padding: "12px 16px", color: TEXT_SECONDARY }}>{s.type}</td>
              <td style={{ padding: "12px 16px", color: TEXT_MUTED }}>{s.city}</td>
              <td style={{ padding: "12px 16px", color: TEXT_SECONDARY }}>{s.quotes}</td>
              <td style={{ padding: "12px 16px", color: TEXT_SECONDARY }}>{s.accepted}</td>
              <td style={{ padding: "12px 16px", textAlign: "right", color: TEXT_SECONDARY }}>${s.totalSpent.toLocaleString()}</td>
              <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: s.totalProfit > 0 ? SUCCESS : TEXT_MUTED }}>${s.totalProfit.toLocaleString()}</td>
              <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600, color: ACCENT }}>{s.totalSpent > 0 ? ((s.totalProfit / s.totalSpent) * 100).toFixed(0) + "%" : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  </div>
);

// ─── PRESETS MODULE ───────────────────────────────────────────────────────────

const PresetsModule = () => (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: TEXT, margin: 0, fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.03em" }}>Pricing Presets</h1>
      <Btn>+ New Preset</Btn>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      {MOCK_PRESETS.map(p => (
        <Card key={p.id} onClick={() => {}} style={{ cursor: "pointer" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: TEXT, margin: 0, fontFamily: "'Outfit', sans-serif" }}>{p.name}</h3>
              <p style={{ fontSize: 13, color: TEXT_SECONDARY, margin: "4px 0 0" }}>{p.desc}</p>
            </div>
            <Btn small variant="ghost">✎</Btn>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {[
              { label: "Offer %", value: `${p.offerPct}%` },
              { label: "Fees", value: `${p.fees}%` },
              { label: "Shipping", value: `$${p.shipping}` },
              { label: "Labor", value: `$${p.labor}` },
              { label: "Risk Buffer", value: `${p.risk}%` },
            ].map((s, i) => (
              <div key={i} style={{ padding: "8px 10px", borderRadius: 6, background: SURFACE }}>
                <div style={{ fontSize: 10, color: TEXT_MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: TEXT, fontFamily: "'Outfit', sans-serif" }}>{s.value}</div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  </div>
);

// ─── SETTINGS MODULE ──────────────────────────────────────────────────────────

const SettingsModule = () => (
  <div>
    <h1 style={{ fontSize: 28, fontWeight: 800, color: TEXT, margin: "0 0 24px", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.03em" }}>Settings</h1>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      {[
        { title: "Business Info", desc: "Company name, contact info, and branding", icon: "🏢" },
        { title: "Sales Channels", desc: "Configure eBay, Mercari, Amazon, and other platforms", icon: "🛒" },
        { title: "Fee Schedules", desc: "Platform fees, shipping rates, and material costs", icon: "💰" },
        { title: "Users & Roles", desc: "Manage team members and permissions", icon: "👥" },
        { title: "Notifications", desc: "Alert preferences and email notifications", icon: "🔔" },
        { title: "Data & Backups", desc: "Export data, manage backups, and restore", icon: "💾" },
        { title: "Integrations", desc: "Connect PriceCharting, eBay API, and more", icon: "🔗" },
        { title: "Appearance", desc: "Theme, layout, and display preferences", icon: "🎨" },
      ].map((s, i) => (
        <Card key={i} onClick={() => {}} style={{ display: "flex", alignItems: "center", gap: 16, padding: 20, cursor: "pointer" }}>
          <div style={{ fontSize: 28 }}>{s.icon}</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: TEXT, fontFamily: "'Outfit', sans-serif" }}>{s.title}</div>
            <div style={{ fontSize: 13, color: TEXT_SECONDARY }}>{s.desc}</div>
          </div>
        </Card>
      ))}
    </div>
  </div>
);

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState("dashboard");

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <Dashboard onNavigate={setPage} />;
      case "quotes": return <QuotesModule />;
      case "imports": return <ImportsModule />;
      case "match": return <MatchReviewModule />;
      case "inventory": return <InventoryModule />;
      case "tasks": return <TasksModule />;
      case "sales": return <SalesModule />;
      case "reports": return <ReportsModule />;
      case "sellers": return <SellersModule />;
      case "presets": return <PresetsModule />;
      case "settings": return <SettingsModule />;
      default: return <Dashboard onNavigate={setPage} />;
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Source+Sans+3:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Source Sans 3', -apple-system, sans-serif; background: ${BG_BASE}; color: ${TEXT}; -webkit-font-smoothing: antialiased; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${BORDER_LIGHT}; border-radius: 3px; }
        button:hover { opacity: 0.88; }
        input:focus { border-color: ${ACCENT} !important; box-shadow: 0 0 0 3px ${ACCENT}22; }
        input::placeholder { color: ${TEXT_MUTED}; }
      `}</style>
      <Sidebar active={page} onNavigate={setPage} />
      <main style={{ marginLeft: 240, padding: "32px 40px", minHeight: "100vh", maxWidth: 1280 }}>
        {renderPage()}
      </main>
    </>
  );
}
