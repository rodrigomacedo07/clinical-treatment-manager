# Clinical Treatment Manager – Gestão de Tratamentos de Alta Complexidade

Este projeto é uma plataforma digital de apoio operacional e clínico, desenhada para digitalizar integralmente o fluxo de gestão de tratamentos médicos recorrentes em clínicas privadas. O sistema substitui processos manuais baseados em papel que geram risco operacional, financeiro e clínico.

> **Nota:** Este é um projeto real em produção. Por questões de ética e confidencialidade (NDA), o nome do cliente foi omitido, sendo referido aqui como "Clínica Privada".

---

## 🎯 O Problema (Product Discovery)
Em clínicas que operam com tratamentos de alto valor e múltiplas sessões, o controle manual via fichas gera lacunas críticas. Durante o *Discovery* (baseado em *shadowing* com equipes assistenciais), identificamos:
* **Risco Clínico:** Dependência de memória e anotações manuais para histórico de dosagem e peso.
* **Inconsistência Financeira:** Dificuldade em conciliar o que foi vendido (pacotes) com o que foi executado (sessões/doses).
* **Fricção Operacional:** Retrabalho constante da equipe de recepção e enfermagem para auditar processos físicos.

## 💡 Hipóteses e Validação
* **H1:** Se o status de cada tratamento for rastreável em tempo real, erros de execução e "furos" de faturamento diminuirão drasticamente.
* **H2:** Se a validação clínica (ex: confirmação de peso) for uma etapa bloqueante no sistema, a segurança do paciente aumenta.
* **H3:** A digitalização da assinatura do paciente no momento da aplicação cria um lastro jurídico imediato, sem burocracia.

---

## 🏗️ Arquitetura e Decisões Técnicas
Para suportar uma operação crítica onde a falha não é opção, a arquitetura priorizou **integridade de dados** e **segurança**:

* **Frontend:** Next.js (App Router) com foco em *Mobile-First* para uso em tablets pela enfermagem.
* **Backend & Auth:** Supabase (PostgreSQL) com *Row Level Security (RLS)* para garantir que apenas perfis autorizados (Médico/Enfermeiro) acessem dados sensíveis.
* **Infraestrutura:** Vercel (Serverless Functions) para garantir escalabilidade sem gestão de servidores.

### ⚙️ Governança de Engenharia (Quality Assurance)
Como PM, defini requisitos técnicos rigorosos para garantir a estabilidade:
* **Integridade Transacional:** Operações financeiras e de consumo de saldo são atômicas — ou tudo é salvo com sucesso, ou a operação é revertida.
* **Soft Delete:** Nenhum dado clínico ou financeiro é deletado fisicamente. Registros são apenas inativados para manter a rastreabilidade eterna (Audit Trail).
* **Validação Dupla:** Regras críticas (como cálculo de dose máxima) são validadas no Frontend (UX) e revalidadas no Backend (Segurança).

---

## 📊 Regras de Negócio Implementadas
O sistema gerencia o ciclo de vida completo do tratamento:

1.  **Venda & Saldo:** O paciente adquire um pacote (ex: 10 sessões ou 500mg de medicação). O sistema cria uma "conta corrente" do tratamento.
2.  **Check-in & Fila:** Recepção realiza check-in e o paciente entra numa fila virtual *Realtime* (WebSockets), visível para a enfermagem.
3.  **Execução Segura:**
    * A aplicação só é liberada após **confirmação de peso** pela enfermagem.
    * O sistema abate o consumo do saldo automaticamente.
4.  **Assinatura & Checkout:** O atendimento só é encerrado após assinatura digital do paciente e conciliação financeira de eventuais extras (serviços avulsos).

---

## 💰 Estudo de ROI (Retorno sobre Investimento)
A viabilidade do produto foi sustentada por um racional econômico focado na redução de perdas invisíveis:
* **Recuperação de Receita:** Eliminação de aplicações não faturadas por falha de registro manual.
* **Eficiência Operacional:** Redução de 30% no tempo administrativo gasto com conferência de fichas e auditoria.
* **Mitigação de Risco:** A rastreabilidade digital reduz a exposição jurídica da clínica em casos de contestação de tratamento.

---

## 🚀 Status e Acesso
O projeto reflete a atuação de Product Management aplicada a um ambiente sensível e operacionalmente complexo.

* **Ambiente de Demonstração:** [Link para seu Vercel Renomeado]
* **GitHub:** [Link para seu Repo Renomeado]

---

### 🤝 Contato
Este case demonstra minha capacidade de liderar produtos digitais que resolvem problemas reais de negócio com rigor técnico.

* **GitHub:** [rodrigomacedo07](https://github.com/rodrigomacedo07)
* **Portfolio:** https://portfolio-rm7.lovable.app/case/gestao-tratamentos
