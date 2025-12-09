-- Políticas RLS para a tabela profiles
-- Usuários autenticados podem ver todos os perfis
CREATE POLICY "Authenticated users can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- Usuários podem inserir seu próprio perfil
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Políticas RLS para a tabela patients
-- Usuários autenticados podem visualizar todos os pacientes
CREATE POLICY "Authenticated users can view all patients"
ON patients FOR SELECT
TO authenticated
USING (true);

-- Usuários autenticados podem criar pacientes
CREATE POLICY "Authenticated users can create patients"
ON patients FOR INSERT
TO authenticated
WITH CHECK (true);

-- Usuários autenticados podem atualizar pacientes
CREATE POLICY "Authenticated users can update patients"
ON patients FOR UPDATE
TO authenticated
USING (true);

-- Usuários autenticados podem deletar pacientes
CREATE POLICY "Authenticated users can delete patients"
ON patients FOR DELETE
TO authenticated
USING (true);

-- Políticas RLS para a tabela treatments
-- Usuários autenticados podem visualizar todos os tratamentos
CREATE POLICY "Authenticated users can view all treatments"
ON treatments FOR SELECT
TO authenticated
USING (true);

-- Usuários autenticados podem criar tratamentos
CREATE POLICY "Authenticated users can create treatments"
ON treatments FOR INSERT
TO authenticated
WITH CHECK (true);

-- Usuários autenticados podem atualizar tratamentos
CREATE POLICY "Authenticated users can update treatments"
ON treatments FOR UPDATE
TO authenticated
USING (true);

-- Usuários autenticados podem deletar tratamentos
CREATE POLICY "Authenticated users can delete treatments"
ON treatments FOR DELETE
TO authenticated
USING (true);

-- Políticas RLS para a tabela patient_packages
-- Usuários autenticados podem visualizar todos os pacotes
CREATE POLICY "Authenticated users can view all packages"
ON patient_packages FOR SELECT
TO authenticated
USING (true);

-- Usuários autenticados podem criar pacotes
CREATE POLICY "Authenticated users can create packages"
ON patient_packages FOR INSERT
TO authenticated
WITH CHECK (true);

-- Usuários autenticados podem atualizar pacotes
CREATE POLICY "Authenticated users can update packages"
ON patient_packages FOR UPDATE
TO authenticated
USING (true);

-- Usuários autenticados podem deletar pacotes
CREATE POLICY "Authenticated users can delete packages"
ON patient_packages FOR DELETE
TO authenticated
USING (true);

-- Políticas RLS para a tabela applications
-- Usuários autenticados podem visualizar todas as aplicações
CREATE POLICY "Authenticated users can view all applications"
ON applications FOR SELECT
TO authenticated
USING (true);

-- Usuários autenticados podem criar aplicações
CREATE POLICY "Authenticated users can create applications"
ON applications FOR INSERT
TO authenticated
WITH CHECK (true);

-- Usuários autenticados podem atualizar aplicações
CREATE POLICY "Authenticated users can update applications"
ON applications FOR UPDATE
TO authenticated
USING (true);

-- Usuários autenticados podem deletar aplicações
CREATE POLICY "Authenticated users can delete applications"
ON applications FOR DELETE
TO authenticated
USING (true);