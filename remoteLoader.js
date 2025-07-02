/*Script de carregamento remoto e instantâneo de qualquer script*/
(function() {
    'use strict';

    if (typeof mw === 'undefined') {
        setTimeout(arguments.callee, 100);
        return;
    }

    const popupCSS = `
        .script-loader-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10000;
            display: none;
        }

        .script-loader-popup {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #f8f9fa;
            border: 1px solid #a2a9b1;
            border-radius: 2px;
            width: 80%;
            max-width: 800px;
            max-height: 80%;
            overflow-y: auto;
            z-index: 10001;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }

        .script-loader-header {
            background: #eaecf0;
            padding: 15px 20px;
            border-bottom: 1px solid #a2a9b1;
            font-weight: bold;
            position: relative;
        }

        .script-loader-close {
            position: absolute;
            right: 15px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            color: #72777d;
        }

        .script-loader-content {
            padding: 20px;
        }

        .script-loader-input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #a2a9b1;
            border-radius: 2px;
            margin-bottom: 15px;
            font-family: monospace;
        }

        .script-loader-buttons {
            margin-bottom: 15px;
        }

        .script-loader-button {
            background: #0645ad;
            color: white;
            border: none;
            padding: 8px 16px;
            margin-right: 10px;
            border-radius: 2px;
            cursor: pointer;
        }

        .script-loader-button:hover {
            background: #0b0080;
        }

        .script-loader-button:disabled {
            background: #a2a9b1;
            cursor: not-allowed;
        }

        .script-loader-preview {
            border: 1px solid #a2a9b1;
            background: #f8f9fa;
            padding: 15px;
            border-radius: 2px;
            max-height: 300px;
            overflow-y: auto;
            white-space: pre-wrap;
            font-family: monospace;
            font-size: 12px;
            line-height: 1.4;
        }

        .script-loader-status {
            margin: 10px 0;
            padding: 8px 12px;
            border-radius: 2px;
        }

        .status-success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }

        .status-error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }

        .status-info {
            background: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }
    `;

    const style = document.createElement('style');
    style.textContent = popupCSS;
    document.head.appendChild(style);

    const popupHTML = `
        <div class="script-loader-overlay" id="scriptLoaderOverlay">
            <div class="script-loader-popup">
                <div class="script-loader-header">
                    Carregador de Scripts
                    <button class="script-loader-close" id="scriptLoaderClose">×</button>
                </div>
                <div class="script-loader-content">
                    <div>
                        <label for="scriptUrl">URL do Script:</label>
                        <input type="text" class="script-loader-input" id="scriptUrl" 
                               placeholder="Ex: User:SeuNome/script.js ou https://pt.wikipedia.org/w/index.php?title=User:Nome/script.js&action=raw">
                    </div>

                    <div class="script-loader-buttons">
                        <button class="script-loader-button" id="previewButton">Preview</button>
                        <button class="script-loader-button" id="loadButton" disabled>Carregar Script</button>
                    </div>

                    <div id="statusDiv"></div>

                    <div id="previewDiv" style="display: none;">
                        <h4>Preview do Script:</h4>
                        <div class="script-loader-preview" id="previewContent"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', popupHTML);

    const overlay = document.getElementById('scriptLoaderOverlay');
    const closeBtn = document.getElementById('scriptLoaderClose');
    const urlInput = document.getElementById('scriptUrl');
    const previewBtn = document.getElementById('previewButton');
    const loadBtn = document.getElementById('loadButton');
    const statusDiv = document.getElementById('statusDiv');
    const previewDiv = document.getElementById('previewDiv');
    const previewContent = document.getElementById('previewContent');

    let currentScriptContent = '';
    let currentScriptUrl = '';

    function showStatus(message, type = 'info') {
        statusDiv.innerHTML = `<div class="script-loader-status status-${type}">${message}</div>`;
    }

    function isLocalScript(url) {
        const currentHost = window.location.hostname;
        const currentProject = currentHost.split('.')[0]; 

        if (!url.includes('://')) {
            return true;
        }

        try {
            const urlObj = new URL(url);
            return urlObj.hostname === currentHost;
        } catch {
            return false;
        }
    }

    function normalizeScriptUrl(url) {
        if (!url.includes('://')) {

            if (!url.startsWith('User:') && !url.startsWith('MediaWiki:')) {
                return url;
            }

            const baseUrl = window.location.origin + '/w/index.php';
            return `${baseUrl}?title=${encodeURIComponent(url)}&action=raw`;
        }

        if (url.includes('index.php') && !url.includes('action=raw')) {
            return url + (url.includes('?') ? '&' : '?') + 'action=raw';
        }

        return url;
    }

    async function previewScript() {
        const url = urlInput.value.trim();
        if (!url) {
            showStatus('Digite uma URL válida', 'error');
            return;
        }

        showStatus('Carregando preview...', 'info');
        previewBtn.disabled = true;

        try {
            const normalizedUrl = normalizeScriptUrl(url);
            currentScriptUrl = normalizedUrl;

            const response = await fetch(normalizedUrl);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const scriptContent = await response.text();
            currentScriptContent = scriptContent;

            previewContent.textContent = scriptContent.substring(0, 2000) + 
                (scriptContent.length > 2000 ? '\n\n... (preview truncado)' : '');
            previewDiv.style.display = 'block';

            loadBtn.disabled = false;
            showStatus(`Script carregado (${scriptContent.length} caracteres). Clique em "Carregar Script" para executar.`, 'success');

        } catch (error) {
            showStatus(`Erro ao carregar script: ${error.message}`, 'error');
            previewDiv.style.display = 'none';
            loadBtn.disabled = true;
        } finally {
            previewBtn.disabled = false;
        }
    }

    function loadScript() {
        if (!currentScriptContent) {
            showStatus('Faça o preview primeiro', 'error');
            return;
        }

        try {
            const url = urlInput.value.trim();
            const isLocal = isLocalScript(url);

            if (isLocal) {

                if (typeof importScript !== 'undefined') {
                    showStatus('Carregando script local com importScript...', 'info');
                    if (url.includes('://')) {

                        const script = document.createElement('script');
                        script.textContent = currentScriptContent;
                        document.head.appendChild(script);
                    } else {

                        importScript(url);
                    }
                } else {

                    const script = document.createElement('script');
                    script.textContent = currentScriptContent;
                    document.head.appendChild(script);
                }
            } else {

                showStatus('Carregando script externo com mw.loader.load...', 'info');
                mw.loader.load(currentScriptUrl);
            }

            showStatus('Script carregado com sucesso!', 'success');

            setTimeout(() => {
                overlay.style.display = 'none';
            }, 2000);

        } catch (error) {
            showStatus(`Erro ao carregar script: ${error.message}`, 'error');
        }
    }

    closeBtn.addEventListener('click', () => {
        overlay.style.display = 'none';
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.style.display = 'none';
        }
    });

    previewBtn.addEventListener('click', previewScript);
    loadBtn.addEventListener('click', loadScript);

    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            previewScript();
        }
    });

    function showScriptLoader() {
        overlay.style.display = 'block';
        urlInput.focus();
    }

    mw.util.addPortletLink(
        'p-tb',
        '#',
        'Carregar Script',
        't-script-loader',
        'Carrega scripts externos dinamicamente'
    );

    document.getElementById('t-script-loader').addEventListener('click', (e) => {
        e.preventDefault();
        showScriptLoader();
    });

    console.log('Wikipedia Script Loader carregado com sucesso!');
})();
