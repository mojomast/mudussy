function RoomEditModal({ room, isOpen, onClose, onSave, user }) {
    const [editData, setEditData] = useState({
        name: room?.name || '',
        description: room?.description || '',
        exits: { ...room?.exits } || {}
    });
    const [newExitDirection, setNewExitDirection] = useState('');
    const [newExitRoomId, setNewExitRoomId] = useState('');
    const [saving, setSaving] = useState(false);
    if (!isOpen || !room)
        return null;
    const handleSave = async () => {
        setSaving(true);
        try {
            const result = await onSave(room.id, editData);
            if (result.success) {
                onClose();
            }
            else {
                alert(result.message || 'Failed to save room');
            }
        }
        catch (error) {
            alert('Network error while saving');
        }
        finally {
            setSaving(false);
        }
    };
    const addExit = () => {
        if (newExitDirection && newExitRoomId) {
            setEditData({
                ...editData,
                exits: {
                    ...editData.exits,
                    [newExitDirection]: newExitRoomId
                }
            });
            setNewExitDirection('');
            setNewExitRoomId('');
        }
    };
    const removeExit = (direction) => {
        const newExits = { ...editData.exits };
        delete newExits[direction];
        setEditData({ ...editData, exits: newExits });
    };
    return (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-mud-dark border-2 border-mud-green p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-mud-green">Edit Room: {room.name}</h3>
                    <button onClick={onClose} className="text-mud-light hover:text-mud-green">✕</button>
                </div>

                <div className="space-y-4">
                    
                    <div>
                        <label className="block text-sm font-medium text-mud-green mb-1">Room Name</label>
                        <input type="text" value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className="w-full px-3 py-2 bg-mud-black border border-mud-green text-mud-green rounded focus:outline-none focus:border-mud-light" disabled={user.role !== 'admin'}/>
                    </div>

                    
                    <div>
                        <label className="block text-sm font-medium text-mud-green mb-1">Description</label>
                        <textarea value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} rows="3" className="w-full px-3 py-2 bg-mud-black border border-mud-green text-mud-green rounded focus:outline-none focus:border-mud-light resize-none" disabled={user.role !== 'admin'}/>
                    </div>

                    
                    <div>
                        <h4 className="text-mud-green font-bold mb-2">Exits</h4>
                        <div className="space-y-2">
                            {Object.entries(editData.exits).map(([direction, destination]) => (<div key={direction} className="flex justify-between items-center bg-mud-black border border-mud-green p-2 rounded">
                                    <span className="text-mud-green capitalize">{direction} → {destination}</span>
                                    {user.role === 'admin' && (<button onClick={() => removeExit(direction)} className="bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded text-sm">
                                            Remove
                                        </button>)}
                                </div>))}
                        </div>

                        
                        {user.role === 'admin' && (<div className="flex space-x-2 mt-2">
                                <input type="text" placeholder="Direction (e.g., north)" value={newExitDirection} onChange={(e) => setNewExitDirection(e.target.value)} className="flex-1 px-3 py-2 bg-mud-black border border-mud-green text-mud-green rounded focus:outline-none focus:border-mud-light"/>
                                <input type="text" placeholder="Room ID" value={newExitRoomId} onChange={(e) => setNewExitRoomId(e.target.value)} className="flex-1 px-3 py-2 bg-mud-black border border-mud-green text-mud-green rounded focus:outline-none focus:border-mud-light"/>
                                <button onClick={addExit} className="bg-mud-green text-mud-black px-4 py-2 rounded font-bold hover:bg-mud-light">
                                    Add
                                </button>
                            </div>)}
                    </div>

                    
                    <div className="flex justify-end space-x-2 pt-4">
                        <button onClick={onClose} className="px-4 py-2 bg-mud-dark border border-mud-green text-mud-green rounded hover:bg-gray-700">
                            Cancel
                        </button>
                        {user.role === 'admin' && (<button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-mud-green text-mud-black rounded font-bold hover:bg-mud-light disabled:opacity-50">
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>)}
                    </div>
                </div>
            </div>
        </div>);
}
function EntityManagementModal({ room, isOpen, onClose, onAction, user }) {
    const [selectedEntityType, setSelectedEntityType] = useState('npc');
    const [selectedEntityId, setSelectedEntityId] = useState('');
    const [targetRoomId, setTargetRoomId] = useState('');
    if (!isOpen || !room)
        return null;
    const handleAction = async (action) => {
        if (!selectedEntityId) {
            alert('Please select an entity');
            return;
        }
        if (action === 'move' && !targetRoomId) {
            alert('Please enter target room ID');
            return;
        }
        const result = await onAction(action, selectedEntityType, selectedEntityId, targetRoomId);
        if (result.success) {
            onClose();
        }
        else {
            alert(result.message || `Failed to ${action} entity`);
        }
    };
    return (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-mud-dark border-2 border-mud-green p-6 rounded-lg max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-mud-green">Manage Entities: {room.name}</h3>
                    <button onClick={onClose} className="text-mud-light hover:text-mud-green">✕</button>
                </div>

                <div className="space-y-4">
                    
                    <div>
                        <label className="block text-sm font-medium text-mud-green mb-1">Entity Type</label>
                        <select value={selectedEntityType} onChange={(e) => setSelectedEntityType(e.target.value)} className="w-full px-3 py-2 bg-mud-black border border-mud-green text-mud-green rounded focus:outline-none focus:border-mud-light">
                            <option value="npc">NPC</option>
                            <option value="item">Item</option>
                        </select>
                    </div>

                    
                    <div>
                        <label className="block text-sm font-medium text-mud-green mb-1">
                            {selectedEntityType === 'npc' ? 'NPC ID' : 'Item ID'}
                        </label>
                        <input type="text" value={selectedEntityId} onChange={(e) => setSelectedEntityId(e.target.value)} placeholder={`Enter ${selectedEntityType} ID`} className="w-full px-3 py-2 bg-mud-black border border-mud-green text-mud-green rounded focus:outline-none focus:border-mud-light"/>
                    </div>

                    
                    <div>
                        <label className="block text-sm font-medium text-mud-green mb-1">Target Room ID (for move)</label>
                        <input type="text" value={targetRoomId} onChange={(e) => setTargetRoomId(e.target.value)} placeholder="Room ID to move entity to" className="w-full px-3 py-2 bg-mud-black border border-mud-green text-mud-green rounded focus:outline-none focus:border-mud-light"/>
                    </div>

                    
                    {user.role === 'admin' && (<div className="flex flex-wrap gap-2 pt-4">
                            <button onClick={() => handleAction('spawn')} className="flex-1 bg-green-600 text-white px-3 py-2 rounded font-bold hover:bg-green-500">
                                Spawn Entity
                            </button>
                            <button onClick={() => handleAction('move')} className="flex-1 bg-blue-600 text-white px-3 py-2 rounded font-bold hover:bg-blue-500">
                                Move Entity
                            </button>
                            <button onClick={() => handleAction('despawn')} className="flex-1 bg-red-600 text-white px-3 py-2 rounded font-bold hover:bg-red-500">
                                Despawn Entity
                            </button>
                        </div>)}

                    <div className="flex justify-end pt-2">
                        <button onClick={onClose} className="px-4 py-2 bg-mud-dark border border-mud-green text-mud-green rounded hover:bg-gray-700">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>);
}
function WorldMap({ rooms, selectedRoom, onRoomSelect, connections, onRoomEdit, onEntityManage, user }) {
    const [viewMode, setViewMode] = useState('grid');
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const bounds = rooms.reduce((acc, room) => {
        if (room.coordinates) {
            return {
                minX: Math.min(acc.minX, room.coordinates.x),
                maxX: Math.max(acc.maxX, room.coordinates.x),
                minY: Math.min(acc.minY, room.coordinates.y),
                maxY: Math.max(acc.maxY, room.coordinates.y)
            };
        }
        return acc;
    }, { minX: 0, maxX: 0, minY: 0, maxY: 0 });
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    const getRoomPosition = (room) => {
        if (!room.coordinates)
            return { x: 0, y: 0 };
        if (viewMode === 'grid') {
            return {
                x: (room.coordinates.x - centerX) * 120 * zoom + pan.x + 400,
                y: (room.coordinates.y - centerY) * 120 * zoom + pan.y + 300
            };
        }
        return { x: 0, y: 0 };
    };
    const renderConnections = () => {
        if (!connections)
            return null;
        return connections.map((connection, index) => {
            const fromRoom = rooms.find(r => r.id === connection.from);
            const toRoom = rooms.find(r => r.id === connection.to);
            if (!fromRoom || !toRoom || !fromRoom.coordinates || !toRoom.coordinates)
                return null;
            const fromPos = getRoomPosition(fromRoom);
            const toPos = getRoomPosition(toRoom);
            return (<line key={index} x1={fromPos.x + 60} y1={fromPos.y + 40} x2={toPos.x + 60} y2={toPos.y + 40} stroke="#4ade80" strokeWidth="2" opacity="0.6"/>);
        });
    };
    const renderRoom = (room) => {
        const position = getRoomPosition(room);
        const isSelected = selectedRoom && selectedRoom.id === room.id;
        return (<g key={room.id}>
                <rect x={position.x} y={position.y} width="120" height="80" fill={isSelected ? "#4ade80" : "#1f2937"} stroke={isSelected ? "#22c55e" : "#4ade80"} strokeWidth={isSelected ? "3" : "2"} rx="8" className="cursor-pointer hover:fill-gray-600 transition-colors" onClick={() => onRoomSelect(room)}/>

                
                {user.role === 'admin' && isSelected && (<g>
                        <circle cx={position.x + 100} cy={position.y + 15} r="8" fill="#22c55e" className="cursor-pointer hover:fill-mud-light" onClick={(e) => {
                    e.stopPropagation();
                    onRoomEdit && onRoomEdit(room);
                }}/>
                        <text x={position.x + 100} y={position.y + 19} textAnchor="middle" fill="#1f2937" fontSize="10" fontWeight="bold" className="pointer-events-none">
                            ✏️
                        </text>
                    </g>)}

                
                {user.role === 'admin' && isSelected && (<g>
                        <circle cx={position.x + 100} cy={position.y + 35} r="8" fill="#3b82f6" className="cursor-pointer hover:fill-blue-300" onClick={(e) => {
                    e.stopPropagation();
                    onEntityManage && onEntityManage(room);
                }}/>
                        <text x={position.x + 100} y={position.y + 39} textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold" className="pointer-events-none">
                            ⚙️
                        </text>
                    </g>)}

                <text x={position.x + 60} y={position.y + 20} textAnchor="middle" fill="#e5e7eb" fontSize="12" fontWeight="bold" className="pointer-events-none">
                    {room.name}
                </text>
                <text x={position.x + 60} y={position.y + 35} textAnchor="middle" fill="#9ca3af" fontSize="10" className="pointer-events-none">
                    NPCs: {room.npcs?.length || 0}
                </text>
                <text x={position.x + 60} y={position.y + 50} textAnchor="middle" fill="#9ca3af" fontSize="10" className="pointer-events-none">
                    Items: {room.items?.length || 0}
                </text>
                <text x={position.x + 60} y={position.y + 65} textAnchor="middle" fill="#fbbf24" fontSize="10" className="pointer-events-none">
                    Players: {room.players?.length || 0}
                </text>
            </g>);
    };
    return (<div className="bg-mud-black border-2 border-mud-green rounded-lg p-4">
            
            <div className="flex justify-between items-center mb-4">
                <div className="flex space-x-2">
                    <button onClick={() => setViewMode('grid')} className={`px-3 py-1 rounded text-sm font-bold ${viewMode === 'grid'
            ? 'bg-mud-green text-mud-black'
            : 'bg-mud-dark text-mud-green border border-mud-green'}`}>
                        Grid View
                    </button>
                    <button onClick={() => setViewMode('tree')} className={`px-3 py-1 rounded text-sm font-bold ${viewMode === 'tree'
            ? 'bg-mud-green text-mud-black'
            : 'bg-mud-dark text-mud-green border border-mud-green'}`}>
                        Tree View
                    </button>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-mud-green text-sm">Zoom:</span>
                    <button onClick={() => setZoom(Math.max(0.5, zoom - 0.1))} className="px-2 py-1 bg-mud-dark border border-mud-green text-mud-green rounded text-sm">
                        -
                    </button>
                    <span className="text-mud-light text-sm w-12 text-center">
                        {Math.round(zoom * 100)}%
                    </span>
                    <button onClick={() => setZoom(Math.min(2, zoom + 0.1))} className="px-2 py-1 bg-mud-dark border border-mud-green text-mud-green rounded text-sm">
                        +
                    </button>
                </div>
            </div>

            
            <div className="relative bg-mud-dark border border-mud-green rounded overflow-hidden" style={{ height: '600px' }}>
                <svg width="100%" height="100%" className="absolute inset-0">
                    
                    {renderConnections()}

                    
                    {rooms.map(renderRoom)}
                </svg>

                
                <div className="absolute top-2 right-2 bg-mud-black border border-mud-green rounded p-2 text-xs">
                    <div className="flex items-center space-x-2 mb-1">
                        <div className="w-3 h-3 bg-blue-500 rounded"></div>
                        <span className="text-mud-light">NPCs</span>
                    </div>
                    <div className="flex items-center space-x-2 mb-1">
                        <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                        <span className="text-mud-light">Items</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded"></div>
                        <span className="text-mud-light">Players</span>
                    </div>
                </div>
            </div>
        </div>);
}
function RoomDetailPanel({ room, npcs, items, onClose }) {
    if (!room)
        return null;
    const roomNpcs = npcs?.filter(npc => npc.location === room.id) || [];
    const roomItems = items?.filter(item => room.items?.includes(item.id)) || [];
    return (<div className="bg-mud-dark border-2 border-mud-green rounded-lg p-4 max-w-md">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-mud-green">{room.name}</h3>
                <button onClick={onClose} className="text-mud-light hover:text-mud-green">
                    ✕
                </button>
            </div>

            <div className="space-y-4">
                <div>
                    <h4 className="text-mud-green font-bold mb-2">Description</h4>
                    <p className="text-mud-light text-sm">{room.description}</p>
                </div>

                <div>
                    <h4 className="text-mud-green font-bold mb-2">Exits</h4>
                    <div className="grid grid-cols-2 gap-2">
                        {Object.entries(room.exits || {}).map(([direction, destination]) => (<div key={direction} className="bg-mud-black border border-mud-green p-2 rounded text-sm">
                                <span className="text-mud-green font-bold capitalize">{direction}:</span>
                                <span className="text-mud-light ml-1">{destination}</span>
                            </div>))}
                    </div>
                </div>

                <div>
                    <h4 className="text-mud-green font-bold mb-2">NPCs ({roomNpcs.length})</h4>
                    <div className="space-y-2">
                        {roomNpcs.map(npc => (<div key={npc.id} className="bg-mud-black border border-mud-green p-2 rounded">
                                <div className="text-mud-green font-bold">{npc.name}</div>
                                <div className="text-mud-light text-sm">{npc.description}</div>
                                <div className="flex justify-between text-xs mt-1">
                                    <span className="text-mud-light">Level: {npc.stats.level}</span>
                                    <span className={`capitalize ${npc.stats.aggression === 'friendly' ? 'text-green-400' :
                npc.stats.aggression === 'hostile' ? 'text-red-400' :
                    'text-yellow-400'}`}>
                                        {npc.stats.aggression}
                                    </span>
                                </div>
                            </div>))}
                        {roomNpcs.length === 0 && (<p className="text-mud-light text-sm">No NPCs in this room</p>)}
                    </div>
                </div>

                <div>
                    <h4 className="text-mud-green font-bold mb-2">Items ({roomItems.length})</h4>
                    <div className="space-y-2">
                        {roomItems.map(item => (<div key={item.id} className="bg-mud-black border border-mud-green p-2 rounded">
                                <div className="text-mud-green font-bold">{item.name}</div>
                                <div className="text-mud-light text-sm">{item.description}</div>
                            </div>))}
                        {roomItems.length === 0 && (<p className="text-mud-light text-sm">No items in this room</p>)}
                    </div>
                </div>

                <div>
                    <h4 className="text-mud-green font-bold mb-2">Players ({room.players?.length || 0})</h4>
                    <div className="space-y-2">
                        {room.players?.map(player => (<div key={player} className="bg-mud-black border border-mud-green p-2 rounded">
                                <div className="text-green-400 font-bold">{player}</div>
                                <div className="text-mud-light text-sm">Online</div>
                            </div>))}
                        {(!room.players || room.players.length === 0) && (<p className="text-mud-light text-sm">No players in this room</p>)}
                    </div>
                </div>
            </div>
        </div>);
}
function SearchAndFilter({ onSearch, onFilter }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        hasNpcs: false,
        hasItems: false,
        hasPlayers: false,
        sector: 'all'
    });
    const handleSearchChange = (e) => {
        const term = e.target.value;
        setSearchTerm(term);
        onSearch(term);
    };
    const handleFilterChange = (filterName, value) => {
        const newFilters = { ...filters, [filterName]: value };
        setFilters(newFilters);
        onFilter(newFilters);
    };
    return (<div className="bg-mud-dark border border-mud-green rounded-lg p-4 mb-4">
            <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                    <input type="text" placeholder="Search rooms, NPCs, items..." value={searchTerm} onChange={handleSearchChange} className="w-full px-3 py-2 bg-mud-black border border-mud-green text-mud-green rounded focus:outline-none focus:border-mud-light"/>
                </div>

                <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2 text-sm">
                        <input type="checkbox" checked={filters.hasNpcs} onChange={(e) => handleFilterChange('hasNpcs', e.target.checked)} className="bg-mud-black border border-mud-green text-mud-green"/>
                        <span className="text-mud-light">Has NPCs</span>
                    </label>

                    <label className="flex items-center space-x-2 text-sm">
                        <input type="checkbox" checked={filters.hasItems} onChange={(e) => handleFilterChange('hasItems', e.target.checked)} className="bg-mud-black border border-mud-green text-mud-green"/>
                        <span className="text-mud-light">Has Items</span>
                    </label>

                    <label className="flex items-center space-x-2 text-sm">
                        <input type="checkbox" checked={filters.hasPlayers} onChange={(e) => handleFilterChange('hasPlayers', e.target.checked)} className="bg-mud-black border border-mud-green text-mud-green"/>
                        <span className="text-mud-light">Has Players</span>
                    </label>
                </div>
            </div>
        </div>);
}
function NPCLocationTracker({ npcs, rooms, selectedNpc, onNpcSelect }) {
    const [sortBy, setSortBy] = useState('name');
    const sortedNpcs = [...npcs].sort((a, b) => {
        switch (sortBy) {
            case 'location':
                return a.location.localeCompare(b.location);
            case 'level':
                return b.stats.level - a.stats.level;
            case 'aggression':
                return a.stats.aggression.localeCompare(b.stats.aggression);
            default:
                return a.name.localeCompare(b.name);
        }
    });
    const getRoomName = (roomId) => {
        const room = rooms.find(r => r.id === roomId);
        return room ? room.name : roomId;
    };
    return (<div className="bg-mud-dark border border-mud-green rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-mud-green">NPC Locations</h3>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-1 bg-mud-black border border-mud-green text-mud-green rounded text-sm">
                    <option value="name">Sort by Name</option>
                    <option value="location">Sort by Location</option>
                    <option value="level">Sort by Level</option>
                    <option value="aggression">Sort by Aggression</option>
                </select>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
                {sortedNpcs.map(npc => (<div key={npc.id} onClick={() => onNpcSelect(npc)} className={`p-3 border rounded cursor-pointer transition-colors ${selectedNpc && selectedNpc.id === npc.id
                ? 'bg-mud-green border-mud-light'
                : 'bg-mud-black border-mud-green hover:bg-gray-700'}`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="text-mud-green font-bold">{npc.name}</div>
                                <div className="text-mud-light text-sm">{npc.description}</div>
                                <div className="text-mud-light text-xs mt-1">
                                    Location: {getRoomName(npc.location)}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-mud-light text-sm">Level {npc.stats.level}</div>
                                <div className={`text-xs capitalize font-bold ${npc.stats.aggression === 'friendly' ? 'text-green-400' :
                npc.stats.aggression === 'hostile' ? 'text-red-400' :
                    'text-yellow-400'}`}>
                                    {npc.stats.aggression}
                                </div>
                            </div>
                        </div>
                    </div>))}
            </div>
        </div>);
}
function ItemDistribution({ items, rooms, onItemSelect }) {
    const [sortBy, setSortBy] = useState('room');
    const [selectedItem, setSelectedItem] = useState(null);
    const itemsByRoom = rooms.reduce((acc, room) => {
        acc[room.id] = {
            roomName: room.name,
            items: room.items?.map(itemId => ({ id: itemId, name: itemId })) || [],
            itemCount: room.items?.length || 0
        };
        return acc;
    }, {});
    const sortedRooms = Object.entries(itemsByRoom)
        .filter(([_, data]) => data.itemCount > 0)
        .sort(([a, dataA], [b, dataB]) => {
        switch (sortBy) {
            case 'count':
                return dataB.itemCount - dataA.itemCount;
            case 'name':
                return dataA.roomName.localeCompare(dataB.roomName);
            default:
                return 0;
        }
    });
    const handleItemClick = (item) => {
        setSelectedItem(item);
        onItemSelect && onItemSelect(item);
    };
    return (<div className="bg-mud-dark border border-mud-green rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-mud-green">Item Distribution</h3>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-1 bg-mud-black border border-mud-green text-mud-green rounded text-sm">
                    <option value="room">Sort by Room</option>
                    <option value="count">Sort by Count</option>
                    <option value="name">Sort by Name</option>
                </select>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
                {sortedRooms.map(([roomId, data]) => (<div key={roomId} className="bg-mud-black border border-mud-green rounded p-3">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-mud-green font-bold">{data.roomName}</span>
                            <span className="text-mud-light text-sm">{data.itemCount} items</span>
                        </div>
                        <div className="space-y-1">
                            {data.items.map(item => (<div key={item.id} onClick={() => handleItemClick(item)} className={`p-2 rounded cursor-pointer text-sm ${selectedItem && selectedItem.id === item.id
                    ? 'bg-mud-green text-mud-black'
                    : 'bg-mud-dark text-mud-light hover:bg-gray-700'}`}>
                                    {item.name}
                                </div>))}
                        </div>
                    </div>))}

                {sortedRooms.length === 0 && (<p className="text-mud-light text-center py-4">No items found in rooms</p>)}
            </div>
        </div>);
}
function AccessibilityPanel({ isOpen, onClose, user }) {
    if (!isOpen || user.role !== 'moderator')
        return null;
    return (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-mud-dark border-2 border-mud-green p-6 rounded-lg max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-mud-green">Accessibility Settings</h3>
                    <button onClick={onClose} className="text-mud-light hover:text-mud-green">
                        ✕
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="text-sm text-mud-light">
                        <p className="mb-2">Keyboard Navigation:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>Use Tab to navigate between rooms</li>
                            <li>Enter/Space to select rooms</li>
                            <li>Arrow keys to pan the map</li>
                            <li>+/- to zoom in/out</li>
                        </ul>
                    </div>

                    <div className="text-sm text-mud-light">
                        <p className="mb-2">Screen Reader Support:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>Room names and descriptions are properly labeled</li>
                            <li>NPC and item counts are announced</li>
                            <li>Interactive elements have ARIA labels</li>
                        </ul>
                    </div>

                    <div className="text-sm text-mud-light">
                        <p className="mb-2">Color Contrast:</p>
                        <p className="text-xs">High contrast mode available for better visibility</p>
                    </div>
                </div>
            </div>
        </div>);
}
function WorldVisualization({ api, user }) {
    const [worldData, setWorldData] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [npcs, setNpcs] = useState([]);
    const [items, setItems] = useState([]);
    const [connections, setConnections] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [selectedNpc, setSelectedNpc] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({});
    const [accessibilityOpen, setAccessibilityOpen] = useState(false);
    const [roomEditModalOpen, setRoomEditModalOpen] = useState(false);
    const [entityModalOpen, setEntityModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null);
    const [managingRoom, setManagingRoom] = useState(null);
    useEffect(() => {
        loadWorldData();
        const interval = setInterval(loadWorldData, 30000);
        return () => clearInterval(interval);
    }, []);
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.key === 'Escape') {
                setSelectedRoom(null);
                setSelectedNpc(null);
                setSelectedItem(null);
            }
        };
        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
    }, []);
    const loadWorldData = async () => {
        try {
            const [overviewResult, roomsResult, npcsResult] = await Promise.all([
                api.get('/admin/world/overview'),
                api.get('/admin/world/rooms'),
                api.get('/admin/world/npcs')
            ]);
            if (overviewResult && roomsResult && npcsResult) {
                setWorldData(overviewResult);
                setRooms(Array.isArray(roomsResult) ? roomsResult : (roomsResult.rooms || []));
                setNpcs(Array.isArray(npcsResult) ? npcsResult : (npcsResult.npcs || []));
                const newConnections = [];
                roomsResult.forEach(room => {
                    Object.entries(room.exits || {}).forEach(([direction, targetRoomId]) => {
                        if (!newConnections.some(conn => (conn.from === room.id && conn.to === targetRoomId) ||
                            (conn.from === targetRoomId && conn.to === room.id))) {
                            newConnections.push({
                                from: room.id,
                                to: targetRoomId,
                                direction
                            });
                        }
                    });
                });
                setConnections(newConnections);
            }
        }
        catch (error) {
            console.error('Failed to load world data:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleSearch = (term) => {
        setSearchTerm(term);
    };
    const handleFilter = (newFilters) => {
        setFilters(newFilters);
    };
    const handleRoomSelect = (room) => {
        setSelectedRoom(room);
        setSelectedNpc(null);
    };
    const handleNpcSelect = (npc) => {
        setSelectedNpc(npc);
        setSelectedRoom(null);
        setSelectedItem(null);
    };
    const handleItemSelect = (item) => {
        setSelectedItem(item);
        setSelectedRoom(null);
        setSelectedNpc(null);
    };
    const handleRoomEdit = (room) => {
        setEditingRoom(room);
        setRoomEditModalOpen(true);
    };
    const handleEntityManage = (room) => {
        setManagingRoom(room);
        setEntityModalOpen(true);
    };
    const handleRoomSave = async (roomId, roomData) => {
        const result = await api.put(`/admin/world/rooms/${roomId}`, roomData);
        if (result.success) {
            await loadWorldData();
        }
        return result;
    };
    const handleEntityAction = async (action, entityType, entityId, targetRoomId) => {
        let result;
        switch (action) {
            case 'move':
                if (entityType === 'npc') {
                    result = await api.post('/admin/world/npcs/move', { npcId: entityId, newLocation: targetRoomId });
                }
                else if (entityType === 'item') {
                    result = await api.post('/admin/world/items/move', {
                        itemId: entityId,
                        fromRoomId: managingRoom.id,
                        toRoomId: targetRoomId
                    });
                }
                break;
            case 'spawn':
                if (entityType === 'npc') {
                    result = await api.post('/admin/world/npcs', {
                        id: entityId,
                        name: entityId,
                        location: managingRoom.id,
                        template: 'default_template',
                        stats: { health: 100, level: 1, aggression: 'neutral' }
                    });
                }
                else if (entityType === 'item') {
                    result = await api.post('/admin/world/items', {
                        id: entityId,
                        name: entityId,
                        description: `A ${entityId} item`,
                        type: 'misc',
                        value: 1
                    });
                }
                break;
            case 'despawn':
                if (entityType === 'npc') {
                    result = await api.delete(`/admin/world/npcs/${entityId}`);
                }
                else if (entityType === 'item') {
                    result = await api.delete(`/admin/world/items/${entityId}`);
                }
                break;
            default:
                result = { success: false, message: 'Unknown action' };
        }
        if (result.success) {
            await loadWorldData();
        }
        return result;
    };
    const filteredRooms = rooms.filter(room => {
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            const roomNpcs = npcs.filter(npc => npc.location === room.id);
            const hasMatchingNpc = roomNpcs.some(npc => npc.name.toLowerCase().includes(searchLower));
            if (!room.name.toLowerCase().includes(searchLower) &&
                !room.description.toLowerCase().includes(searchLower) &&
                !hasMatchingNpc) {
                return false;
            }
        }
        if (filters.hasNpcs && (!room.npcs || room.npcs.length === 0))
            return false;
        if (filters.hasItems && (!room.items || room.items.length === 0))
            return false;
        if (filters.hasPlayers && (!room.players || room.players.length === 0))
            return false;
        return true;
    });
    if (loading) {
        return <div className="text-center py-8">Loading world visualization...</div>;
    }
    return (<div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-mud-green">Interactive World Visualization</h2>
                <div className="flex space-x-2">
                    <button onClick={loadWorldData} className="bg-mud-green text-mud-black px-4 py-2 rounded font-bold hover:bg-mud-light">
                        Refresh Data
                    </button>
                    {user.role === 'moderator' && (<button onClick={() => setAccessibilityOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-500" title="Accessibility Settings">
                            ♿
                        </button>)}
                </div>
            </div>

            
            <SearchAndFilter onSearch={handleSearch} onFilter={handleFilter}/>

            
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                
                <div className="xl:col-span-2">
                    <WorldMap rooms={filteredRooms} selectedRoom={selectedRoom} onRoomSelect={handleRoomSelect} connections={connections} onRoomEdit={handleRoomEdit} onEntityManage={handleEntityManage} user={user}/>
                </div>

                
                <div className="xl:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    
                    {selectedRoom && (<RoomDetailPanel room={selectedRoom} npcs={npcs} items={items} onClose={() => setSelectedRoom(null)}/>)}

                    
                    <NPCLocationTracker npcs={npcs} rooms={rooms} selectedNpc={selectedNpc} onNpcSelect={handleNpcSelect}/>

                    
                    <ItemDistribution items={items} rooms={rooms} onItemSelect={handleItemSelect}/>

                    
                    <div className="bg-mud-dark border border-mud-green rounded-lg p-4">
                        <h3 className="text-lg font-bold text-mud-green mb-4">World Statistics</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-mud-light">Total Rooms:</span>
                                <span className="text-mud-green font-mono">{rooms.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-mud-light">Total NPCs:</span>
                                <span className="text-mud-green font-mono">{npcs.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-mud-light">Active Players:</span>
                                <span className="text-mud-green font-mono">
                                    {rooms.reduce((total, room) => total + (room.players?.length || 0), 0)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-mud-light">Connections:</span>
                                <span className="text-mud-green font-mono">{connections.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-mud-light">Filtered Rooms:</span>
                                <span className="text-mud-green font-mono">{filteredRooms.length}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            
            <AccessibilityPanel isOpen={accessibilityOpen} onClose={() => setAccessibilityOpen(false)} user={user}/>

            
            <RoomEditModal room={editingRoom} isOpen={roomEditModalOpen} onClose={() => {
            setRoomEditModalOpen(false);
            setEditingRoom(null);
        }} onSave={handleRoomSave} user={user}/>

            
            <EntityManagementModal room={managingRoom} isOpen={entityModalOpen} onClose={() => {
            setEntityModalOpen(false);
            setManagingRoom(null);
        }} onAction={handleEntityAction} user={user}/>
        </div>);
}
//# sourceMappingURL=WorldVisualization.js.map