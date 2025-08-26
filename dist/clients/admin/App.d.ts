declare function LoginForm({ onLogin }: {
    onLogin: any;
}): any;
declare function App(): any;
declare function AdminPanel({ user, currentTab, onTabChange, onLogout, api }: {
    user: any;
    currentTab: any;
    onTabChange: any;
    onLogout: any;
    api: any;
}): any;
declare const useState: any;
declare const useEffect: any;
declare class ApiService {
    baseURL: string;
    token: string;
    user: any;
    headers(): {
        'Content-Type': string;
        Authorization: string;
    };
    login(credentials: any): Promise<any>;
    logout(): Promise<void>;
    get(endpoint: any): Promise<any>;
    post(endpoint: any, data: any): Promise<any>;
    put(endpoint: any, data: any): Promise<any>;
    delete(endpoint: any): Promise<any>;
}
declare const api: ApiService;
