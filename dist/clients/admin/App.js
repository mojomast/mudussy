const { useState, useEffect } = React;
class ApiService {
    constructor() {
        this.baseURL = `${window.location.origin}/api`;
        this.token = localStorage.getItem('admin_token');
        try {
            this.user = JSON.parse(localStorage.getItem('user_data')) || null;
        }
        catch (_) {
            this.user = null;
        }
    }
    headers() {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': this.token ? `Bearer ${this.token}` : undefined,
        };
        if (this.user?.userId) {
            headers['x-user-id'] = this.user.userId;
        }
        Object.keys(headers).forEach(k => headers[k] === undefined && delete headers[k]);
        return headers;
    }
    async login(credentials) {
        try {
            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials)
            });
            const data = await response.json();
            if (data.success) {
                this.token = data.token;
                localStorage.setItem('admin_token', data.token);
                localStorage.setItem('user_data', JSON.stringify({
                    username: data.username,
                    role: data.role,
                    userId: data.userId
                }));
            }
            return data;
        }
        catch (error) {
            return { success: false, message: 'Network error' };
        }
    }
    async logout() {
        this.token = null;
        localStorage.removeItem('admin_token');
        localStorage.removeItem('user_data');
    }
    async get(endpoint) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                headers: this.headers()
            });
            return await response.json();
        }
        catch (error) {
            return { success: false, message: 'Network error' };
        }
    }
    async post(endpoint, data) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'POST',
                headers: this.headers(),
                body: JSON.stringify(data)
            });
            return await response.json();
        }
        catch (error) {
            return { success: false, message: 'Network error' };
        }
    }
    async put(endpoint, data) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'PUT',
                headers: this.headers(),
                body: JSON.stringify(data)
            });
            return await response.json();
        }
        catch (error) {
            return { success: false, message: 'Network error' };
        }
    }
    async delete(endpoint) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'DELETE',
                headers: this.headers()
            });
            return await response.json();
        }
        catch (error) {
            return { success: false, message: 'Network error' };
        }
    }
}
const api = new ApiService();
function LoginForm({ onLogin }) {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const result = await api.login(credentials);
        if (result.success) {
            onLogin(result);
        }
        else {
            setError(result.message || 'Login failed');
        }
        setLoading(false);
    };
    const handleChange = (e) => {
        setCredentials({
            ...credentials,
            [e.target.name]: e.target.value
        });
    };
    return (<div className="min-h-screen flex items-center justify-center bg-mud-black">
            <div className="bg-mud-dark border-2 border-mud-green p-8 rounded-lg shadow-lg w-96">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-mud-green mb-2">MUD Admin Panel</h1>
                    <p className="text-mud-light">Enter your credentials</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-mud-green mb-1">
                            Username
                        </label>
                        <input type="text" name="username" value={credentials.username} onChange={handleChange} className="w-full px-3 py-2 bg-mud-black border border-mud-green text-mud-green rounded focus:outline-none focus:border-mud-light" required/>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-mud-green mb-1">
                            Password
                        </label>
                        <input type="password" name="password" value={credentials.password} onChange={handleChange} className="w-full px-3 py-2 bg-mud-black border border-mud-green text-mud-green rounded focus:outline-none focus:border-mud-light" required/>
                    </div>

                    {error && (<div className="text-red-400 text-sm bg-red-900 bg-opacity-20 p-2 rounded">
                            {error}
                        </div>)}

                    <button type="submit" disabled={loading} className="w-full bg-mud-green text-mud-black py-2 px-4 rounded font-bold hover:bg-mud-light disabled:opacity-50 disabled:cursor-not-allowed">
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className="mt-6 text-center text-xs text-mud-light">
                    <p>Demo credentials: admin/admin123, mod/mod123, player/player123</p>
                </div>
            </div>
        </div>);
}
function App() {
    const [user, setUser] = useState(null);
    const [currentTab, setCurrentTab] = useState('dashboard');
    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        const userData = localStorage.getItem('user_data');
        if (token && userData) {
            try {
                setUser(JSON.parse(userData));
            }
            catch (error) {
                localStorage.removeItem('admin_token');
                localStorage.removeItem('user_data');
            }
        }
    }, []);
    const handleLogin = (result) => {
        setUser({
            username: result.username,
            role: result.role,
            userId: result.userId
        });
    };
    const handleLogout = () => {
        api.logout();
        setUser(null);
        setCurrentTab('dashboard');
    };
    if (!user) {
        return <LoginForm onLogin={handleLogin}/>;
    }
    return (<div className="min-h-screen bg-mud-black text-mud-green">
            <AdminPanel user={user} currentTab={currentTab} onTabChange={setCurrentTab} onLogout={handleLogout} api={api}/>
        </div>);
}
function AdminPanel({ user, currentTab, onTabChange, onLogout, api }) {
    const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
    const getAvailableTabs = () => {
        const tabs = [
            { id: 'dashboard', label: 'Dashboard', icon: '📊', roles: ['admin', 'moderator'] }
        ];
        if (user.role === 'admin' || user.role === 'moderator') {
            tabs.push({ id: 'users', label: 'Users', icon: '👥', roles: ['admin', 'moderator'] }, { id: 'world', label: 'World', icon: '🌍', roles: ['admin', 'moderator'] }, { id: 'dialogue', label: 'Dialogue', icon: '💬', roles: ['admin', 'moderator'] });
        }
        return tabs;
    };
    const tabs = getAvailableTabs();
    const renderTabContent = () => {
        switch (currentTab) {
            case 'dashboard':
                return <DashboardTab api={api} user={user}/>;
            case 'users':
                return <UsersTab api={api} user={user}/>;
            case 'world':
                return <WorldTab api={api} user={user}/>;
            case 'dialogue':
                return <DialogueTab api={api} user={user}/>;
            default:
                return <DashboardTab api={api} user={user}/>;
        }
    };
    return (<div className="relative min-h-screen">
            
            <header className="bg-mud-dark border-b border-mud-green p-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-mud-green">MUD Admin Panel</h1>
                        <p className="text-sm text-mud-light">Logged in as: {user.username} ({user.role})</p>
                    </div>
                    <button onClick={onLogout} className="bg-red-900 hover:bg-red-700 text-white px-4 py-2 rounded font-bold">
                        Logout
                    </button>
                </div>
            </header>

            
            <nav className="bg-mud-dark border-b border-mud-green">
                <div className="flex space-x-1 p-2">
                    {tabs.map(tab => (<button key={tab.id} onClick={() => onTabChange(tab.id)} className={`flex items-center space-x-2 px-4 py-2 rounded font-bold transition-colors ${currentTab === tab.id
                ? 'bg-mud-green text-mud-black'
                : 'text-mud-green hover:bg-mud-dark'}`}>
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>))}
                </div>
            </nav>

            
            <main className="p-6">
                {renderTabContent()}
            </main>

            
            {user.role === 'admin' && (<button onClick={() => setIsAdminPanelOpen(!isAdminPanelOpen)} className="fixed bottom-6 right-6 w-14 h-14 bg-mud-green text-mud-black rounded-full shadow-lg hover:bg-mud-light transition-colors flex items-center justify-center text-2xl font-bold z-50" title="Admin Settings">
                    ⚙️
                </button>)}

            
            {isAdminPanelOpen && user.role === 'admin' && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-mud-dark border-2 border-mud-green p-6 rounded-lg max-w-md w-full mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-mud-green">Admin Settings</h3>
                            <button onClick={() => setIsAdminPanelOpen(false)} className="text-mud-light hover:text-mud-green">
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
                </div>)}
        </div>);
}
ReactDOM.render(<App />, document.getElementById('root'));
//# sourceMappingURL=App.js.map