import React, {createContext, useState, useEffect, useContext} from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = ()=>{
    return useContext(AuthContext);
}

export const AuthProvider = ({children})=>{
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(()=>{
        const checkAuth = async () => {
            try {
                const res = await axios.get('/me');
                setCurrentUser(res.data.user);
            } catch (err) {
                setCurrentUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    const value = {
        currentUser, setCurrentUser, loading
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
}