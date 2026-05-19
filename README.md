# Antigravity Auto-Retry Extension 🔄

Estensione leggera ad iniezione diretta per **Antigravity IDE**. Clicca automaticamente il tasto **"Retry"** / **"Riprova"** quando la chat con l'agente AI termina a causa di un errore.

---

## ✨ Funzionalità Premium incluse

1. **Rilevamento in Tempo Reale**: Usa un `MutationObserver` ad alta efficienza che monitora il DOM solo al verificarsi di mutamenti fisici, riducendo a zero il consumo di CPU.
2. **Scansione Semantica**: Riconosce il tasto di Retry tramite parole chiave multilingue ("Retry", "Riprova", "Try Again"), attributi ARIA e forme geometriche delle icone SVG (frecce circolari).
3. **Floating Glass Dashboard**: Aggiunge un elegantissimo badge in vetro sfocato in basso a destra dello schermo per monitorare lo stato in tempo reale.
4. **Interruttore On/Off Rapido**: Puoi disattivare temporaneamente l'estensione cliccando su "Disattiva" direttamente dalla UI, senza rimuoverla o riavviare l'IDE. Lo stato viene persistito in `localStorage`.
5. **Anti-Loop Safety Controller**: Impedisce clic infiniti limitando l'auto-retry a un massimo di **3 tentativi consecutivi**, per poi mettersi in pausa se l'errore persiste. Si sblocca digitando un nuovo messaggio o cliccando su "Reset".

---

## 🛠️ Come Installarla (Iniezione)

L'installazione è completamente automatizzata ed esegue backup preventivi.

1. Apri una finestra di **PowerShell** come utente corrente.
2. Naviga nella cartella di questo progetto:
   ```powershell
   cd c:\Users\Utente\Antigravity-auto-retry
   ```
3. Esegui lo script di installazione:
   ```powershell
   .\inject.ps1
   ```
   *Nota: Lo script chiuderà automaticamente Antigravity per rilasciare i file lockati, effettuerà i backup, inietterà il tag script e riavvierà l'IDE.*

---

## 🎮 Come Usarla e Controllarla

All'avvio di Antigravity, noterai un piccolo badge fluttuante nell'angolo in basso a destra:

* **🟢 Auto-Retry: Attivo**: L'estensione è in ascolto. Se la chat genera un errore, premerà il tasto Retry per te dopo un tempo di cooldown di 5 secondi.
* **🟡 Riprovo... (Tentativo X/3)**: L'estensione ha rilevato un errore ed sta riprovando. Il pallino pulsa rapidamente.
* **🔴 Bloccato (Troppi Errori)**: Raggiunto il limite di 3 errori consecutivi. L'estensione si mette in pausa per non sprecare i tuoi crediti API. Clicca su **"Reset"** per ripristinarla.
* **⚫ Disattivato**: Hai spento manualmente l'estensione cliccando su **"Disattiva"**. Rimarrà spenta anche se riavvii l'IDE, finché non clicchi su **"Attiva"**.

---

## 🗑️ Come Toglierla o Stopparla (Disinstallazione)

Se decidi che non desideri più utilizzare l'auto-retry, puoi rimuoverlo in modo pulito e immediato.

1. Apri **PowerShell** nella cartella del progetto:
   ```powershell
   cd c:\Users\Utente\Antigravity-auto-retry
   ```
2. Esegui lo script di ripristino:
   ```powershell
   .\restore.ps1
   ```
   *Nota: Lo script chiuderà l'IDE, ripristinerà i file HTML originali dai file di backup `.bak`, eliminerà il file `auto-retry.js` dall'installazione e riavvierà Antigravity perfettamente pulito.*

---

## 📁 Struttura del Progetto

* `auto-retry.js`: Lo script JavaScript iniettato nell'IDE.
* `inject.ps1`: Script PowerShell di iniezione, installazione automatica e backup.
* `restore.ps1`: Script PowerShell di ripristino ed eliminazione sicura.
* `implementation_plan.md`: Il piano di implementazione dettagliato con l'analisi architetturale dell'applicazione.
