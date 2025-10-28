
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, User } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (nome: string, email: string, senha: string) => Promise<void>;
  signIn: (email: string, senha: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Funções auxiliares para lidar com localStorage de forma segura
const safeSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn('⚠️ localStorage não disponível, usando sessionStorage');
    try {
      sessionStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.error('❌ Erro ao salvar dados:', e);
      return false;
    }
  }
};

const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    try {
      return sessionStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }
};

const safeRemoveItem = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    try {
      sessionStorage.removeItem(key);
    } catch (e) {
      console.error('❌ Erro ao remover dados:', e);
    }
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      setLoading(true);
      const authUser = safeGetItem('financemei_user');
      
      if (authUser) {
        const userData = JSON.parse(authUser);
        
        // Verificar se o Supabase está configurado
        if (!supabase) {
          console.error('❌ Supabase não configurado');
          setUser(null);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('users_app')
          .select('*')
          .eq('email', userData.email)
          .eq('senha', userData.senha)
          .maybeSingle();

        if (data && !error) {
          setUser(data);
        } else {
          // Se houver erro, limpar dados salvos
          console.warn('⚠️ Usuário não encontrado ou erro na consulta:', error);
          safeRemoveItem('financemei_user');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Erro ao verificar usuário:', error);
      safeRemoveItem('financemei_user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (nome: string, email: string, senha: string) => {
    try {
      setLoading(true);
      
      // Verificar se o Supabase está configurado
      if (!supabase) {
        throw new Error('Erro de configuração. Tente novamente mais tarde.');
      }

      // Verificar se email já existe
      const { data: existingUser, error: checkError } = await supabase
        .from('users_app')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Erro ao verificar email:', checkError);
        throw new Error('Erro ao verificar email. Tente novamente.');
      }

      if (existingUser) {
        throw new Error('Este email já está cadastrado');
      }

      // Calcular data de expiração do trial (2 dias)
      const now = new Date();
      const trialExpiration = new Date();
      trialExpiration.setDate(trialExpiration.getDate() + 2);

      // Criar registro na tabela users_app
      const { data: newUser, error: userError } = await supabase
        .from('users_app')
        .insert({
          nome,
          email,
          senha,
          trial_inicio: now.toISOString(),
          trial_expira_em: trialExpiration.toISOString(),
          status_assinatura: 'trial',
          created_at: now.toISOString(),
          updated_at: now.toISOString()
        })
        .select()
        .single();

      if (userError) {
        console.error('❌ Erro ao criar usuário:', userError);
        
        if (userError.code === '23505') {
          throw new Error('Este email já está cadastrado');
        }
        
        if (userError.message.includes('permission denied') || userError.message.includes('RLS')) {
          throw new Error('Erro de permissão. Entre em contato com o suporte.');
        }
        
        throw new Error('Erro ao criar conta. Tente novamente.');
      }

      if (newUser) {
        setUser(newUser);
        safeSetItem('financemei_user', JSON.stringify({ email, senha }));
      } else {
        throw new Error('Erro ao criar conta. Nenhum dado retornado.');
      }
    } catch (error: any) {
      console.error('❌ Erro no cadastro:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, senha: string) => {
    try {
      setLoading(true);
      
      // Verificar se o Supabase está configurado
      if (!supabase) {
        throw new Error('Erro de configuração. Tente novamente mais tarde.');
      }

      const { data, error } = await supabase
        .from('users_app')
        .select('*')
        .eq('email', email)
        .eq('senha', senha)
        .maybeSingle();

      if (error) {
        console.error('❌ Erro no login:', error);
        
        if (error.code === 'PGRST116') {
          throw new Error('Email ou senha inválidos');
        }
        
        throw new Error('Erro ao fazer login. Verifique sua conexão.');
      }

      if (!data) {
        throw new Error('Email ou senha inválidos');
      }

      safeSetItem('financemei_user', JSON.stringify({ email, senha }));
      setUser(data);
    } catch (error: any) {
      console.error('❌ Erro no login:', error);
      
      if (error.message.includes('Email ou senha inválidos')) {
        throw error;
      }
      
      throw new Error('Email ou senha inválidos');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      safeRemoveItem('financemei_user');
      setUser(null);
    } catch (error) {
      console.error('❌ Erro ao fazer logout:', error);
    }
  };

  const updateUser = async () => {
    if (user && supabase) {
      try {
        const { data } = await supabase
          .from('users_app')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (data) {
          setUser(data);
        }
      } catch (error) {
        console.error('❌ Erro ao atualizar usuário:', error);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}
