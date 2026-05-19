/**
 * Antigravity Chat Auto-Retry Extension
 * 
 * Descrizione: Rileva gli errori di chat e preme in automatico "Retry" / "Riprova".
 * Sicurezza: Max 3 tentativi consecutivi, 5s di cooldown, stato persistito in localStorage,
 *            pannello grafico integrato nell'interfaccia.
 */

(function () {
    // Configurazione e Stato Globale
    const CONFIG = {
        maxRetries: 3,
        cooldownMs: 5000,
        errorWords: ['error', 'errore', 'failed', 'fallito', 'connessione', 'network', 'offline', 'interrotto', 'rate limit', 'limit reached', 'stop due to'],
        retryWords: ['retry', 'riprova', 'try again', 'recommencer', 'retry again', 'ricomincia']
    };

    let state = {
        isEnabled: localStorage.getItem('agy-auto-retry-enabled') !== 'false', // Default true
        retryCount: 0,
        lastRetryTime: 0,
        cooldownActive: false
    };

    // Riferimenti UI
    let badgeEl = null;
    let badgeDotEl = null;
    let badgeTextEl = null;
    let badgeBtnEl = null;

    // Inizializzazione
    function init() {
        console.log('[Antigravity Auto-Retry] Estensione inizializzata con successo.');
        
        // Creazione dell'interfaccia grafica fluttuante (Badge UI)
        createUI();
        
        // Configurazione del MutationObserver per monitorare il DOM in tempo reale
        const observer = new MutationObserver(handleDOMMutations);
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Eseguiamo un controllo iniziale immediato
        checkAndTriggerRetry();
    }

    // Gestione dei cambiamenti nel DOM
    function handleDOMMutations(mutations) {
        if (!state.isEnabled || state.cooldownActive) return;
        
        // Evitiamo controlli continui: analizziamo solo se ci sono nuovi nodi aggiunti
        let hasNewElements = false;
        for (const mutation of mutations) {
            if (mutation.addedNodes.length > 0) {
                hasNewElements = true;
                break;
            }
        }

        if (hasNewElements) {
            checkAndTriggerRetry();
        }
    }

    // Scansione e attivazione del Retry
    function checkAndTriggerRetry() {
        if (!state.isEnabled) return;
        if (state.retryCount >= CONFIG.maxRetries) {
            updateUI('error_limit');
            return;
        }

        const now = Date.now();
        if (now - state.lastRetryTime < CONFIG.cooldownMs) {
            return; // In cooldown
        }

        // 1. Verifichiamo se siamo in uno stato di errore
        if (!detectErrorState()) {
            // Se non c'è errore e l'ultimo messaggio è andato a buon fine, resettiamo il contatore dei tentativi
            if (state.retryCount > 0 && !document.querySelector('.error, [class*="error-container"]')) {
                state.retryCount = 0;
                updateUI('active');
            }
            return;
        }

        // 2. Cerchiamo il pulsante Retry
        const retryButton = findRetryButton();
        if (retryButton) {
            triggerRetry(retryButton);
        }
    }

    // Rileva se è visibile un messaggio di errore
    function detectErrorState() {
        // Cerca elementi con classi tipiche degli errori
        const errorElements = document.querySelectorAll('.error, .failed, .agent-error, [class*="error-container"], [class*="message-error"]');
        for (const el of errorElements) {
            if (el.getBoundingClientRect().height > 0) {
                return true; // Errore visibile nel DOM
            }
        }

        // Cerca parole chiave di errore nel testo degli ultimi blocchi di messaggi
        const chatBlocks = document.querySelectorAll('.chat-container, .agent-panel, .messages, [class*="chat"], [class*="agent"], [class*="message"]');
        if (chatBlocks.length > 0) {
            const lastBlock = chatBlocks[chatBlocks.length - 1];
            const text = (lastBlock.innerText || lastBlock.textContent || '').toLowerCase();
            for (const word of CONFIG.errorWords) {
                if (text.includes(word)) {
                    return true;
                }
            }
        }

        return false;
    }

    // Ricerca robusta del pulsante "Retry"
    function findRetryButton() {
        const elements = Array.from(document.querySelectorAll('button, [role="button"], a, .retry-button, .retry'));
        
        for (const el of elements) {
            // Verifica visibilità dell'elemento
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) continue;

            // 1. Controllo testo interno
            const text = (el.innerText || el.textContent || '').trim().toLowerCase();
            for (const word of CONFIG.retryWords) {
                if (text === word || text.includes(word)) {
                    return el;
                }
            }

            // 2. Controllo attributi ARIA e Tooltip
            const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
            const title = (el.getAttribute('title') || '').toLowerCase();
            for (const word of CONFIG.retryWords) {
                if (ariaLabel.includes(word) || title.includes(word)) {
                    return el;
                }
            }
        }

        // 3. Controllo icone SVG (se è un pulsante solo icona)
        const svgs = Array.from(document.querySelectorAll('svg'));
        for (const svg of svgs) {
            const button = svg.closest('button, [role="button"]');
            if (!button) continue;
            
            const rect = button.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) continue;

            const ariaLabel = (button.getAttribute('aria-label') || '').toLowerCase();
            const title = (button.getAttribute('title') || '').toLowerCase();
            
            if (ariaLabel.includes('retry') || ariaLabel.includes('riprova') || ariaLabel.includes('refresh') || ariaLabel.includes('reload') ||
                title.includes('retry') || title.includes('riprova') || title.includes('refresh') || title.includes('reload')) {
                return button;
            }

            // Controllo tracciato SVG per icone di ricarica (frecce circolari)
            const paths = Array.from(svg.querySelectorAll('path'));
            for (const path of paths) {
                const d = path.getAttribute('d') || '';
                // Riconoscimento geometrico elementare di archi di ricarica
                if (d.includes('A') || d.includes('a') || d.includes('M22 12c0-5.5') || d.includes('M12 4V1L8 5')) {
                    return button;
                }
            }
        }

        return null;
    }

    // Clicca il pulsante e imposta lo stato di cooldown
    function triggerRetry(button) {
        state.retryCount++;
        state.lastRetryTime = Date.now();
        state.cooldownActive = true;
        
        console.warn(`[Antigravity Auto-Retry] Rilevato errore. Clicco Retry (Tentativo ${state.retryCount}/${CONFIG.maxRetries}).`);
        updateUI('retrying');

        // Effettua il clic programmatico
        button.click();

        // Avvia il cooldown per prevenire clic consecutivi immediati
        setTimeout(() => {
            state.cooldownActive = false;
            if (state.isEnabled) {
                if (state.retryCount >= CONFIG.maxRetries) {
                    updateUI('error_limit');
                } else {
                    updateUI('active');
                }
            }
        }, CONFIG.cooldownMs);
    }

    // Creazione del pannello grafico (Floating Glass Badge)
    function createUI() {
        const style = document.createElement('style');
        style.textContent = `
            .agy-auto-retry-badge {
                position: fixed;
                bottom: 12px;
                right: 12px;
                z-index: 999999;
                background: rgba(30, 30, 30, 0.75);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 8px;
                padding: 6px 10px;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                font-size: 11px;
                color: #e2e8f0;
                display: flex;
                align-items: center;
                gap: 8px;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                user-select: none;
            }
            .agy-auto-retry-badge:hover {
                background: rgba(40, 40, 40, 0.85);
                border-color: rgba(255, 255, 255, 0.2);
            }
            .agy-auto-retry-dot {
                width: 7px;
                height: 7px;
                border-radius: 50%;
                background: #10b981;
                box-shadow: 0 0 8px #10b981;
                transition: all 0.3s ease;
            }
            .agy-auto-retry-dot.active {
                background: #10b981;
                box-shadow: 0 0 8px #10b981;
                animation: agy-pulse 2s infinite;
            }
            .agy-auto-retry-dot.retrying {
                background: #f59e0b;
                box-shadow: 0 0 8px #f59e0b;
                animation: agy-pulse-fast 0.5s infinite;
            }
            .agy-auto-retry-dot.disabled {
                background: #64748b;
                box-shadow: none;
                animation: none;
            }
            .agy-auto-retry-dot.error {
                background: #ef4444;
                box-shadow: 0 0 8px #ef4444;
                animation: none;
            }
            .agy-auto-retry-btn {
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 4px;
                color: #f8fafc;
                padding: 2px 6px;
                cursor: pointer;
                font-size: 10px;
                font-weight: 500;
                transition: all 0.2s ease;
            }
            .agy-auto-retry-btn:hover {
                background: rgba(255, 255, 255, 0.2);
                border-color: rgba(255, 255, 255, 0.3);
            }
            @keyframes agy-pulse {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.2); opacity: 0.6; }
                100% { transform: scale(1); opacity: 1; }
            }
            @keyframes agy-pulse-fast {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.3); opacity: 0.4; }
                100% { transform: scale(1); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        badgeEl = document.createElement('div');
        badgeEl.className = 'agy-auto-retry-badge';

        badgeDotEl = document.createElement('div');
        badgeDotEl.className = 'agy-auto-retry-dot active';

        badgeTextEl = document.createElement('span');
        badgeTextEl.textContent = 'Auto-Retry: Attivo';

        badgeBtnEl = document.createElement('button');
        badgeBtnEl.className = 'agy-auto-retry-btn';
        badgeBtnEl.textContent = 'Disattiva';
        badgeBtnEl.addEventListener('click', toggleState);

        badgeEl.appendChild(badgeDotEl);
        badgeEl.appendChild(badgeTextEl);
        badgeEl.appendChild(badgeBtnEl);
        document.body.appendChild(badgeEl);

        // Aggiorniamo l'interfaccia in base allo stato attuale
        updateUI(state.isEnabled ? 'active' : 'disabled');
    }

    // Attiva/Disattiva l'estensione da pulsante
    function toggleState() {
        state.isEnabled = !state.isEnabled;
        localStorage.setItem('agy-auto-retry-enabled', state.isEnabled);
        
        if (state.isEnabled) {
            state.retryCount = 0;
            updateUI('active');
            checkAndTriggerRetry();
        } else {
            updateUI('disabled');
        }
    }

    // Aggiorna lo stato visivo della UI
    function updateUI(status) {
        if (!badgeEl) return;

        // Rimuoviamo tutte le sottoclassi del dot
        badgeDotEl.className = 'agy-auto-retry-dot';

        switch (status) {
            case 'active':
                badgeDotEl.classList.add('active');
                badgeTextEl.textContent = state.retryCount > 0 
                    ? `Auto-Retry: Attivo (${state.retryCount}/${CONFIG.maxRetries})` 
                    : 'Auto-Retry: Attivo';
                badgeBtnEl.textContent = 'Disattiva';
                break;
            case 'retrying':
                badgeDotEl.classList.add('retrying');
                badgeTextEl.textContent = `Riprovo... (Tentativo ${state.retryCount}/${CONFIG.maxRetries})`;
                badgeBtnEl.textContent = 'Pausa';
                break;
            case 'disabled':
                badgeDotEl.classList.add('disabled');
                badgeTextEl.textContent = 'Auto-Retry: Disattivato';
                badgeBtnEl.textContent = 'Attiva';
                break;
            case 'error_limit':
                badgeDotEl.classList.add('error');
                badgeTextEl.textContent = 'Auto-Retry: Bloccato (Troppi Errori)';
                badgeBtnEl.textContent = 'Reset';
                break;
        }
    }

    // Avviamo lo script al caricamento del DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
