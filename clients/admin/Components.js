// Import security utilities
import { SecurityUtils, PERMISSIONS, usePermissions } from './SecurityUtils.js';

// Dashboard Tab Component
function DashboardTab({ api, user }) {
  const permissions = usePermissions(user);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const result = await api.get('/admin/dashboard');
            if (result) {
                setStats(result);
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center py-8">Loading dashboard...</div>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-mud-green">Dashboard Overview</h2>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-mud-dark border border-mud-green p-4 rounded-lg">
                    <h3 className="text-lg font-bold text-mud-green">Total Users</h3>
                    <p className="text-2xl font-mono text-mud-light">{stats?.totalUsers || 0}</p>
                </div>
                <div className="bg-mud-dark border border-mud-green p-4 rounded-lg">
                    <h3 className="text-lg font-bold text-mud-green">Active Users</h3>
                    <p className="text-2xl font-mono text-mud-light">{stats?.activeUsers || 0}</p>
                </div>
                <div className="bg-mud-dark border border-mud-green p-4 rounded-lg">
                    <h3 className="text-lg font-bold text-mud-green">Total Rooms</h3>
                    <p className="text-2xl font-mono text-mud-light">{stats?.totalRooms || 0}</p>
                </div>
                <div className="bg-mud-dark border border-mud-green p-4 rounded-lg">
                    <h3 className="text-lg font-bold text-mud-green">Active Players</h3>
                    <p className="text-2xl font-mono text-mud-light">{stats?.activePlayers || 0}</p>
                </div>
            </div>

            {/* System Info */}
            <div className="bg-mud-dark border border-mud-green p-4 rounded-lg">
                <h3 className="text-lg font-bold text-mud-green mb-4">System Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <p><strong>System Uptime:</strong> <span className="text-mud-light">{stats?.systemUptime || 'N/A'}</span></p>
                        <p><strong>Server Status:</strong> <span className="text-green-400">Online</span></p>
                    </div>
                    <div>
                        <p><strong>Database:</strong> <span className="text-green-400">Connected</span></p>
                        <p><strong>World Engine:</strong> <span className="text-green-400">Running</span></p>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-mud-dark border border-mud-green p-4 rounded-lg">
                <h3 className="text-lg font-bold text-mud-green mb-4">Recent Activity</h3>
                <div className="space-y-2">
                    {stats?.recentActivity?.map((activity, index) => (
                        <div key={activity.id || index} className="flex justify-between items-center py-2 border-b border-mud-black last:border-b-0">
                            <div>
                                <span className="text-mud-green font-bold">{activity.user}</span>
                                <span className="text-mud-light ml-2">{activity.details}</span>
                            </div>
                            <span className="text-xs text-mud-light">
                                {new Date(activity.timestamp).toLocaleTimeString()}
                            </span>
                        </div>
                    )) || <p className="text-mud-light">No recent activity</p>}
                </div>
            </div>
        </div>
    );
}

