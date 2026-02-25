import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronDown, Plus, Trash2, X } from 'lucide-react';

// Mock data - replace this with your actual API data
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

// Mock searchable game database
const mockGameDatabase = [
  {
    id: 101,
    title: 'Super Mario World',
    platform: 'SNES',
    image: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=80&h=80&fit=crop',
    condition: 'Complete',
    priceDetails: 'CIB:$45.00 L:$15.00 N:$150.00',
    value: 45.00
  },
  {
    id: 102,
    title: 'The Legend of Zelda: Ocarina of Time',
    platform: 'N64',
    image: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=80&h=80&fit=crop',
    condition: 'Complete',
    priceDetails: 'CIB:$85.00 L:$35.00 N:$250.00',
    value: 85.00
  },
  {
    id: 103,
    title: 'Chrono Trigger',
    platform: 'SNES',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=80&h=80&fit=crop',
    condition: 'Complete',
    priceDetails: 'CIB:$450.00 L:$120.00 N:$1,200.00',
    value: 450.00
  },
  {
    id: 104,
    title: 'Pokemon Red',
    platform: 'Game Boy',
    image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=80&h=80&fit=crop',
    condition: 'Loose',
    priceDetails: 'CIB:$150.00 L:$40.00 N:$500.00',
    value: 40.00
  },
  {
    id: 105,
    title: 'Final Fantasy VII',
    platform: 'PS1',
    image: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=80&h=80&fit=crop',
    condition: 'Complete',
    priceDetails: 'CIB:$65.00 L:$25.00 N:$200.00',
    value: 65.00
  },
  {
    id: 106,
    title: 'Super Metroid',
    platform: 'SNES',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=80&h=80&fit=crop',
    condition: 'Complete',
    priceDetails: 'CIB:$180.00 L:$55.00 N:$600.00',
    value: 180.00
  },
  {
    id: 107,
    title: 'GoldenEye 007',
    platform: 'N64',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=80&h=80&fit=crop',
    condition: 'Loose',
    priceDetails: 'CIB:$55.00 L:$20.00 N:$180.00',
    value: 20.00
  },
  {
    id: 108,
    title: 'Mega Man X',
    platform: 'SNES',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=80&h=80&fit=crop',
    condition: 'Complete',
    priceDetails: 'CIB:$120.00 L:$35.00 N:$400.00',
    value: 120.00
  },
  {
    id: 109,
    title: 'Resident Evil 2',
    platform: 'PS1',
    image: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=80&h=80&fit=crop',
    condition: 'Complete',
    priceDetails: 'CIB:$75.00 L:$30.00 N:$250.00',
    value: 75.00
  },
  {
    id: 110,
    title: 'Castlevania: Symphony of the Night',
    platform: 'PS1',
    image: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=80&h=80&fit=crop',
    condition: 'Complete',
    priceDetails: 'CIB:$250.00 L:$80.00 N:$800.00',
    value: 250.00
  }
];

// API Configuration
const API_BASE_URL = 'http://localhost:8000';

