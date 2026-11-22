# 🌺🌊 Convite Digital do 4º Aniversário da Micaella — Tema Moana

Convite digital cinematográfico e interativo da **Micaella (4 Anos)**, com o pôster oficial da **Moana** como tema de fundo, trilha sonora imersiva, galeria com as **10 fotos reais da Micaella**, contagem regressiva, confirmação de presença (RSVP) com contagem de adultos/crianças e painel administrativo com exportação para Excel.

---

## 📸 Recursos e Destaques

- **Tema de Fundo:** Pôster Oficial da Moana com Maui, Pua, Heihei e a onda mágica.
- **Abertura Cinematográfica:** Vinheta com partículas animadas, luzes volumétricas e botão *"ENTRAR NA EXPERIÊNCIA"*.
- **Foto da Aniversariante:** Moldura tropical com a foto oficial da Micaella e onda mágica ao tocar para tocar a música.
- **Trilha Sonora da Moana:** Player de áudio com equalizador animado e streaming contínuo.
- **Contagem Regressiva:** Dias, horas, minutos e segundos até 19 de Dezembro de 2026.
- **Localização e Rotas:** Botões com rota direta para **Google Maps** e **Waze** (`Rua Ouro Velho, 116`).
- **Recursos Rápidos:** Adicionar ao Calendário (Google/Apple), Compartilhar no WhatsApp e QR Code.
- **Galeria com 10 Fotos:** Todas as fotos reais da Micaella com ampliação em alta resolução (Lightbox).
- **RSVP Completo:** Confirmação de adultos e crianças, acompanhantes, recado especial e chuva de confetes.
- **Painel Administrativo:**
  - Login seguro (`Micaella2022`).
  - Total de convidados, adultos e crianças.
  - Exportação da lista para Excel / CSV em 1 clique.
  - Editor das informações da festa.

---

## 💻 Testando Localmente no Computador

1. Dê um duplo clique no arquivo:
   ```text
   iniciar_servidor.bat
   ```
   *(Ou abra o terminal nesta pasta e execute: `node server.js`)*

2. Acesse no navegador:
   - **Convite:** [http://localhost:3000](http://localhost:3000)
   - **Painel:** [http://localhost:3000/admin.html](http://localhost:3000/admin.html) *(Senha: `Micaella2022`)*

---

## 🚀 Como Subir para o GitHub e Render

### Passo 1: Subir para o GitHub

1. Abra o terminal nesta pasta (`convite-micaella-moana`):
   ```bash
   git init
   git add .
   git commit -m "Convite Cinematografico Micaella 4 Anos - Moana"
   git branch -M main
   ```

2. Crie um repositório no seu GitHub (exemplo: `convite-micaella-moana`).

3. Conecte e envie os arquivos:
   ```bash
   git remote add origin https://github.com/SEU_USUARIO/convite-micaella-moana.git
   git push -u origin main
   ```

---

### Passo 2: Publicar Gratuitamente no Render

1. Acesse **[render.com](https://render.com/)** e faça login.
2. Clique no botão **"New +"** no topo e selecione **"Web Service"**.
3. Escolha **"Build and deploy from a Git repository"** e selecione o repositório `convite-micaella-moana` que você acabou de enviar para o GitHub.
4. Preencha as configurações:
   - **Name:** `convite-micaella` *(ou o nome que preferir)*
   - **Language / Runtime:** `Node`
   - **Build Command:** Deixe em branco *(ou `npm install`)*
   - **Start Command:** `node server.js`
   - **Instance Type:** `Free`
5. Clique em **"Deploy Web Service"**.
6. Em cerca de 1 minuto, o Render vai gerar o link público com HTTPS (ex: `https://convite-micaella.onrender.com`), pronto para enviar aos convidados no WhatsApp!
