-- Tabela para gerenciar os perfis dos usuários da clínica
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT NOT NULL -- 'recepcionista', 'enfermeira', 'gestor'
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Tabela principal para os dados dos pacientes
CREATE TABLE patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  cpf TEXT UNIQUE,
  birth_date DATE,
  contact_info JSONB,
  clinical_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Tabela para o catálogo de serviços/tratamentos oferecidos
CREATE TABLE treatments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'consumivel' (ex: Tirzepatida) ou 'sessoes' (ex: Ferro)
  unit TEXT NOT NULL, -- 'mg', 'UI', ou 'aplicacao'
  price NUMERIC
);

ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;

-- Tabela que representa os pacotes que os pacientes compraram
CREATE TABLE patient_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  treatment_id uuid NOT NULL REFERENCES treatments(id) ON DELETE CASCADE,
  total_amount NUMERIC NOT NULL, -- Quantidade total comprada (ex: 60mg ou 5 sessoes)
  remaining_amount NUMERIC NOT NULL, -- Saldo que será atualizado a cada aplicação
  purchase_date TIMESTAMPTZ DEFAULT now(),
  -- Coluna preparada para a V2, não usar no MVP:
  shared_with uuid[] -- Array de IDs de pacientes dependentes
);

ALTER TABLE patient_packages ENABLE ROW LEVEL SECURITY;

-- Tabela para registrar cada evento de aplicação (nossos eventos)
CREATE TABLE applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  package_id uuid NOT NULL REFERENCES patient_packages(id) ON DELETE CASCADE,
  nurse_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  weight NUMERIC,
  weight_verified BOOLEAN DEFAULT false,
  amount_applied NUMERIC NOT NULL, -- Quanto foi consumido nesta aplicação
  is_external_dispatch BOOLEAN DEFAULT false,
  signature_url TEXT, -- Link para a assinatura no Supabase Storage
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;