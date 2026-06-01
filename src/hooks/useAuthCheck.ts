import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'


import { useAuthStore } from '@/stores'
import { api, ApiResponse } from '@/lib'


export const useAuthCheck = () => {
    const { token, logout } = useAuthStore()
    const navigate = useNavigate()
    
    useEffect(() => {
        const verify_session = async () => {
            if (!token) return;

            try{
                const response = await api.get<ApiResponse>(`/users/refresh-token`);
                console.log(response);
            } catch(error){
                console.error("Error validando la sesión:", error);
                // Limpiamos el store de Zustand (esto también limpia el localStorage)
                logout();
                // Lo mandamos a patadas al login
                navigate('/login');
            }
        }

        verify_session();
    }, [token, logout, navigate]);
} 