import { createClient } from '@supabase/supabase-js';

// Estas são as "chaves" do seu banco de dados.
// O ideal é que elas fiquem em variáveis de ambiente,
// mas para começar e depurar, vamos colocá-las diretamente aqui.

const supabaseUrl = "https://zhnckkciychaxukuukyn.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpobmNra2NpeWNoYXh1a3V1a3luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxOTYxNTIsImV4cCI6MjA3Nzc3MjE1Mn0.7m0Y9z94VXL_uTMX7fgeDJR-LpgZFBbaJTa64vXTNJo";


// Aqui nós criamos a conexão.
// A palavra "export" é o que permite que outros arquivos usem esta variável.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);