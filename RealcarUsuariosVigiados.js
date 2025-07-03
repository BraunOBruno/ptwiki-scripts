/** RealçarUsuáriosVigiadosNasMRs.js
 *  Author: [[:pt:User:BraunOBruno]]
 *
 *  Este script realça nas mudanças recentes usuários vigiados através do gadget de vigiar contribuições.
 *  Versão com atualização em tempo real da lista de usuários vigiados.
 *
 *  Para instalar, insira o seguinte código em [[Especial:Minha página/common.js|sua common.js]]:

importScript('Usuário:BraunOBruno/Scripts/RealçarUsuáriosVigiadosNasMRs.js') // Link de retorno: [[Usuário:BraunOBruno/Scripts/RealçarUsuáriosVigiadosNasMRs.js]]
 *
 * Este script requer que [[Especial:Preferências#ooui-php-424|o gadget "Vigiar contribuições"]] esteja ativado, já que é dele que a lista de usuários é puxada
 */
(function () {
	'use strict';
	window.wuchighlightDEBUG = false;
	const pgName = mw.config.get('wgPageName');
	const spPgNm = mw.config.get('wgCanonicalSpecialPageName');
	
	let watched = new Set();
	let lastRawList = '';
	
	let highlighted = new Set();
	
	function notify(message, options = {}) {
		mw.notify(
			$('<span>')
				.append(
					'[', 
					$('<a>')
						.attr('href', mw.util.getUrl('Usuário:BraunOBruno/Scripts/RealçarUsuáriosVigiadosNasMRs.js'))
						.text('RUVNMR.js'),
					'] '
				)
				.append(
					$('<span>').html(message.replace(/\n/g, '<br>'))
				),
			Object.assign(
				{
					tag: 'html',
					title: 'Realce de usuários',
				},
				options
			)
		);
	}

	function debug(...args) {
		const hasForce = typeof args[0] === 'boolean';
		const force = hasForce ? args.shift() : false;
		
		if (window.wuchighlightDEBUG || force) {
			console.log('[RealçarUsuáriosVigiadosNasMRs]', ...args);
			notify(args.join(' '), { autoHide: force ? false : undefined });
		}
	}
	
	if (spPgNm !== 'Recentchanges' && pgName !== "Especial:Página_em_branco/RTRC") {
		debug('Página não é mudanças recentes. Encerrando script.');
		return;
	}
	
	const HIGHLIGHT_CLASS = 'wuc-highlighted-user';
	const STYLE = `
		.${HIGHLIGHT_CLASS} {
			background: #ffbb00 !important;
			border-radius: 2px;
			padding: 0 2px;
			font-weight: bold;
		}
	`;
	
	const style = document.createElement('style');
	style.textContent = STYLE;
	document.head.appendChild(style);
	
	function loadWatchedUsers() {
		const rawList = localStorage['wuc-watchedUsers'] || '';
		
		if (rawList !== lastRawList) {
			const newWatched = new Set(
				rawList
					.split(',')
					.map(s => s.trim())
					.filter(Boolean)
			);
			
			const newUsers = [...newWatched].filter(user => !watched.has(user));
			const removedUsers = [...watched].filter(user => !newWatched.has(user));
			
			watched = newWatched;
			lastRawList = rawList;
			
			debug('Lista de usuários vigiados atualizada:', [...watched]);
			
			if (newUsers.length > 0) {
				notify(`Novos usuários adicionados à vigilância: ${newUsers.join(', ')}`, {autoHideSeconds: 5});
				debug('Novos usuários:', newUsers);
				document.querySelectorAll(classeProcurada()).forEach(highlightUsers);
			}
			
			if (removedUsers.length > 0) {
				notify(`Usuários removidos da vigilância: ${removedUsers.join(', ')}`, {autoHideSeconds: 5});
				debug('Usuários removidos:', removedUsers);
				removeHighlightForUsers(removedUsers);
			}
			
			return true;
		}
		
		return false;
	}
	
	function removeHighlightForUsers(users) {
		const userLinks = document.querySelectorAll(`a.mw-userlink.${HIGHLIGHT_CLASS}`);
		userLinks.forEach(link => {
			const user = link.textContent.trim();
			if (users.includes(user)) {
				link.classList.remove(HIGHLIGHT_CLASS);
				debug(`Realce removido: ${user}`);
			}
		});
	}
	
	loadWatchedUsers();
	
	function highlightUsers(classe) {
		return new Promise((resolve) => {
			const elementos = document.querySelectorAll(classe);
			elementos.forEach(node => {
				const userLinks = node.querySelectorAll('a.mw-userlink');
				userLinks.forEach(link => {
					const user = link.textContent.trim();
					if (watched.has(user)) {
						link.classList.add(HIGHLIGHT_CLASS);
						debug(`Realçado: ${user}`);
						highlighted.add(user);
					} else if (link.classList.contains(HIGHLIGHT_CLASS)) {
						link.classList.remove(HIGHLIGHT_CLASS);
						debug(`Realce removido: ${user}`);
						highlighted.delete(user);
					}
				});
			});
			resolve();
		});
	}

	
	function classeProcurada() {
		if (pgName === "Especial:Página_em_branco/RTRC") {
			return '.mw-rtrc-item';
		} else if (spPgNm === 'Recentchanges') {
			return '.mw-changeslist, .mw-changeslist-legend';
		}
	}
	
	highlightUsers(classeProcurada()).then(()=>{
		if (watched.size === 0) {
			notify('Nenhum usuário está sendo vigiado no momento.', {autoHideSeconds: 3});
		} else {
			let msg = 'Usuários com contribuições vigiadas serão realçados.';
			if(highlighted.size > 0){
				msg += '\n Realçes presentes:\n' + [...highlighted].join('\n');
			}
			notify(msg, highlighted.size > 0 ? {autoHide: false} : {autoHideSeconds: 3});
		}
	});

	const observer = new MutationObserver(mutations => {
		for (const mutation of mutations) {
			for (const node of mutation.addedNodes) {
				if (
					node.nodeType === Node.ELEMENT_NODE &&
					node.querySelector &&
					node.querySelector('a.mw-userlink')
				) {
					//debug('Novo nó relevante detectado:', node);
					highlightUsers(node);
				}
			}
		}
	});
	
	observer.observe(document.body, {
		childList: true,
		subtree: true
	});
	
	const pollingInterval = setInterval(() => {
		loadWatchedUsers();
	}, 2000);
	
	window.addEventListener('storage', (e) => {
		if (e.key === 'wuc-watchedUsers') {
			debug('Mudança detectada no localStorage via evento storage');
			loadWatchedUsers();
		}
	});
	
	const originalSetItem = localStorage.setItem;
	localStorage.setItem = function(key, value) {
		const result = originalSetItem.apply(this, arguments);
		if (key === 'wuc-watchedUsers') {
			debug('Mudança detectada no localStorage via wrapper');
			setTimeout(() => {
				loadWatchedUsers();
			}, 100);
		}
		return result;
	};
	
	window.listarRealces = function() {
	    let msg = 'Vigiados: \n' + [...watched].join('\n');
	    if (highlighted.size > 0) {
	        msg += '\nRealçados: \n' + [...highlighted].join('\n');
	    }
	    debug(true, msg);
	};


	window.addEventListener('beforeunload', () => {
		clearInterval(pollingInterval);
		observer.disconnect();
		localStorage.setItem = originalSetItem;
	});
	
	debug('Script inicializado com monitoramento em tempo real');
	debug('Observador ativado');
	debug('Monitoramento de localStorage ativado');
})();
