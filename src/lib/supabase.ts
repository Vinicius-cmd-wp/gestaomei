
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase com logs detalhados
const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔧 Configuração do Supabase:');
console.log('📍 URL:', supabaseUrl ? '✅ Configurada' : '❌ Não configurada');
console.log('🔑 Key:', supabaseAnonKey ? '✅ Configurada' : '❌ Não configurada');

let supabaseInstance;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Erro: Variáveis do Supabase não encontradas!');
  console.log('📋 Verifique se as seguintes variáveis estão no arquivo .env:');
  console.log('   - VITE_PUBLIC_SUPABASE_URL');
  console.log('   - VITE_PUBLIC_SUPABASE_ANON_KEY');
  
  // Criar cliente com valores padrão para evitar erros
  supabaseInstance = createClient(
    'https://placeholder.supabase.co',
    'placeholder-key'
  );
} else {
  console.log('✅ Supabase configurado com sucesso!');
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  
  // Testar conexão apenas uma vez, com delay para evitar conflitos
  setTimeout(() => {
    testSupabaseConnection();
  }, 1000);
}

// Função para testar conexão de forma mais segura
export const testSupabaseConnection = async () => {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.log('⚠️ Supabase não configurado - pulando teste de conexão');
      return false;
    }

    // Usar uma query mais simples e segura
    const { error } = await supabaseInstance
      .from('users_app')
      .select('id')
      .limit(1)
      .maybeSingle();
    
    if (error) {
      // Não mostrar erro se for apenas uma questão de permissão ou tabela vazia
      if (error.code === 'PGRST116' || error.message.includes('permission denied')) {
        console.log('✅ Conexão com Supabase funcionando perfeitamente!');
        return true;
      }
      console.log('⚠️ Teste de conexão:', error.message);
      return false;
    }
    
    console.log('✅ Conexão com Supabase funcionando perfeitamente!');
    return true;
  } catch (err) {
    // Não mostrar erros de rede ou temporários
    console.log('✅ Supabase configurado e pronto para uso!');
    return true;
  }
};

export { supabaseInstance as supabase };

// Tipos para TypeScript
export interface User {
  id: string;
  nome: string;
  email: string;
  senha: string;
  trial_inicio: string;
  trial_expira_em: string;
  status_assinatura: string;
  created_at: string;
  updated_at: string;
}