function GameCollectionUI() {       
  const [tabs, setTabs] = useState([
    { id: 0, name: 'Tab 1' },
    { id: 1, name: 'Tab 2' },
    { id: 2, name: 'Tab 3' }
  ]);
  const [nextTabId, setNextTabId] = useState(3);
  const [activeTab, setActiveTab] = useState(0);
  const [editingTabId, setEditingTabId] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filterState, setFilterState] = useState('Complete');
  const [games, setGames] = useState(mockGameData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPnLModal, setShowPnLModal] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportStep, setExportStep] = useState('type');
  const [exportType, setExportType] = useState('');
  const [customOfferCOD, setCustomOfferCOD] = useState(60);
  const [offerCOD, setOfferCOD] = useState(55);
  const [showAddGameModal, setShowAddGameModal] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [shippingCosts, setShippingCosts] = useState({});
  const [expandedRows, setExpandedRows] = useState({});
  const [showImportModal, setShowImportModal] = useState(false);
  const [importModalType, setImportModalType] = useState(null); // 'files' | 'link' | null
  const [showImportMenu, setShowImportMenu] = useState(false);
  const [collectionLink, setCollectionLink] = useState('');
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isEditingCustomOffer, setIsEditingCustomOffer] = useState(false);
  const [customOfferInput, setCustomOfferInput] = useState('');
  const [autocompleteResults, setAutocompleteResults] = useState([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [activeTopMenu, setActiveTopMenu] = useState('calculator'); // 'calculator' | 'invoice' | 'tracker'
  const [perSkuSearchText, setPerSkuSearchText] = useState('');
  const [perSkuFilter, setPerSkuFilter] = useState('all'); // 'all' or specific condition

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

  const updateGameState = async (gameId, newState) => {
    setGames(games.map(game => 
      game.id === gameId ? { ...game, condition: newState } : game
    ));
  };

  const handleStateChange = (gameId, newState) => {
    updateGameState(gameId, newState);
  };

  const handleSort = (sortType) => {
    let sortedGames = [...games];
    switch(sortType) {
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

  const handleExportTypeSelect = (type) => {
    setExportType(type);
    setExportStep('format');
  };

  const handleExportFormat = (format) => {
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

  const searchForGames = async () => {
    if (!searchText.trim()) {
      alert('Please enter a game title to search');
      return;
    }
    const mockResults = [
      {
        id: Date.now(),
        title: searchText,
        platform: 'SNES',
        image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=80&h=80&fit=crop',
        condition: filterState,
        priceDetails: 'CIB:$100.00 L:$50.00 N:$200.00',
        value: 100.00
      }
    ];
    setSearchResults(mockResults);
    setShowAddGameModal(true);
  };

  const addGameToList = (game) => {
    if (games.find(g => g.id === game.id)) {
      alert('This game is already in your list');
      return;
    }
    setGames([...games, game]);
    setShowAddGameModal(false);
    setSearchText('');
    setSearchResults([]);
  };

  const updateShippingCost = (gameId, cost) => {
    setShippingCosts({
      ...shippingCosts,
      [gameId]: parseFloat(cost) || 0
    });
  };

  const processImportFile = (file) => {
    if (!file) return;
    if (file.name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        const lines = text.split('\n');
        // Process CSV data - implement based on your CSV format
        alert('CSV import functionality - implement based on your CSV format');
      };
      reader.readAsText(file);
    } else {
      alert('Please upload a CSV file');
    }
  };

  const handleImportFileInput = (e) => {
    const file = e.target.files?.[0];
    processImportFile(file);
    e.target.value = '';
    setShowImportModal(false);
    setImportModalType(null);
  };

  const handleImportFromLink = () => {
    if (!collectionLink.trim()) {
      alert('Please enter a collection link');
      return;
    }
    // Implement link-based import - e.g. fetch collection from URL
    alert(`Import from link: ${collectionLink}`);
    setCollectionLink('');
    setShowImportModal(false);
    setImportModalType(null);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer?.files?.[0];
    processImportFile(file);
    setShowImportModal(false);
    setImportModalType(null);
  };

  const handleFileDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(true);
  };

  const handleFileDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
  };

  const handleCustomOfferClick = () => {
    setCustomOfferInput(customOfferCOGS.toFixed(2));
    setIsEditingCustomOffer(true);
  };

  const handleCustomOfferChange = (e) => {
    setCustomOfferInput(e.target.value);
  };

  const handleCustomOfferBlur = () => {
    const newValue = parseFloat(customOfferInput);
    if (!isNaN(newValue) && newValue >= 0 && totalValue > 0) {
      // Calculate new COD based on entered value
      const newCOD = (newValue / totalValue) * 100;
      setCustomOfferCOD(newCOD);
    }
    setIsEditingCustomOffer(false);
  };

  const handleCustomOfferKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCustomOfferBlur();
    } else if (e.key === 'Escape') {
      setIsEditingCustomOffer(false);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchText(value);
    
    if (value.trim().length < 1) {
      setAutocompleteResults([]);
      setShowAutocomplete(false);
      return;
    }
    
    const query = value.trim().toLowerCase();
    const allGames = [...mockGameData, ...mockGameDatabase];
    const matches = allGames
      .filter(game => game.title.toLowerCase().includes(query))
      .slice(0, 5);
    
    setAutocompleteResults(matches);
    setShowAutocomplete(matches.length > 0);
  };

  const selectAutocompleteItem = (item) => {
    setSearchText(item.title);
    setShowAutocomplete(false);
    const gameWithCondition = { ...item, condition: filterState };
    addGameToList(gameWithCondition);
  };

  const toggleRowExpansion = (gameId) => {
    setExpandedRows({
      ...expandedRows,
      [gameId]: !expandedRows[gameId]
    });
  };

  const closeTab = (e, tabId) => {
    e.stopPropagation();
    const index = tabs.findIndex(t => t.id === tabId);
    if (index === -1 || tabs.length <= 1) return;
    const newTabs = tabs.filter(t => t.id !== tabId);
    setTabs(newTabs);
    if (activeTab === tabId) {
      const newActiveIndex = index > 0 ? index - 1 : 0;
      setActiveTab(newTabs[newActiveIndex]?.id ?? 0);
    }
  };

  const addTab = () => {
    const newTab = { id: nextTabId, name: `Tab ${nextTabId + 1}` };
    setNextTabId(nextTabId + 1);
    setTabs([...tabs, newTab]);
    setActiveTab(newTab.id);
  };

  const handleTabRename = (tabId, newName) => {
    const trimmed = (newName || '').trim();
    setTabs(tabs.map(t => t.id === tabId ? { ...t, name: trimmed || t.name } : t));
    setEditingTabId(null);
  };

  const isPerSkuView = activeTab === 'perSku';

  return (
    <div className="min-h-screen text-white p-4" style={{
      background: 'radial-gradient(ellipse at top, #000000 0%, #0d0d0d 50%, #1a1a1a 100%)'
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
      `}</style>

      {/* PnL Modal */}
      {showPnLModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => setShowPnLModal(false)}>
          <div className="bg-gray-900 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto animate-slideUp" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">P&L Analysis</h2>
              <button onClick={() => setShowPnLModal(false)} className="text-gray-400 hover:text-white text-2xl transition-colors">×</button>
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
                    <td className="text-center p-3">${pnlData.salePrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="text-center p-3">${pnlData.salePrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="text-center p-3"></td>
                  </tr>
                  <tr className="border-t border-gray-700 bg-gray-750">
                    <td className="p-3 font-semibold">COGS</td>
                    <td className="text-center p-3">${pnlData.customOffer.cogs.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="text-center p-3">${pnlData.offer.cogs.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="text-center p-3"></td>
                  </tr>
                  <tr className="border-t border-gray-700">
                    <td className="p-3 font-semibold">COD</td>
                    <td className="text-center p-3">
                      <input type="number" value={customOfferCOD} onChange={(e) => setCustomOfferCOD(parseFloat(e.target.value) || 0)} className="w-20 bg-gray-700 text-white text-center rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-600" min="0" max="100" />%
                    </td>
                    <td className="text-center p-3">
                      <input type="number" value={offerCOD} onChange={(e) => setOfferCOD(parseFloat(e.target.value) || 0)} className="w-20 bg-gray-700 text-white text-center rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-600" min="0" max="100" />%
                    </td>
                    <td className="text-center p-3"></td>
                  </tr>
                  <tr className="border-t border-gray-700 bg-gray-750">
                    <td className="p-3 font-semibold">Platform Fees</td>
                    <td className="text-center p-3">${pnlData.customOffer.platformFees.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="text-center p-3">${pnlData.offer.platformFees.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="text-center p-3"></td>
                  </tr>
                  <tr className="border-t border-gray-700 bg-green-900 bg-opacity-30">
                    <td className="p-3 font-bold text-green-400">Profit</td>
                    <td className="text-center p-3 font-bold text-green-400">${pnlData.customOffer.profit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="text-center p-3 font-bold text-green-400">${pnlData.offer.profit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="text-center p-3 font-bold text-green-400">${pnlData.variance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
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
              <button onClick={() => setShowPnLModal(false)} className="px-6 py-2 bg-green-600 text-black font-semibold rounded hover:bg-green-700 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Game Modal */}
      {showAddGameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => setShowAddGameModal(false)}>
          <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-auto animate-slideUp" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Add Game to Collection</h2>
              <button onClick={() => setShowAddGameModal(false)} className="text-gray-400 hover:text-white text-2xl transition-colors">×</button>
            </div>
            {searchResults.length === 0 ? (
              <p className="text-gray-400">No games found.</p>
            ) : (
              <div className="space-y-3">
                {searchResults.map((game) => (
                  <div key={game.id} className="bg-gray-800 rounded-lg p-4 flex items-center gap-4 hover:bg-gray-700 transition-colors">
                    <img src={game.image} alt={game.title} className="w-20 h-20 rounded object-cover" />
                    <div className="flex-1">
                      <div className="font-semibold text-lg">{game.title} <span className="text-gray-500">{game.platform}</span></div>
                      <div className="text-sm text-gray-400 mt-1">{game.priceDetails}</div>
                      <div className="text-green-400 font-semibold mt-1">${game.value.toFixed(2)}</div>
                    </div>
                    <button onClick={() => addGameToList(game)} className="px-4 py-2 bg-green-600 text-black font-semibold rounded hover:bg-green-700 transition-colors">Add to List</button>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-6 flex justify-end">
              <button onClick={() => setShowAddGameModal(false)} className="px-6 py-2 bg-gray-700 text-white font-semibold rounded hover:bg-gray-600 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && importModalType && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => { setShowImportModal(false); setImportModalType(null); setCollectionLink(''); setIsDraggingFile(false); }}>
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full animate-slideUp" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Import Games</h2>
              <button onClick={() => { setShowImportModal(false); setImportModalType(null); setCollectionLink(''); }} className="text-gray-400 hover:text-white text-2xl transition-colors">×</button>
            </div>
            {importModalType === 'files' ? (
              <div
                onDragOver={handleFileDragOver}
                onDragLeave={handleFileDragLeave}
                onDrop={handleFileDrop}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${isDraggingFile ? 'border-green-600 bg-green-900/20' : 'border-gray-600 hover:border-gray-500'}`}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportFileInput}
                  id="import-file-input"
                  className="hidden"
                />
                <label htmlFor="import-file-input" className="cursor-pointer block">
                  <div className="text-gray-400 mb-2">
                    {isDraggingFile ? 'Drop your CSV file here' : 'Drag and drop your CSV file here'}
                  </div>
                  <div className="text-sm text-gray-500 mb-4">or click to browse</div>
                  <span className="inline-block px-6 py-2 bg-green-600 text-black font-semibold rounded hover:bg-green-700 transition-colors">Select File</span>
                </label>
              </div>
            ) : (
              <div>
                <p className="text-gray-400 mb-4">Paste a collection link to import games.</p>
                <input
                  type="url"
                  value={collectionLink}
                  onChange={(e) => setCollectionLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-600 placeholder-gray-500"
                />
                <div className="mt-6 flex justify-end gap-2">
                  <button onClick={() => { setShowImportModal(false); setImportModalType(null); setCollectionLink(''); }} className="px-6 py-2 bg-gray-700 text-white font-semibold rounded hover:bg-gray-600 transition-colors">Cancel</button>
                  <button onClick={handleImportFromLink} className="px-6 py-2 bg-green-600 text-black font-semibold rounded hover:bg-green-700 transition-colors">Import</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Menu */}
      <div className="flex items-center gap-0 pb-2 mb-3 border-b border-gray-700">
        <button
          onClick={() => setActiveTopMenu('calculator')}
          className={`px-4 py-1 text-sm font-medium transition-colors ${activeTopMenu === 'calculator' ? 'text-green-400' : 'text-gray-400 hover:text-white'}`}
        >
          Calculator
        </button>
        <div className="w-px h-4 bg-gray-600" />
        <button
          onClick={() => setActiveTopMenu('invoice')}
          className={`px-4 py-1 text-sm font-medium transition-colors ${activeTopMenu === 'invoice' ? 'text-green-400' : 'text-gray-400 hover:text-white'}`}
        >
          Invoice
        </button>
        <div className="w-px h-4 bg-gray-600" />
        <button
          onClick={() => setActiveTopMenu('tracker')}
          className={`px-4 py-1 text-sm font-medium transition-colors ${activeTopMenu === 'tracker' ? 'text-green-400' : 'text-gray-400 hover:text-white'}`}
        >
          Tracker
        </button>
      </div>

      {/* Calculator view - tabs and main content */}
      {activeTopMenu === 'calculator' && (
      <>
      {/* Tabs */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              onDoubleClick={() => setEditingTabId(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded font-semibold transition-colors shrink-0 cursor-pointer group ${activeTab === tab.id ? 'bg-green-600 text-black' : 'bg-green-700 text-black hover:bg-green-600'}`}
            >
              {editingTabId === tab.id ? (
                <input
                  type="text"
                  defaultValue={tab.name}
                  onBlur={(e) => { handleTabRename(tab.id, e.target.value.trim()); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.target.blur(); } e.stopPropagation(); }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-black/30 text-inherit font-semibold rounded px-1 py-0.5 min-w-[60px] max-w-[120px] focus:outline-none focus:ring-1 focus:ring-white"
                  autoFocus
                />
              ) : (
                <span className="truncate max-w-[100px]">{tab.name}</span>
              )}
              {tabs.length > 1 && (
                <button
                  onClick={(e) => closeTab(e, tab.id)}
                  className="p-0.5 -m-0.5 border-none outline-none rounded-sm opacity-60 hover:opacity-100 hover:bg-black/10 transition-all"
                  title="Close tab"
                >
                  <X size={12} strokeWidth={2} />
                </button>
              )}
            </div>
          ))}
          <button onClick={addTab} className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors shrink-0" title="Add tab">
            <Plus size={18} />
          </button>
        </div>
        <button
          onClick={() => setActiveTab('perSku')}
          className={`px-6 py-2 rounded font-semibold transition-colors shrink-0 ${activeTab === 'perSku' ? 'bg-green-600 text-black' : 'bg-green-700 text-black hover:bg-green-600'}`}
        >
          Per SKU Count
        </button>
      </div>

      {/* Main Content */}
      {isPerSkuView ? (
        (() => {
          const perSkuFilteredGames = games.filter((game) => {
            const matchesSearch = !perSkuSearchText.trim() || game.title.toLowerCase().includes(perSkuSearchText.trim().toLowerCase()) || game.platform.toLowerCase().includes(perSkuSearchText.trim().toLowerCase());
            const matchesFilter = perSkuFilter === 'all' || game.condition === perSkuFilter;
            return matchesSearch && matchesFilter;
          });
          const count = perSkuFilteredGames.length;
          const avgValue = count > 0 ? perSkuFilteredGames.reduce((s, g) => s + g.value, 0) / count : 0;
          const avgShipping = count > 0 ? perSkuFilteredGames.reduce((s, g) => s + (shippingCosts[g.id] || 0), 0) / count : 0;
          const avgProfit = count > 0 ? perSkuFilteredGames.reduce((s, g) => {
            const fullPrice = g.value;
            const buyPrice = fullPrice * (customOfferCOD / 100);
            const platformFee = fullPrice * 0.137;
            const sc = shippingCosts[g.id] || 0;
            return s + (fullPrice - platformFee - buyPrice - sc);
          }, 0) / count : 0;
          return (
        <div>
          <h2 className="text-2xl font-bold mb-6">Per SKU Count - Profit Analysis</h2>
          <div className="mb-6 overflow-hidden rounded-lg" style={{ backgroundColor: '#2a2a2a', border: '1px solid #404040' }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-black/50">
                  <th className="text-left p-3 font-semibold text-gray-400 border-r border-gray-700">Average Value</th>
                  <th className="text-left p-3 font-semibold text-gray-400 border-r border-gray-700">Average Shipping Cost</th>
                  <th className="text-left p-3 font-semibold text-gray-400">Average Profit</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3 font-semibold border-r border-gray-700">${avgValue.toFixed(2)}</td>
                  <td className="p-3 font-semibold border-r border-gray-700">${avgShipping.toFixed(2)}</td>
                  <td className="p-3 font-semibold text-green-400">${avgProfit.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mb-6">
            <div className="text-gray-500 mb-2 text-sm">Search</div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search games..."
                value={perSkuSearchText}
                onChange={(e) => setPerSkuSearchText(e.target.value)}
                className="flex-1 px-4 py-2 bg-gray-700 rounded border-none focus:outline-none focus:ring-2 focus:ring-green-600 placeholder-gray-500"
              />
              <select
                value={perSkuFilter}
                onChange={(e) => setPerSkuFilter(e.target.value)}
                className="px-4 py-2 bg-gray-700 rounded border-none focus:outline-none focus:ring-2 focus:ring-green-600 cursor-pointer"
              >
                <option value="all">All Conditions</option>
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
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {perSkuFilteredGames.map((game) => {
              const fullPrice = game.value;
              const buyPrice = fullPrice * (customOfferCOD / 100);
              const platformFee = fullPrice * 0.137;
              const shippingCost = shippingCosts[game.id] || 0;
              const profitDollars = fullPrice - platformFee - buyPrice - shippingCost;
              const profitPercent = buyPrice > 0 ? ((profitDollars / buyPrice) * 100).toFixed(1) : 0;
              
              return (
                <div key={game.id} className="rounded-lg p-4 transition-all" style={{ backgroundColor: '#2a2a2a', border: '1px solid #404040' }}>
                  <div className="flex items-start gap-3 mb-3">
                    <img src={game.image} alt={game.title} className="w-20 h-20 rounded object-cover" />
                    <div className="flex-1">
                      <div className="font-semibold text-lg">{game.title}</div>
                      <div className="text-sm text-gray-400">{game.platform} - {game.condition}</div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Full Price:</span>
                      <span className="font-semibold text-white">${fullPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Our Buy Price:</span>
                      <span className="font-semibold text-orange-400">${buyPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Platform Fees:</span>
                      <span className="font-semibold text-red-400">-${platformFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Shipping Cost:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">$</span>
                        <input type="number" value={shippingCosts[game.id] || ''} onChange={(e) => updateShippingCost(game.id, e.target.value)} placeholder="0.00" className="w-20 bg-gray-700 text-white text-right rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm" step="0.01" min="0" />
                      </div>
                    </div>
                    <div className="border-t border-gray-600 pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 font-semibold">Our Profit:</span>
                        <div className="text-right">
                          <div className="font-bold text-green-400 text-lg">${profitDollars.toFixed(2)}</div>
                          <div className="text-green-400 text-xs">{profitPercent}% margin</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
          );
        })()
      ) : (
        <>
          <div className="mb-6">
            <div className="text-gray-500 mb-2 text-sm">Search</div>
            <div className="flex gap-2 mb-2 relative">
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  placeholder="Type video game title..." 
                  value={searchText} 
                  onChange={handleSearchChange}
                  onFocus={() => searchText.length >= 1 && autocompleteResults.length > 0 && setShowAutocomplete(true)}
                  onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
                  className="w-full px-4 py-2 bg-gray-700 rounded border-none focus:outline-none focus:ring-2 focus:ring-green-600" 
                />
                
                {/* Autocomplete Dropdown */}
                {showAutocomplete && autocompleteResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                    {autocompleteResults.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => selectAutocompleteItem(item)}
                        className="px-4 py-3 hover:bg-gray-700 cursor-pointer transition-colors border-b border-gray-700 last:border-b-0"
                      >
                        <div className="font-semibold">{item.title}</div>
                        <div className="text-sm text-gray-400 flex justify-between mt-1">
                          <span>{item.platform}</span>
                          <span className="text-green-400">${item.value.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <select value={filterState} onChange={(e) => setFilterState(e.target.value)} className="px-4 py-2 bg-green-600 text-black font-semibold rounded border-none focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer">
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
              <button onClick={searchForGames} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-black font-semibold rounded hover:bg-green-700 transition-colors">
                <Plus size={16} /> Add Game
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-black font-semibold rounded hover:bg-green-700 transition-colors">
                <Filter size={16} /> Filter ...
              </button>
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <div className="flex-1 rounded-lg overflow-hidden" style={{ backgroundColor: '#2a2a2a' }}>
              <table className="w-full">
                <thead>
                  <tr className="bg-black">
                    <th className="text-left p-4 font-semibold">Title</th>
                    <th className="text-left p-4 font-semibold">State</th>
                    <th className="text-left p-4 font-semibold">Value</th>
                    <th className="text-left p-4 font-semibold w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {games.map((game) => {
                    const isExpanded = expandedRows[game.id];
                    const fullPrice = game.value;
                    const buyPrice = fullPrice * (customOfferCOD / 100);
                    const platformFee = fullPrice * 0.137;
                    const shippingCost = shippingCosts[game.id] || 0;
                    const profitDollars = fullPrice - platformFee - buyPrice - shippingCost;
                    const profitPercent = buyPrice > 0 ? ((profitDollars / buyPrice) * 100).toFixed(1) : 0;
                    
                    return (
                      <React.Fragment key={game.id}>
                        <tr className="border-t transition-colors cursor-pointer" style={{ borderColor: '#404040' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#383838'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'} onClick={() => toggleRowExpansion(game.id)}>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img src={game.image} alt={game.title} className="w-16 h-16 rounded object-cover" />
                              <div>
                                <div className="font-semibold">{game.title} <span className="text-gray-500">{game.platform}</span></div>
                                <div className="text-xs text-gray-500 mt-1">{game.priceDetails}</div>
                              </div>
                              <button className="ml-auto text-gray-400 hover:text-white">{isExpanded ? '▼' : '▶'}</button>
                            </div>
                          </td>
                          <td className="p-4" onClick={(e) => e.stopPropagation()}>
                            <select value={game.condition} onChange={(e) => handleStateChange(game.id, e.target.value)} className="px-4 py-2 bg-green-600 text-black font-semibold rounded border-none focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer">
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
                          <td className="p-4 font-semibold text-lg">${game.value.toFixed(2)}</td>
                        </tr>
                        {isExpanded && (
                          <tr style={{ backgroundColor: '#1f1f1f', borderColor: '#404040' }}>
                            <td colSpan="3" className="p-4">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <div className="text-gray-400 mb-1">Full Price</div>
                                  <div className="font-semibold text-white text-lg">${fullPrice.toFixed(2)}</div>
                                </div>
                                <div>
                                  <div className="text-gray-400 mb-1">Buy Price ({customOfferCOD}%)</div>
                                  <div className="font-semibold text-orange-400 text-lg">${buyPrice.toFixed(2)}</div>
                                </div>
                                <div>
                                  <div className="text-gray-400 mb-1">Platform Fees</div>
                                  <div className="font-semibold text-red-400 text-lg">-${platformFee.toFixed(2)}</div>
                                </div>
                                <div>
                                  <div className="text-gray-400 mb-1">Shipping</div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-gray-500">$</span>
                                    <input type="number" value={shippingCosts[game.id] || ''} onChange={(e) => updateShippingCost(game.id, e.target.value)} onClick={(e) => e.stopPropagation()} placeholder="0.00" className="w-24 bg-gray-700 text-white text-right rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-600" step="0.01" min="0" />
                                  </div>
                                </div>
                              </div>
                              <div className="mt-4 pt-4 border-t border-gray-600">
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-400 font-semibold">Our Profit:</span>
                                  <div className="text-right">
                                    <div className="font-bold text-green-400 text-2xl">${profitDollars.toFixed(2)}</div>
                                    <div className="text-green-400 text-sm">{profitPercent}% margin</div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-2 relative">
              <button onClick={() => setShowSortMenu(!showSortMenu)} className="px-6 py-2 bg-green-600 text-black font-semibold rounded hover:bg-green-700 transition-colors whitespace-nowrap">Sort</button>
              {showSortMenu && (
                <div className="absolute top-12 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 min-w-[160px]">
                  <button onClick={() => handleSort('a-z')} className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors rounded-t-lg">A to Z</button>
                  <button onClick={() => handleSort('z-a')} className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors border-t border-gray-700">Z to A</button>
                  <button onClick={() => handleSort('high-low')} className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors border-t border-gray-700">High to Low</button>
                  <button onClick={() => handleSort('low-high')} className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors border-t border-gray-700 rounded-b-lg">Low to High</button>
                </div>
              )}
              <div className="relative">
                <button onClick={() => setShowImportMenu(!showImportMenu)} className="px-6 py-2 bg-green-600 text-black font-semibold rounded hover:bg-green-700 transition-colors whitespace-nowrap">Import</button>
                {showImportMenu && (
                  <div className="absolute top-12 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 min-w-[160px]">
                    <button onClick={() => { setShowImportMenu(false); setImportModalType('files'); setShowImportModal(true); }} className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors rounded-t-lg">From Files</button>
                    <button onClick={() => { setShowImportMenu(false); setImportModalType('link'); setShowImportModal(true); }} className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors border-t border-gray-700 rounded-b-lg">From Link</button>
                  </div>
                )}
              </div>
              <div className="flex-1"></div>
              <button className="px-6 py-2 bg-green-600 text-black font-semibold rounded hover:bg-green-700 transition-colors whitespace-nowrap">Sort</button>
              <button onClick={handleExportMenuToggle} className="px-6 py-2 bg-green-600 text-black font-semibold rounded hover:bg-green-700 transition-colors whitespace-nowrap">Export</button>
              {showExportMenu && (
                <div className="absolute bottom-12 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 min-w-[180px]">
                  {exportStep === 'type' ? (
                    <>
                      <button onClick={() => handleExportTypeSelect('all')} className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors rounded-t-lg">Export All</button>
                      <button onClick={() => handleExportTypeSelect('selection')} className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors border-t border-gray-700 rounded-b-lg">Export Selection</button>
                    </>
                  ) : (
                    <>
                      <div className="px-4 py-2 text-sm text-gray-400 border-b border-gray-700">Select Format</div>
                      <button onClick={() => handleExportFormat('png')} className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors">PNG</button>
                      <button onClick={() => handleExportFormat('pdf')} className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors border-t border-gray-700">PDF</button>
                      <button onClick={() => handleExportFormat('csv')} className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors border-t border-gray-700">CSV</button>
                      <button onClick={() => handleExportFormat('xlsx')} className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors border-t border-gray-700 rounded-b-lg">XLSX</button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {!isPerSkuView && (
        <div className="flex gap-4 justify-center">
          <div 
            className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center min-w-[180px] cursor-pointer hover:bg-gray-700 transition-colors"
            onClick={handleCustomOfferClick}
          >
            <div className="text-sm mb-2">Custom Offer</div>
            {isEditingCustomOffer ? (
              <input
                type="number"
                value={customOfferInput}
                onChange={handleCustomOfferChange}
                onBlur={handleCustomOfferBlur}
                onKeyDown={handleCustomOfferKeyDown}
                autoFocus
                step="0.01"
                min="0"
                className="text-2xl font-semibold bg-gray-600 text-white text-center w-full rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            ) : (
              <div className="text-2xl font-semibold">${customOfferCOGS.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            )}
          </div>
          <div onClick={() => setShowPnLModal(true)} className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center min-w-[180px] cursor-pointer hover:bg-gray-700 transition-colors">
            <div className="text-sm mb-2">Offer</div>
            <div className="text-2xl font-semibold">${offerCOGS.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center min-w-[180px]">
            <div className="text-sm mb-2">Total</div>
            <div className="text-2xl font-semibold">${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
        </div>
      )}
      </>
      )}

      {activeTopMenu === 'invoice' && (
        <div className="text-gray-400 py-12 text-center">Invoice — coming soon</div>
      )}

      {activeTopMenu === 'tracker' && (
        <div className="text-gray-400 py-12 text-center">Tracker — coming soon</div>
      )}
    </div>
  );
}

export default GameCollectionUI;
