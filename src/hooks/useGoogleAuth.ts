import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useGoogleAuth = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);

  const checkConnection = useCallback(async () => {
    setIsCheckingConnection(true);
    try {
      const { data, error } = await supabase
        .from('google_oauth_tokens')
        .select('id')
        .single();
      
      const connected = !!data && !error;
      setIsConnected(connected);
      return connected;
    } catch (error) {
      setIsConnected(false);
      return false;
    } finally {
      setIsCheckingConnection(false);
    }
  }, []);

  // Auto-check connection on mount
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const connectGoogle = useCallback(async () => {
    setIsConnecting(true);
    try {
      const GOOGLE_CLIENT_ID = '349816671114-l4r9sasdker6s7u81lj1seerdeq35m12.apps.googleusercontent.com'; // Replace with your actual Google Client ID
      const redirectUri = `${window.location.origin}/auth/google/callback`;
      
      const scope = 'https://www.googleapis.com/auth/calendar';

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(scope)}&` +
        `access_type=offline&` +
        `prompt=consent`;

      // Store redirect URL for later use
      localStorage.setItem('google_auth_redirect', window.location.pathname);
      
      // Redirect to Google OAuth (required for OAuth flow)
      window.location.assign(authUrl);
    } catch (error) {
      console.error('Error connecting to Google:', error);
      toast.error('Erro ao conectar com Google');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectGoogle = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('google_oauth_tokens')
        .delete()
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      setIsConnected(false);
      toast.success('Conta Google desconectada com sucesso');
    } catch (error) {
      console.error('Error disconnecting Google:', error);
      toast.error('Erro ao desconectar conta Google');
    }
  }, []);

  const handleAuthCallback = useCallback(async (code: string) => {
    try {
      const redirectUri = `${window.location.origin}/auth/google/callback`;
      
      const { data, error } = await supabase.functions.invoke('google-auth', {
        body: { code, redirect_uri: redirectUri }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (data?.success) {
        setIsConnected(true);
        toast.success('Conta Google conectada com sucesso!');
        
        // Redirect back to original page
        const originalPath = localStorage.getItem('google_auth_redirect') || '/dashboard';
        localStorage.removeItem('google_auth_redirect');
        window.location.assign(originalPath);
      } else {
        throw new Error(data?.error || 'Falha na autenticação');
      }
    } catch (error) {
      console.error('Error handling auth callback:', error);
      
      // Better error handling for different error types
      let errorMessage = 'Erro ao processar autenticação Google';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = (error as any).message || JSON.stringify(error);
      }
      
      toast.error(errorMessage);
    }
  }, []);

  return {
    isConnecting,
    isConnected,
    isCheckingConnection,
    connectGoogle,
    disconnectGoogle,
    checkConnection,
    handleAuthCallback
  };
};