// Users Tab Component
function UsersTab({ api, user }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const permissions = usePermissions(user);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const result = await api.get('/admin/users');
            if (result.success) {
                setUsers(result.users || []);
            }
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUserAction = async (action, userId, data = {}) => {
        try {
            let endpoint = `/admin/users/${userId}`;
            let method = 'put';

            switch (action) {
                case 'activate':
                    endpoint += '/activate';
                    break;
                case 'deactivate':
                    endpoint += '/deactivate';
                    break;
                case 'resetPassword':
                    endpoint += '/password';
                    data = { password: 'password123' }; // Default reset password
                    break;
                case 'updateRole':
                    endpoint += '/role';
                    break;
            }

            const result = method === 'put' ? await api.put(endpoint, data) : await api.post(endpoint, data);
            if (result.success) {
                loadUsers(); // Reload the users list
                alert(result.message);
            } else {
                alert(result.message || 'Action failed');
            }
        } catch (error) {
            alert('Network error');
        }
    };

    if (loading) {
        return <div className="text-center py-8">Loading users...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-mud-green">User Management</h2>
                {permissions.canManageUsers() && (
                    <button className="bg-mud-green text-mud-black px-4 py-2 rounded font-bold hover:bg-mud-light">
                        Add New User
                    </button>
                )}
            </div>

            <div className="bg-mud-dark border border-mud-green rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-mud-black">
                        <tr>
                            <th className="px-4 py-2 text-left text-mud-green font-bold">Username</th>
                            <th className="px-4 py-2 text-left text-mud-green font-bold">Role</th>
                            <th className="px-4 py-2 text-left text-mud-green font-bold">Status</th>
                            <th className="px-4 py-2 text-left text-mud-green font-bold">Last Login</th>
                            <th className="px-4 py-2 text-left text-mud-green font-bold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} className="border-t border-mud-black hover:bg-mud-black">
                                <td className="px-4 py-2 text-mud-light">{user.username}</td>
                                <td className="px-4 py-2">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                        user.role === 'admin' ? 'bg-red-900 text-white' :
                                        user.role === 'moderator' ? 'bg-yellow-600 text-black' :
                                        'bg-mud-green text-mud-black'
                                    }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-4 py-2">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                        user.isActive ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                                    }`}>
                                        {user.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-4 py-2 text-mud-light text-sm">
                                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                                </td>
                                <td className="px-4 py-2 space-x-2">
                                    {user.isActive ? (
                                        <button
                                            onClick={() => handleUserAction('deactivate', user.id)}
                                            className="bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded text-xs font-bold"
                                        >
                                            Deactivate
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleUserAction('activate', user.id)}
                                            className="bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded text-xs font-bold"
                                        >
                                            Activate
                                        </button>
                                    )}
                                    {permissions.canManageUsers() && (
                                        <button
                                            onClick={() => handleUserAction('resetPassword', user.id)}
                                            className="bg-yellow-600 hover:bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold"
                                        >
                                            Reset Password
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// World Tab Component - Enhanced with Interactive Visualization
function WorldTab({ api, user }) {
  const [activeView, setActiveView] = useState('visualization'); // 'visualization' or 'management'
  const [worldData, setWorldData] = useState(null);
  const [loading, setLoading] = useState(true);
  const permissions = usePermissions(user);

    useEffect(() => {
        loadWorldData();
    }, []);

    const loadWorldData = async () => {
        try {
            const result = await api.get('/admin/world/overview');
            if (result.success) {
                setWorldData(result);
            }
        } catch (error) {
            console.error('Failed to load world data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center py-8">Loading world data...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-mud-green">World Management</h2>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setActiveView('visualization')}
                        className={`px-4 py-2 rounded font-bold ${
                            activeView === 'visualization'
                                ? 'bg-mud-green text-mud-black'
                                : 'bg-mud-dark text-mud-green border border-mud-green'
                        }`}
                    >
                        Interactive Map
                    </button>
                    <button
                        onClick={() => setActiveView('management')}
                        className={`px-4 py-2 rounded font-bold ${
                            activeView === 'management'
                                ? 'bg-mud-green text-mud-black'
                                : 'bg-mud-dark text-mud-green border border-mud-green'
                        }`}
                    >
                        Management
                    </button>
                </div>
            </div>

            {activeView === 'visualization' ? (
                <WorldVisualization api={api} user={user} />
            ) : (
                // Traditional management view
                <div className="space-y-6">
                    {/* World Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-mud-dark border border-mud-green p-4 rounded-lg">
                            <h3 className="text-lg font-bold text-mud-green">Total Rooms</h3>
                            <p className="text-2xl font-mono text-mud-light">{worldData?.totalRooms || 0}</p>
                        </div>
                        <div className="bg-mud-dark border border-mud-green p-4 rounded-lg">
                            <h3 className="text-lg font-bold text-mud-green">Total NPCs</h3>
                            <p className="text-2xl font-mono text-mud-light">{worldData?.totalNPCs || 0}</p>
                        </div>
                        <div className="bg-mud-dark border border-mud-green p-4 rounded-lg">
                            <h3 className="text-lg font-bold text-mud-green">Total Items</h3>
                            <p className="text-2xl font-mono text-mud-light">{worldData?.totalItems || 0}</p>
                        </div>
                    </div>

                    {/* Sectors */}
                    <div className="bg-mud-dark border border-mud-green p-4 rounded-lg">
                        <h3 className="text-lg font-bold text-mud-green mb-4">World Sectors</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {worldData?.sectors?.map((sector) => (
                                <div key={sector.id} className="bg-mud-black border border-mud-green p-4 rounded">
                                    <h4 className="text-mud-green font-bold mb-2">{sector.name}</h4>
                                    <p className="text-mud-light text-sm mb-2">{sector.description}</p>
                                    <div className="text-xs text-mud-light">
                                        <p>Rooms: {sector.rooms?.length || 0}</p>
                                        <p>NPCs: {sector.npcs?.length || 0}</p>
                                    </div>
                                </div>
                            )) || <p className="text-mud-light">No sectors loaded</p>}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    {permissions.canManageWorld() && (
                        <div className="bg-mud-dark border border-mud-green p-4 rounded-lg">
                            <h3 className="text-lg font-bold text-mud-green mb-4">Quick Actions</h3>
                            <div className="flex space-x-4">
                                <button className="bg-mud-green text-mud-black px-4 py-2 rounded font-bold hover:bg-mud-light">
                                    Add New Room
                                </button>
                                <button className="bg-mud-green text-mud-black px-4 py-2 rounded font-bold hover:bg-mud-light">
                                    Add New NPC
                                </button>
                                <button className="bg-mud-green text-mud-black px-4 py-2 rounded font-bold hover:bg-mud-light">
                                    Create Sector
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Dialogue Tree View Component
function DialogueTreeView({ tree, onNodeSelect, selectedNodeId, onNodeToggle, expandedNodes }) {
    const [draggedNode, setDraggedNode] = useState(null);
    const [dragOver, setDragOver] = useState(null);

    const getNodeConnections = (nodeId) => {
        const node = tree.nodes[nodeId];
        if (!node || !node.responses) return [];
        return node.responses.map(choice => choice.nextNodeId).filter(id => id && tree.nodes[id]);
    };

    const getNodePosition = (nodeId, level = 0, visited = new Set()) => {
        if (visited.has(nodeId)) return null;
        visited.add(nodeId);

        const connections = getNodeConnections(nodeId);
        const children = connections.map(childId =>
            getNodePosition(childId, level + 1, new Set(visited))
        ).filter(Boolean);

        return { nodeId, level, children };
    };

    const renderNode = (nodeId, level = 0) => {
        const node = tree.nodes[nodeId];
        if (!node) return null;

        const isExpanded = expandedNodes.has(nodeId);
        const isSelected = selectedNodeId === nodeId;
        const hasChildren = node.responses && node.responses.some(choice => choice.nextNodeId && tree.nodes[choice.nextNodeId]);
        const connections = getNodeConnections(nodeId);

        return (
            <div key={nodeId} className="mb-2">
                <div
                    className={`flex items-center p-2 rounded border cursor-pointer transition-colors ${
                        isSelected
                            ? 'bg-mud-green text-mud-black border-mud-light'
                            : 'bg-mud-dark text-mud-light border-mud-green hover:bg-mud-black'
                    } ${dragOver === nodeId ? 'ring-2 ring-mud-light' : ''}`}
                    style={{ marginLeft: `${level * 20}px` }}
                    onClick={() => onNodeSelect(nodeId)}
                    draggable
                    onDragStart={(e) => {
                        setDraggedNode(nodeId);
                        e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(nodeId);
                    }}
                    onDragLeave={() => setDragOver(null)}
                    onDrop={(e) => {
                        e.preventDefault();
                        if (draggedNode && draggedNode !== nodeId) {
                            // Handle node reordering/connection updates
                            console.log(`Move ${draggedNode} to connect with ${nodeId}`);
                        }
                        setDraggedNode(null);
                        setDragOver(null);
                    }}
                >
                    <button
                        className="mr-2 text-mud-green hover:text-mud-light"
                        onClick={(e) => {
                            e.stopPropagation();
                            onNodeToggle(nodeId);
                        }}
                    >
                        {hasChildren ? (isExpanded ? '▼' : '▶') : '•'}
                    </button>

                    <div className="flex-1">
                        <div className="font-bold text-sm">{nodeId}</div>
                        <div className="text-xs opacity-75 truncate">
                            {node.text.substring(0, 50)}{node.text.length > 50 ? '...' : ''}
                        </div>
                        <div className="text-xs opacity-50">
                            {node.responses?.length || 0} choices
                            {connections.length > 0 && ` → ${connections.length} connections`}
                            {node.isEndNode && ' (END)'}
                        </div>
                    </div>

                    <div className="ml-2 flex space-x-1">
                        {node.isEndNode && <span className="text-red-400 text-xs">END</span>}
                        {hasChildren && <span className="text-blue-400 text-xs">{connections.length}</span>}
                    </div>
                </div>

                {isExpanded && connections.map(childId => renderNode(childId, level + 1))}
            </div>
        );
    };

    return (
        <div className="bg-mud-black border border-mud-green rounded-lg p-4 max-h-96 overflow-y-auto">
            <div className="mb-2 text-sm text-mud-green font-bold">Dialogue Tree: {tree.name}</div>
            <div className="space-y-1">
                {renderNode(tree.rootNodeId)}
            </div>
        </div>
    );
}

// Dialogue Node Editor Component
function DialogueNodeEditor({ node, tree, onNodeUpdate, onSave, onCancel, user, validationErrors = [] }) {
    const [editedNode, setEditedNode] = useState(node || {
        id: '',
        text: '',
        responses: [],
        conditions: [],
        actions: [],
        isEndNode: false
    });
    const [newChoice, setNewChoice] = useState({ text: '', nextNodeId: '' });
    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleNodeChange = (field, value) => {
        setEditedNode(prev => ({ ...prev, [field]: value }));
    };

    const handleChoiceChange = (index, field, value) => {
        const updatedResponses = [...editedNode.responses];
        updatedResponses[index] = { ...updatedResponses[index], [field]: value };
        setEditedNode(prev => ({ ...prev, responses: updatedResponses }));
    };

    const addChoice = () => {
        if (newChoice.text.trim()) {
            const choice = {
                id: `choice_${Date.now()}`,
                text: newChoice.text,
                nextNodeId: newChoice.nextNodeId || null
            };
            setEditedNode(prev => ({
                ...prev,
                responses: [...prev.responses, choice]
            }));
            setNewChoice({ text: '', nextNodeId: '' });
        }
    };

    const removeChoice = (index) => {
        const updatedResponses = editedNode.responses.filter((_, i) => i !== index);
        setEditedNode(prev => ({ ...prev, responses: updatedResponses }));
    };

    const getValidationError = (field) => {
        return validationErrors.find(error => error.field === field);
    };

    return (
        <div className="bg-mud-dark border border-mud-green rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-mud-green">
                    {node ? 'Edit Dialogue Node' : 'Create Dialogue Node'}
                </h3>
                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-sm text-mud-light hover:text-mud-green"
                >
                    {showAdvanced ? 'Hide' : 'Show'} Advanced
                </button>
            </div>

            {/* Basic Fields */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-mud-green mb-1">Node ID</label>
                    <input
                        type="text"
                        value={editedNode.id}
                        onChange={(e) => handleNodeChange('id', e.target.value)}
                        className={`w-full px-3 py-2 bg-mud-black border text-mud-green rounded focus:outline-none ${
                            getValidationError('id') ? 'border-red-500' : 'border-mud-green focus:border-mud-light'
                        }`}
                        placeholder="e.g., blacksmith_greeting"
                    />
                    {getValidationError('id') && (
                        <div className="text-red-400 text-xs mt-1">{getValidationError('id').message}</div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-bold text-mud-green mb-1">NPC Message</label>
                    <textarea
                        value={editedNode.text}
                        onChange={(e) => handleNodeChange('text', e.target.value)}
                        rows={4}
                        className={`w-full px-3 py-2 bg-mud-black border text-mud-green rounded focus:outline-none resize-vertical ${
                            getValidationError('text') ? 'border-red-500' : 'border-mud-green focus:border-mud-light'
                        }`}
                        placeholder="Enter the NPC's dialogue text..."
                    />
                    {getValidationError('text') && (
                        <div className="text-red-400 text-xs mt-1">{getValidationError('text').message}</div>
                    )}
                </div>

                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="isEndNode"
                        checked={editedNode.isEndNode}
                        onChange={(e) => handleNodeChange('isEndNode', e.target.checked)}
                        className="bg-mud-black border-mud-green text-mud-green focus:ring-mud-light"
                    />
                    <label htmlFor="isEndNode" className="text-sm text-mud-light">End conversation here</label>
                </div>

                {/* Choices Section */}
                <div>
                    <label className="block text-sm font-bold text-mud-green mb-2">Player Choices</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {editedNode.responses.map((choice, index) => (
                            <div key={choice.id} className="bg-mud-black border border-mud-green rounded p-3">
                                <div className="flex justify-between items-start mb-2">
                                    <input
                                        type="text"
                                        value={choice.text}
                                        onChange={(e) => handleChoiceChange(index, 'text', e.target.value)}
                                        className="flex-1 px-3 py-1 bg-mud-dark border border-mud-green text-mud-green rounded focus:outline-none focus:border-mud-light mr-2"
                                        placeholder="Choice text..."
                                    />
                                    <button
                                        onClick={() => removeChoice(index)}
                                        className="text-red-400 hover:text-red-300 text-sm px-2 py-1"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <label className="text-xs text-mud-light">Next Node:</label>
                                    <select
                                        value={choice.nextNodeId || ''}
                                        onChange={(e) => handleChoiceChange(index, 'nextNodeId', e.target.value)}
                                        className="px-2 py-1 bg-mud-dark border border-mud-green text-mud-green rounded text-xs focus:outline-none focus:border-mud-light"
                                    >
                                        <option value="">End Conversation</option>
                                        {Object.keys(tree.nodes).map(nodeId => (
                                            <option key={nodeId} value={nodeId}>{nodeId}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add New Choice */}
                    <div className="mt-2 p-2 bg-mud-black border border-mud-green rounded">
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={newChoice.text}
                                onChange={(e) => setNewChoice(prev => ({ ...prev, text: e.target.value }))}
                                className="flex-1 px-3 py-1 bg-mud-dark border border-mud-green text-mud-green rounded focus:outline-none focus:border-mud-light"
                                placeholder="New choice text..."
                            />
                            <select
                                value={newChoice.nextNodeId}
                                onChange={(e) => setNewChoice(prev => ({ ...prev, nextNodeId: e.target.value }))}
                                className="px-2 py-1 bg-mud-dark border border-mud-green text-mud-green rounded text-xs focus:outline-none focus:border-mud-light"
                            >
                                <option value="">End Conversation</option>
                                {Object.keys(tree.nodes).map(nodeId => (
                                    <option key={nodeId} value={nodeId}>{nodeId}</option>
                                ))}
                            </select>
                            <button
                                onClick={addChoice}
                                className="bg-mud-green text-mud-black px-3 py-1 rounded text-sm font-bold hover:bg-mud-light"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>

                {/* Advanced Section */}
                {showAdvanced && (
                    <div className="border-t border-mud-green pt-4">
                        <h4 className="text-sm font-bold text-mud-green mb-2">Advanced Settings</h4>

                        {/* Conditions */}
                        <div className="mb-4">
                            <label className="block text-sm font-bold text-mud-green mb-2">Node Conditions</label>
                            <div className="text-xs text-mud-light mb-2">
                                Conditions that must be met to reach this node
                            </div>
                            <div className="bg-mud-black border border-mud-green rounded p-2 text-xs text-mud-light">
                                Conditions editor would go here (level, item, quest, etc.)
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mb-4">
                            <label className="block text-sm font-bold text-mud-green mb-2">Node Actions</label>
                            <div className="text-xs text-mud-light mb-2">
                                Actions to perform when this node is reached
                            </div>
                            <div className="bg-mud-black border border-mud-green rounded p-2 text-xs text-mud-light">
                                Actions editor would go here (set variables, give items, etc.)
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t border-mud-green">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 border border-mud-green text-mud-green rounded hover:bg-mud-green hover:text-mud-black"
                >
                    Cancel
                </button>
                <button
                    onClick={() => onSave(editedNode)}
                    className="px-4 py-2 bg-mud-green text-mud-black rounded font-bold hover:bg-mud-light"
                    disabled={!editedNode.id.trim() || !editedNode.text.trim()}
                >
                    {node ? 'Update Node' : 'Create Node'}
                </button>
            </div>
        </div>
    );
}

// Enhanced Dialogue Tab Component
function DialogueTab({ api, user }) {
  const [dialogueTrees, setDialogueTrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTree, setSelectedTree] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [showNodeEditor, setShowNodeEditor] = useState(false);
  const [editingNode, setEditingNode] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [activeView, setActiveView] = useState('trees'); // 'trees', 'editor', 'test'
  const permissions = usePermissions(user);

    useEffect(() => {
        loadDialogueTrees();
    }, []);

    const loadDialogueTrees = async () => {
        try {
            const result = await api.get('/admin/dialogue/trees');
            if (result.success !== false) {
                setDialogueTrees(result || []);
            }
        } catch (error) {
            console.error('Failed to load dialogue trees:', error);
        } finally {
            setLoading(false);
        }
    };

    const validateDialogueTree = async (treeId) => {
        try {
            const result = await api.post(`/admin/dialogue/validate/${treeId}`, {});
            if (result.success) {
                setValidationErrors(result.errors || []);
                return result;
            }
        } catch (error) {
            console.error('Validation failed:', error);
        }
        return null;
    };

    const saveDialogueTree = async (tree) => {
        try {
            const result = await api.put(`/admin/dialogue/trees/${tree.id}`, tree);
            if (result.success) {
                await loadDialogueTrees();
                setUnsavedChanges(false);
                alert('Dialogue tree saved successfully!');
                return true;
            } else {
                alert(result.message || 'Failed to save dialogue tree');
            }
        } catch (error) {
            console.error('Save failed:', error);
            alert('Network error while saving');
        }
        return false;
    };

    const createNewNode = () => {
        if (!selectedTree) return;

        const newNode = {
            id: `node_${Date.now()}`,
            text: 'New dialogue text...',
            responses: [],
            conditions: [],
            actions: [],
            isEndNode: false
        };

        setEditingNode(newNode);
        setShowNodeEditor(true);
        setActiveView('editor');
    };

    const handleNodeSelect = (nodeId) => {
        setSelectedNodeId(nodeId);
        setEditingNode(selectedTree.nodes[nodeId]);
        setShowNodeEditor(true);
        setActiveView('editor');
    };

    const handleNodeToggle = (nodeId) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(nodeId)) {
            newExpanded.delete(nodeId);
        } else {
            newExpanded.add(nodeId);
        }
        setExpandedNodes(newExpanded);
    };

    const handleNodeSave = async (nodeData) => {
        if (!selectedTree) return;

        const updatedTree = { ...selectedTree };
        updatedTree.nodes = { ...updatedTree.nodes };
        updatedTree.nodes[nodeData.id] = nodeData;

        // If this is a new node, we might need to connect it
        if (!selectedTree.nodes[nodeData.id]) {
            // New node - could add connection logic here
        }

        setSelectedTree(updatedTree);
        setUnsavedChanges(true);
        setShowNodeEditor(false);
        setEditingNode(null);

        // Validate the tree
        await validateDialogueTree(updatedTree.id);
    };

    const handleTreeSelect = (tree) => {
        setSelectedTree(tree);
        setSelectedNodeId(null);
        setExpandedNodes(new Set([tree.rootNodeId]));
        setActiveView('trees');
    };

    if (loading) {
        return <div className="text-center py-8">Loading dialogue trees...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-mud-green">Dialogue Management</h2>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setActiveView('trees')}
                        className={`px-4 py-2 rounded font-bold ${
                            activeView === 'trees'
                                ? 'bg-mud-green text-mud-black'
                                : 'bg-mud-dark text-mud-green border border-mud-green'
                        }`}
                    >
                        Trees
                    </button>
                    <button
                        onClick={() => setActiveView('editor')}
                        className={`px-4 py-2 rounded font-bold ${
                            activeView === 'editor'
                                ? 'bg-mud-green text-mud-black'
                                : 'bg-mud-dark text-mud-green border border-mud-green'
                        }`}
                    >
                        Editor
                    </button>
                    {permissions.canManageDialogue() && (
                        <button className="bg-mud-green text-mud-black px-4 py-2 rounded font-bold hover:bg-mud-light">
                            Create New Tree
                        </button>
                    )}
                </div>
            </div>

            {activeView === 'trees' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Dialogue Trees List */}
                    <div className="lg:col-span-1 space-y-4">
                        <h3 className="text-lg font-bold text-mud-green">Dialogue Trees</h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {dialogueTrees.map((tree) => (
                                <div
                                    key={tree.id}
                                    onClick={() => handleTreeSelect(tree)}
                                    className={`p-3 rounded border cursor-pointer transition-colors ${
                                        selectedTree?.id === tree.id
                                            ? 'bg-mud-green text-mud-black border-mud-light'
                                            : 'bg-mud-dark text-mud-light border-mud-green hover:bg-mud-black'
                                    }`}
                                >
                                    <h4 className="font-bold">{tree.name}</h4>
                                    <p className="text-sm opacity-75">{tree.description}</p>
                                    <div className="text-xs opacity-50 mt-1">
                                        <p>Nodes: {Object.keys(tree.nodes || {}).length}</p>
                                        <p>Updated: {new Date(tree.lastModified).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tree Visualization */}
                    <div className="lg:col-span-2">
                        {selectedTree ? (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-mud-green">Tree Structure</h3>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={createNewNode}
                                            className="bg-mud-green text-mud-black px-3 py-1 rounded text-sm font-bold hover:bg-mud-light"
                                        >
                                            Add Node
                                        </button>
                                        <button
                                            onClick={() => validateDialogueTree(selectedTree.id)}
                                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-bold hover:bg-blue-500"
                                        >
                                            Validate
                                        </button>
                                        {permissions.canManageDialogue() && unsavedChanges && (
                                            <button
                                                onClick={() => saveDialogueTree(selectedTree)}
                                                className="bg-yellow-600 text-black px-3 py-1 rounded text-sm font-bold hover:bg-yellow-500"
                                            >
                                                Save Changes
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <DialogueTreeView
                                    tree={selectedTree}
                                    onNodeSelect={handleNodeSelect}
                                    selectedNodeId={selectedNodeId}
                                    onNodeToggle={handleNodeToggle}
                                    expandedNodes={expandedNodes}
                                />

                                {/* Validation Errors */}
                                {validationErrors.length > 0 && (
                                    <div className="bg-red-900 border border-red-600 rounded p-3">
                                        <h4 className="text-red-400 font-bold mb-2">Validation Issues:</h4>
                                        <ul className="text-sm text-red-300 space-y-1">
                                            {validationErrors.map((error, index) => (
                                                <li key={index}>• {error}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-mud-light">
                                Select a dialogue tree to view its structure
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeView === 'editor' && showNodeEditor && editingNode && (
                <div className="max-w-4xl">
                    <DialogueNodeEditor
                        node={editingNode}
                        tree={selectedTree}
                        onNodeUpdate={handleNodeSave}
                        onSave={handleNodeSave}
                        onCancel={() => {
                            setShowNodeEditor(false);
                            setEditingNode(null);
                            setActiveView('trees');
                        }}
                        user={user}
                        validationErrors={validationErrors}
                    />
                </div>
            )}

            {activeView === 'editor' && !showNodeEditor && (
                <div className="text-center py-8 text-mud-light">
                    Select a node from the tree view to edit it, or create a new node
                </div>
            )}

            {/* Dialogue Tools */}
            <div className="bg-mud-dark border border-mud-green p-4 rounded-lg">
                <h3 className="text-lg font-bold text-mud-green mb-4">Dialogue Tools</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => selectedTree && validateDialogueTree(selectedTree.id)}
                        className="bg-mud-green text-mud-black p-4 rounded font-bold hover:bg-mud-light text-left"
                    >
                        <div className="text-lg">📝</div>
                        <div className="mt-2">Dialogue Validator</div>
                        <div className="text-sm mt-1 opacity-75">Check for errors in dialogue trees</div>
                    </button>
                    <button className="bg-mud-green text-mud-black p-4 rounded font-bold hover:bg-mud-light text-left">
                        <div className="text-lg">🔍</div>
                        <div className="mt-2">Dialogue Tester</div>
                        <div className="text-sm mt-1 opacity-75">Test dialogue flows interactively</div>
                    </button>
                    <button className="bg-mud-green text-mud-black p-4 rounded font-bold hover:bg-mud-light text-left">
                        <div className="text-lg">📊</div>
                        <div className="mt-2">Export/Import</div>
                        <div className="text-sm mt-1 opacity-75">Export dialogue trees or import from files</div>
                    </button>
                </div>
            </div>
        </div>
    );
}

// Admin Panel Component
function AdminPanel({ user, currentTab, onTabChange, onLogout, api }) {
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const permissions = usePermissions(user);

  // Define available tabs based on user permissions
  const getAvailableTabs = () => {
    return permissions.getAvailableTabs();
  };

    const tabs = getAvailableTabs();

    const renderTabContent = () => {
        switch (currentTab) {
            case 'dashboard':
                return <DashboardTab api={api} user={user} />;
            case 'users':
                return <UsersTab api={api} user={user} />;
            case 'world':
                return <WorldTab api={api} user={user} />;
            case 'dialogue':
                return <DialogueTab api={api} user={user} />;
            default:
                return <DashboardTab api={api} user={user} />;
        }
    };

    return (
        <div className="relative min-h-screen">
            {/* Header */}
            <header className="bg-mud-dark border-b border-mud-green p-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-mud-green">MUD Admin Panel</h1>
                        <p className="text-sm text-mud-light">Logged in as: {user.username} ({user.role})</p>
                    </div>
                    <button
                        onClick={onLogout}
                        className="bg-red-900 hover:bg-red-700 text-white px-4 py-2 rounded font-bold"
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Navigation Tabs */}
            <nav className="bg-mud-dark border-b border-mud-green">
                <div className="flex space-x-1 p-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded font-bold transition-colors ${
                                currentTab === tab.id
                                    ? 'bg-mud-green text-mud-black'
                                    : 'text-mud-green hover:bg-mud-dark'
                            }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </nav>

            {/* Main Content */}
            <main className="p-6">
                {renderTabContent()}
            </main>

            {/* Floating Admin Button */}
            {permissions.canSystemAdmin() && (
                <button
                    onClick={() => setIsAdminPanelOpen(!isAdminPanelOpen)}
                    className="fixed bottom-6 right-6 w-14 h-14 bg-mud-green text-mud-black rounded-full shadow-lg hover:bg-mud-light transition-colors flex items-center justify-center text-2xl font-bold z-50"
                    title="Admin Settings"
                >
                    ⚙️
                </button>
            )}

            {/* Admin Settings Panel */}
            {isAdminPanelOpen && permissions.canSystemAdmin() && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-mud-dark border-2 border-mud-green p-6 rounded-lg max-w-md w-full mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-mud-green">Admin Settings</h3>
                            <button
                                onClick={() => setIsAdminPanelOpen(false)}
                                className="text-mud-light hover:text-mud-green"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="text-sm text-mud-light">
                                <p><strong>System Health:</strong> All systems operational</p>
                                <p><strong>Active Connections:</strong> 8</p>
                                <p><strong>Server Uptime:</strong> 2d 4h 32m</p>
                            </div>
                            <div className="flex space-x-2">
                                <button className="bg-mud-green text-mud-black px-3 py-1 rounded text-sm font-bold hover:bg-mud-light">
                                    System Logs
                                </button>
                                <button className="bg-yellow-600 text-black px-3 py-1 rounded text-sm font-bold hover:bg-yellow-500">
                                    Restart Server
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}