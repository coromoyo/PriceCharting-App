import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronDown, Plus } from 'lucide-react';
import { fetchGames as apiFetchGames, fetchGamesByName, fetchLatestSnapshot } from "./api/pricechartApi";

// adjust relative path if needed

// Mock data - replace this with your actual API data
type UIGame = {
  id: number;
  title: string;
  platform: string;
  image: string;
  condition: string;
  priceDetails: string;
  value: number;
};

const mockGameData = [
  {
    id: 1,
    title: 'Earthbound',
    platform: 'SNES',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=80&h=80&fit=crop',
    condition: 'Complete',
    priceDetails: 'CIB:$2,197.58 L:$327.96 N:$7,032.00',
    value: 2197.58
  },
  {
    id: 2,
    title: 'Mario 64',
    platform: 'N64',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=80&h=80&fit=crop',
    condition: 'Loose',
    priceDetails: 'CIB:$142.22 L:$38.76 N:$929.91',
    value: 38.76
  }
];



export default function GameCollectionUI() {
  const [activeTab, setActiveTab] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [filterState, setFilterState] = useState('Complete');
  const [games, setGames] = useState<UIGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPnLModal, setShowPnLModal] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportStep, setExportStep] = useState('type');
  const [exportType, setExportType] = useState('');
  const [customOfferCOD, setCustomOfferCOD] = useState(60);
  const [offerCOD, setOfferCOD] = useState(55);
  const [showAddGameModal, setShowAddGameModal] = useState(false);
  const [searchResults, setSearchResults] = useState<UIGame[]>([]);

  // Fetch games from API on component mount
  useEffect(() => {
    fetchGames();
  }, []);

  // API FUNCTIONS - These handle all communication with FastAPI

  // const fetchGames = async () => {
  //   setLoading(true);
  //   setError(null);
  //   try {
  //     // UNCOMMENT THIS WHEN YOUR API IS READY:
  //     // const response = await fetch(API_ENDPOINTS.getGames);
  //     // if (!response.ok) throw new Error('Failed to fetch games');
  //     // const data = await response.json();
  //     // setGames(data);

  //     // USING MOCK DATA FOR NOW:
  //     setGames(mockGameData);
  //   } catch (err) {
  //     setError(err.message);
  //     console.error('Error fetching games:', err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const fetchGames = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetchGames({ page: 1, page_size: 50 });

      // Map backend -> UI shape
      const base: UIGame[] = data.items.map((g) => ({
        id: g.id,
        title: g.product_name,
        platform: g.console_name,
        image: "https://via.placeholder.com/80",
        condition: "Complete",
        priceDetails: "",
        value: 0,
      }));

      // Set immediately so UI renders fast
      setGames(base);

      // Then enrich with latest snapshots (parallel)
      const enriched = await Promise.all(
        base.map(async (game) => {
          try {
            const snap = await fetchLatestSnapshot(game.id);
            return {
              ...game,
              priceDetails: buildPriceDetails(snap),
              value: pickValueByCondition(snap, game.condition),
            };
          } catch {
            // If a game has no snapshots yet, keep defaults
            return game;
          }
        })
      );

      setGames(enriched);

    } catch (err: any) {
      setError(err.message || 'Failed to fetch games');
      console.error('Error fetching games:', err);
    } finally {
      setLoading(false);
    }
  };
  const formatUSD = (n: number | null | undefined) =>
    n == null ? "--" : `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const buildPriceDetails = (snap: any) =>
    `CIB:${formatUSD(snap.cib_price)} L:${formatUSD(snap.loose_price)} N:${formatUSD(snap.new_price)}`;

  const pickValueByCondition = (snap: any, condition: string): number => {
    switch (condition) {
      case "Loose":
        return snap.loose_price ?? 0;
      case "Complete":
        return snap.cib_price ?? 0;
      case "New":
        return snap.new_price ?? 0;
      case "Box Only":
        return snap.box_only_price ?? 0;
      case "Manual Only":
        return snap.manual_only_price ?? 0;

      // You don’t have “Graded” pricing choices in your dropdown yet besides labels,
      // but if you want it:
      case "Graded CIB":
      case "Graded New":
        return snap.graded_price ?? 0;

      // These are not real snapshot fields right now; keep safe fallback:
      case "Item & Box":
      case "Item & Manual":
      default:
        return snap.cib_price ?? 0;
    }
  };


  const updateGameState = async (gameId: number, newState: string) => {
    try {
      // First update condition immediately (snappy UX)
      setGames((prev) =>
        prev.map((g) => (g.id === gameId ? { ...g, condition: newState } : g))
      );

      // Then fetch latest snapshot and recalc value
      const snap = await fetchLatestSnapshot(gameId);

      setGames((prev) =>
        prev.map((g) =>
          g.id === gameId
            ? {
              ...g,
              condition: newState,
              priceDetails: buildPriceDetails(snap),
              value: pickValueByCondition(snap, newState),
            }
            : g
        )
      );
    } catch (err: any) {
      setError(err.message || "Failed to update game state");
      console.error("Error updating game state:", err);
    }
  };


  // const searchForGames = async () => {
  //   if (!searchText.trim()) {
  //     alert('Please enter a game title to search');
  //     return;
  //   }

  //   setLoading(true);
  //   try {
  //     // UNCOMMENT THIS WHEN YOUR API IS READY:
  //     // const response = await fetch(`${API_BASE_URL}/search?query=${encodeURIComponent(searchText)}`);
  //     // if (!response.ok) throw new Error('Failed to search games');
  //     // const data = await response.json();
  //     // setSearchResults(data);

  //     // MOCK SEARCH RESULTS FOR NOW:
  //     const mockResults = [
  //       {
  //         id: Date.now(),
  //         title: searchText,
  //         platform: 'SNES',
  //         image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=80&h=80&fit=crop',
  //         condition: filterState,
  //         priceDetails: 'CIB:$100.00 L:$50.00 N:$200.00',
  //         value: 100.00
  //       }
  //     ];
  //     setSearchResults(mockResults);
  //     setShowAddGameModal(true);
  //   } catch (err) {
  //     setError(err.message);
  //     console.error('Error searching games:', err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const searchForGames = async () => {
    if (!searchText.trim()) {
      alert('Please enter a game title to search');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await fetchGamesByName({
        product_name: searchText.trim(),
        limit: 50,
        // console: add later when you make a dropdown
      });

      const base: UIGame[] = results.map((g) => ({
        id: g.id,
        title: g.product_name,
        platform: g.console_name,
        image: "https://via.placeholder.com/80",
        condition: filterState,
        priceDetails: "",
        value: 0,
      }));

      // Show immediately
      setSearchResults(base);
      setShowAddGameModal(true);

      // Enrich with snapshots
      const enriched = await Promise.all(
        base.map(async (game) => {
          try {
            const snap = await fetchLatestSnapshot(game.id);
            return {
              ...game,
              priceDetails: buildPriceDetails(snap),
              value: pickValueByCondition(snap, game.condition),
            };
          } catch {
            return game;
          }
        })
      );

      setSearchResults(enriched);
      setShowAddGameModal(true);
    } catch (err: any) {
      setError(err.message || 'Failed to search games');
      console.error('Error searching games:', err);
    } finally {
      setLoading(false);
    }
  };


  const addGameToList = (game: UIGame) => {
    // Check if game already exists
    if (games.find(g => g.id === game.id)) {
      alert('This game is already in your list');
      return;
    }

    // UNCOMMENT THIS WHEN YOUR API IS READY:
    // const response = await fetch(API_ENDPOINTS.createGame, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(game)
    // });
    // if (!response.ok) throw new Error('Failed to add game');

    setGames([...games, game]);
    setShowAddGameModal(false);
    setSearchText('');
    setSearchResults([]);
  };

  const totalValue = games.reduce((sum, game) => sum + game.value, 0);

  const customOfferCOGS = totalValue * (customOfferCOD / 100);
  const offerCOGS = totalValue * (offerCOD / 100);

  const platformFees = totalValue * 0.137;

  const pnlData = {
    salePrice: totalValue,
    customOffer: {
      cogs: customOfferCOGS,
      cod: customOfferCOD,
      platformFees: platformFees,
      profit: totalValue - platformFees - customOfferCOGS,
      profitMargin: customOfferCOGS > 0 ? (((totalValue - platformFees - customOfferCOGS) / customOfferCOGS) * 100).toFixed(0) : 0
    },
    offer: {
      cogs: offerCOGS,
      cod: offerCOD,
      platformFees: platformFees,
      profit: totalValue - platformFees - offerCOGS,
      profitMargin: offerCOGS > 0 ? (((totalValue - platformFees - offerCOGS) / offerCOGS) * 100).toFixed(0) : 0
    },
    variance: (totalValue - platformFees - offerCOGS) - (totalValue - platformFees - customOfferCOGS)
  };

  const handleStateChange = (gameId: number, newState: string) => {
    updateGameState(gameId, newState);
  };

  const handleSort = (sortType: "a-z" | "z-a" | "high-low" | "low-high") => {
    let sortedGames = [...games];

    switch (sortType) {
      case 'a-z':
        sortedGames.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'z-a':
        sortedGames.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'high-low':
        sortedGames.sort((a, b) => b.value - a.value);
        break;
      case 'low-high':
        sortedGames.sort((a, b) => a.value - b.value);
        break;
      default:
        break;
    }

    setGames(sortedGames);
    setShowSortMenu(false);
  };

  const handleExportTypeSelect = (type: string) => {
    setExportType(type);
    setExportStep('format');
  };

  const handleExportFormat = (format: string) => {
    alert(`Exporting ${exportType} as ${format.toUpperCase()}`);
    setShowExportMenu(false);
    setExportStep('type');
    setExportType('');
  };

  const handleExportMenuToggle = () => {
    setShowExportMenu(!showExportMenu);
    setExportStep('type');
    setExportType('');
  };

  return (
    <div className="min-h-screen text-white p-4" style={{
      background: 'radial-gradient(ellipse at top, #000000 0%, #0d0d0d 50%, #1a1a1a 100%)'
    }}>
      {/* Loading State */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="text-white text-xl">Loading games...</div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-900 bg-opacity-50 border border-red-600 rounded-lg p-4 mb-4">
          <p className="text-red-200">Error: {error}</p>
          <button
            onClick={fetchGames}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Add Game Modal */}
      {showAddGameModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={() => setShowAddGameModal(false)}
        >
          <div
            className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-auto animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Add Game to Collection</h2>
              <button
                onClick={() => setShowAddGameModal(false)}
                className="text-gray-400 hover:text-white text-2xl transition-colors"
              >
                ×
              </button>
            </div>

            {searchResults.length === 0 ? (
              <p className="text-gray-400">No games found. Try a different search.</p>
            ) : (
              <div className="space-y-3">
                {searchResults.map((game) => (
                  <div
                    key={game.id}
                    className="bg-gray-800 rounded-lg p-4 flex items-center gap-4 hover:bg-gray-700 transition-colors"
                  >
                    <img
                      src={game.image}
                      alt={game.title}
                      className="w-20 h-20 rounded object-cover"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-lg">
                        {game.title} <span className="text-gray-500">{game.platform}</span>
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        {game.priceDetails}
                      </div>
                      <div className="text-green-400 font-semibold mt-1">
                        ${game.value.toFixed(2)}
                      </div>
                    </div>
                    <button
                      onClick={() => addGameToList(game)}
                      className="px-4 py-2 bg-green-600 text-black font-semibold rounded hover:bg-green-700 transition-colors"
                    >
                      Add to List
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowAddGameModal(false)}
                className="px-6 py-2 bg-gray-700 text-white font-semibold rounded hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>

      {/* PnL Modal */}
      {showPnLModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={() => setShowPnLModal(false)}
        >
          <div
            className="bg-gray-900 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">P&L Analysis</h2>
              <button
                onClick={() => setShowPnLModal(false)}
                className="text-gray-400 hover:text-white text-2xl transition-colors"
              >
                ×
              </button>
            </div>

            <div className="bg-gray-800 rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="text-left p-3 font-semibold">Title</th>
                    <th className="text-center p-3 font-semibold">Custom Offer</th>
                    <th className="text-center p-3 font-semibold">Offer</th>
                    <th className="text-center p-3 font-semibold">Variance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gray-700">
                    <td className="p-3 font-semibold">Sale Price</td>
                    <td className="text-center p-3">${pnlData.salePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="text-center p-3">${pnlData.salePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="text-center p-3"></td>
                  </tr>
                  <tr className="border-t border-gray-700 bg-gray-750">
                    <td className="p-3 font-semibold">COGS (Cost of Goods)</td>
                    <td className="text-center p-3">${pnlData.customOffer.cogs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="text-center p-3">${pnlData.offer.cogs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="text-center p-3"></td>
                  </tr>
                  <tr className="border-t border-gray-700">
                    <td className="p-3 font-semibold">COD</td>
                    <td className="text-center p-3">
                      <input
                        type="number"
                        value={customOfferCOD}
                        onChange={(e) => setCustomOfferCOD(parseFloat(e.target.value) || 0)}
                        className="w-20 bg-gray-700 text-white text-center rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-600"
                        min="0"
                        max="100"
                      />%
                    </td>
                    <td className="text-center p-3">
                      <input
                        type="number"
                        value={offerCOD}
                        onChange={(e) => setOfferCOD(parseFloat(e.target.value) || 0)}
                        className="w-20 bg-gray-700 text-white text-center rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-600"
                        min="0"
                        max="100"
                      />%
                    </td>
                    <td className="text-center p-3"></td>
                  </tr>
                  <tr className="border-t border-gray-700 bg-gray-750">
                    <td className="p-3 font-semibold">Platform Fees</td>
                    <td className="text-center p-3">${pnlData.customOffer.platformFees.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="text-center p-3">${pnlData.offer.platformFees.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="text-center p-3"></td>
                  </tr>
                  <tr className="border-t border-gray-700 bg-green-900 bg-opacity-30">
                    <td className="p-3 font-bold text-green-400">Profit</td>
                    <td className="text-center p-3 font-bold text-green-400">${pnlData.customOffer.profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="text-center p-3 font-bold text-green-400">${pnlData.offer.profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="text-center p-3 font-bold text-green-400">${pnlData.variance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr className="border-t border-gray-700">
                    <td className="p-3 font-semibold">Profit Margin</td>
                    <td className="text-center p-3">{pnlData.customOffer.profitMargin}%</td>
                    <td className="text-center p-3">{pnlData.offer.profitMargin}%</td>
                    <td className="text-center p-3"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowPnLModal(false)}
                className="px-6 py-2 bg-green-600 text-black font-semibold rounded hover:bg-green-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {['Tab 1', 'Tab 2', 'Tab 3'].map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`px-6 py-2 rounded font-semibold transition-colors ${activeTab === index
              ? 'bg-green-600 text-black'
              : 'bg-green-700 text-black hover:bg-green-600'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search Section */}
      <div className="mb-6">
        <div className="text-gray-500 mb-2 text-sm">Search</div>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Type video game title..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="flex-1 px-4 py-2 bg-gray-700 rounded border-none focus:outline-none focus:ring-2 focus:ring-green-600"
          />
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            className="px-4 py-2 bg-green-600 text-black font-semibold rounded border-none focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
          >
            <option value="Loose">Loose</option>
            <option value="Item & Box">Item & Box</option>
            <option value="Item & Manual">Item & Manual</option>
            <option value="Complete">Complete</option>
            <option value="New">New</option>
            <option value="Graded CIB">Graded CIB</option>
            <option value="Graded New">Graded New</option>
            <option value="Box Only">Box Only</option>
            <option value="Manual Only">Manual Only</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={searchForGames}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-black font-semibold rounded hover:bg-green-700 transition-colors"
          >
            <Plus size={16} />
            Add Game
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-black font-semibold rounded hover:bg-green-700 transition-colors">
            <Filter size={16} />
            Filter ...
          </button>
        </div>
      </div>

      {/* Table and Buttons Container */}
      <div className="flex gap-4 mb-6">
        {/* Table */}
        <div className="flex-1 rounded-lg overflow-hidden" style={{ backgroundColor: '#2a2a2a' }}>
          <table className="w-full">
            <thead>
              <tr className="bg-black">
                <th className="text-left p-4 font-semibold">Title</th>
                <th className="text-left p-4 font-semibold">State</th>
                <th className="text-left p-4 font-semibold">Value</th>
              </tr>
            </thead>
            <tbody>
              {games.map((game) => (
                <tr
                  key={game.id}
                  className="border-t transition-colors cursor-pointer"
                  style={{
                    borderColor: '#404040'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#383838'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={game.image}
                        alt={game.title}
                        className="w-16 h-16 rounded object-cover"
                      />
                      <div>
                        <div className="font-semibold">
                          {game.title} <span className="text-gray-500">{game.platform}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {game.priceDetails}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <select
                      value={game.condition}
                      onChange={(e) => handleStateChange(game.id, e.target.value)}
                      className="px-4 py-2 bg-green-600 text-black font-semibold rounded border-none focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
                    >
                      <option value="Loose">Loose</option>
                      <option value="Item & Box">Item & Box</option>
                      <option value="Item & Manual">Item & Manual</option>
                      <option value="Complete">Complete</option>
                      <option value="New">New</option>
                      <option value="Graded CIB">Graded CIB</option>
                      <option value="Graded New">Graded New</option>
                      <option value="Box Only">Box Only</option>
                      <option value="Manual Only">Manual Only</option>
                    </select>
                  </td>
                  <td className="p-4 font-semibold text-lg">
                    ${game.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Side Buttons */}
        <div className="flex flex-col gap-2 relative">
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="px-6 py-2 bg-green-600 text-black font-semibold rounded hover:bg-green-700 transition-colors whitespace-nowrap"
          >
            Sort
          </button>

          {/* Sort Menu */}
          {showSortMenu && (
            <div className="absolute top-12 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 min-w-[160px]">
              <button
                onClick={() => handleSort('a-z')}
                className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors rounded-t-lg"
              >
                A to Z
              </button>
              <button
                onClick={() => handleSort('z-a')}
                className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors border-t border-gray-700"
              >
                Z to A
              </button>
              <button
                onClick={() => handleSort('high-low')}
                className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors border-t border-gray-700"
              >
                High to Low
              </button>
              <button
                onClick={() => handleSort('low-high')}
                className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors border-t border-gray-700 rounded-b-lg"
              >
                Low to High
              </button>
            </div>
          )}

          <div className="flex-1"></div>
          <button className="px-6 py-2 bg-green-600 text-black font-semibold rounded hover:bg-green-700 transition-colors whitespace-nowrap">
            Sort
          </button>
          <button
            onClick={handleExportMenuToggle}
            className="px-6 py-2 bg-green-600 text-black font-semibold rounded hover:bg-green-700 transition-colors whitespace-nowrap"
          >
            Export
          </button>

          {/* Export Menu */}
          {showExportMenu && (
            <div className="absolute bottom-12 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 min-w-[180px]">
              {exportStep === 'type' ? (
                <>
                  <button
                    onClick={() => handleExportTypeSelect('all')}
                    className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors rounded-t-lg"
                  >
                    Export All
                  </button>
                  <button
                    onClick={() => handleExportTypeSelect('selection')}
                    className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors border-t border-gray-700 rounded-b-lg"
                  >
                    Export Selection
                  </button>
                </>
              ) : (
                <>
                  <div className="px-4 py-2 text-sm text-gray-400 border-b border-gray-700">
                    Select Format
                  </div>
                  <button
                    onClick={() => handleExportFormat('png')}
                    className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors"
                  >
                    PNG
                  </button>
                  <button
                    onClick={() => handleExportFormat('pdf')}
                    className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors border-t border-gray-700"
                  >
                    PDF
                  </button>
                  <button
                    onClick={() => handleExportFormat('csv')}
                    className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors border-t border-gray-700"
                  >
                    CSV
                  </button>
                  <button
                    onClick={() => handleExportFormat('xlsx')}
                    className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors border-t border-gray-700 rounded-b-lg"
                  >
                    XLSX
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Total Cards */}
      <div className="flex gap-4 justify-center">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center min-w-[180px]">
          <div className="text-sm mb-2">Custom Offer</div>
          <div className="text-2xl font-semibold">
            ${customOfferCOGS.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div
          onClick={() => setShowPnLModal(true)}
          className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center min-w-[180px] cursor-pointer hover:bg-gray-700 transition-colors"
        >
          <div className="text-sm mb-2">Offer</div>
          <div className="text-2xl font-semibold">
            ${offerCOGS.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center min-w-[180px]">
          <div className="text-sm mb-2">Total</div>
          <div className="text-2xl font-semibold">
            ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>
    </div>
  );
}