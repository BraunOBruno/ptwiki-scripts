/*
 * 
 * Este script permite clicar no título de uma página para transformá-lo em uma barra de busca temporária com sugestões automáticas (via API OpenSearch),
 * incluindo suporte a buscas interwiki usando o prefixo de idioma (ex: `:en:Article`).
 * 
 * - Suporte a teclas ↑ ↓ Enter Tab Esc
 * - Clique com botão do meio (scroll) abre resultado em nova aba
 * - Shift + Enter também abre em nova aba
 * - Detecta prefixo de idioma e busca no respectivo domínio da Wikipédia
 * - Botão "✕" limpa a busca e restaura o valor original
 * - Opção de busca sempre disponível como última sugestão
 * 
 * Compatibilidade: apenas navegadores desktop
 *
 * Para instalar, insira o seguinte código em [[Especial:Minha página/common.js|sua common.js]]:

importScript('Usuário:BraunOBruno/Scripts/BuscaNoNomeDoArtigo.js') // Link de retorno: [[Usuário:BraunOBruno/Scripts/BuscaNoNomeDoArtigo.js]]

*/
	

(function() {
	'use strict';
	if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) return;

	const h1 = document.getElementById('firstHeading');
	if (!h1) return;

	const originalTitleHTML = h1.innerHTML;
	const originalTitleText = mw.config.get('wgPageName').replace(/_/g, ' ');
	//const originalTitleText = h1.innerText;

	const ul = document.createElement('ul');
	ul.style.listStyle = 'none';
	ul.style.position = 'absolute';
	ul.style.backgroundColor = 'white';
	ul.style.border = '1px solid #ccc';
	ul.style.zIndex = '9999';
	ul.style.margin = '0';
	ul.style.padding = '0';
	ul.style.maxHeight = '200px';
	ul.style.overflowY = 'auto';
	ul.style.fontSize = 'inherit';
	ul.hidden = true;
	document.body.appendChild(ul);

	let suggestions = [];
	let selectedIndex = -1;
	let lastQuery = '';

	h1.addEventListener('click', () => {
		if (h1.querySelector('input')) return;

		h1.innerHTML = '';
		const input = document.createElement('input');
		input.type = 'text';
		input.id = 'headerSearchBar';
		input.value = originalTitleText;
		input.style.all = 'inherit';
		input.style.width = '100%';
		input.style.boxSizing = 'border-box';
		input.style.border = 'none';
		input.style.outline = 'none';
		input.autocomplete = 'off';

		function getFullWikiURL(inputTitle) {
			let lang = location.hostname.split('.')[0];
			let title = inputTitle;
			const match = title.match(/^:([a-z\-]+):(.*)/i);
			if (match) {
				lang = match[1];
				title = match[2].trim();
			}
			return `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;
		}

		function getSearchURL(searchTerm, lang) {
			return `https://${lang}.wikipedia.org/w/index.php?search=${encodeURIComponent(searchTerm)}&title=Especial%3APesquisar&fulltext=1`;
		}

		h1.appendChild(input);
		
		const clearBtn = document.createElement('button');
		clearBtn.textContent = '✕';
		clearBtn.title = 'Limpar busca';
		clearBtn.style.marginLeft = '5px';
		clearBtn.style.cursor = 'pointer';
		clearBtn.style.all = 'unset';
		clearBtn.style.fontSize = 'inherit';
		clearBtn.style.color = '#999';
		clearBtn.addEventListener('mousedown', e => {
			e.preventDefault();
		});

		clearBtn.addEventListener('click', e => {
			e.stopPropagation();
			input.value = originalTitleText;
			input.dispatchEvent(new Event('input'));
			input.focus();
		});

		const wrapper = document.createElement('div');
		wrapper.style.display = 'flex';
		wrapper.style.alignItems = 'center';
		wrapper.appendChild(input);
		wrapper.appendChild(clearBtn);

		h1.appendChild(wrapper);
		input.focus();

		if (lastQuery) {
			input.value = lastQuery;
		}

		let detectedLangPrefix = '';
		let currentLang = '';
		let currentSearchTerm = '';

		input.addEventListener('input', async () => {
			const query = input.value.trim();

			if (!query) {
				ul.hidden = true;
				lastQuery = null;
				detectedLangPrefix = '';
				return;
			}

			lastQuery = query;
			let queryLang = location.hostname.split('.')[0];
			let searchTerm = query;
			
			const match = query.match(/^:?([a-z\-]{2}):(.*)/i);
			if (match && match[1].toLowerCase() != 'wp') {
				queryLang = match[1];
				searchTerm = match[2].trim();
				detectedLangPrefix = `:${queryLang}:`;
			} else {
				detectedLangPrefix = '';
			}

			currentLang = queryLang;
			currentSearchTerm = searchTerm;

			const res = await fetch(`https://${queryLang}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(searchTerm)}&limit=10&namespace=0&format=json&origin=*`);
			const data = await res.json();
			suggestions = Array.isArray(data[1]) ? data[1] : [];
			selectedIndex = -1;

			ul.innerHTML = '';
			
			suggestions.forEach((title, i) => {
				const li = document.createElement('li');
				li.textContent = title;
				li.style.padding = '5px 10px';
				li.style.cursor = 'pointer';
				li.dataset.type = 'article';
				li.dataset.index = i;

				li.addEventListener('mouseover', () => {
					selectedIndex = i;
					updateHighlight(ul.querySelectorAll('li'));
				});
			
				li.addEventListener('mousedown', (e) => {
					if (e.button === 1) {
						e.preventDefault();
						const finalTitle = detectedLangPrefix + title;
						input.value = finalTitle;
						window.open(getFullWikiURL(finalTitle), '_blank');
					}
				});
			
				li.addEventListener('click', () => {
					const finalTitle = detectedLangPrefix + title;
					input.value = finalTitle;
					location.href = getFullWikiURL(finalTitle);
				});

				ul.appendChild(li);
			});

			const searchLi = document.createElement('li');
			searchLi.innerHTML = `<strong>🔍 Buscar por "${searchTerm}"</strong>`;
			searchLi.style.padding = '5px 10px';
			searchLi.style.cursor = 'pointer';
			searchLi.style.borderTop = '1px solid #eee';
			searchLi.style.fontWeight = 'bold';
			searchLi.style.color = '#0645ad';
			searchLi.dataset.type = 'search';
			searchLi.dataset.index = suggestions.length;

			searchLi.addEventListener('mouseover', () => {
				selectedIndex = suggestions.length;
				updateHighlight(ul.querySelectorAll('li'));
			});

			searchLi.addEventListener('mousedown', (e) => {
				if (e.button === 1) {
					e.preventDefault();
					window.open(getSearchURL(searchTerm, currentLang), '_blank');
				}
			});

			searchLi.addEventListener('click', () => {
				location.href = getSearchURL(searchTerm, currentLang);
			});

			ul.appendChild(searchLi);

			const rect = input.getBoundingClientRect();
			ul.style.left = rect.left + 'px';
			ul.style.top = rect.bottom + 'px';
			ul.style.width = rect.width + 'px';
			ul.hidden = false;
		});

		input.addEventListener('keydown', e => {
			const items = ul.querySelectorAll('li');
			const totalItems = suggestions.length + 1;

			if (e.key === 'ArrowDown') {
				e.preventDefault();
				if (totalItems === 0) return;
				if (selectedIndex === -1) {
					selectedIndex = 0;
				} else {
					selectedIndex = (selectedIndex + 1) % totalItems;
				}
				updateHighlight(items);
			} else if (e.key === 'ArrowUp') {
				e.preventDefault();
				if (totalItems === 0) return;
				if (selectedIndex === -1) {
					selectedIndex = totalItems - 1;
				} else {
					selectedIndex = (selectedIndex - 1 + totalItems) % totalItems;
				}
				updateHighlight(items);
			} else if (e.key === 'Enter') {
				e.preventDefault();
				let url;
				
				if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
					const targetTitle = detectedLangPrefix + suggestions[selectedIndex];
					input.value = targetTitle;
					url = getFullWikiURL(targetTitle);
				} else if (selectedIndex === suggestions.length) {
					url = getSearchURL(currentSearchTerm, currentLang);
				} else {
					const targetTitle = input.value.trim();
					input.value = targetTitle;
					url = getFullWikiURL(targetTitle);
				}

				if (e.shiftKey) {
					window.open(url, '_blank');
				} else {
					location.href = url;
				}
			} else if (e.key === 'Escape') {
				restoreTitle();
			} else if (e.key === 'Tab') {
				if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
					e.preventDefault();
					const finalTitle = detectedLangPrefix + suggestions[selectedIndex];
					input.value = finalTitle;
					ul.hidden = true;
				} else if (selectedIndex === suggestions.length) {
					e.preventDefault();
				}
			}
		});

		input.addEventListener('blur', () => {
			// Delay para permitir clique no dropdown antes de fechar
			setTimeout(() => {
				restoreTitle();
			}, 200);
		});

		function updateHighlight(items) {
			items.forEach((li, idx) => {
				li.style.backgroundColor = idx === selectedIndex ? '#b3d4fc' : 'white';
				if (idx === selectedIndex) {
					li.scrollIntoView({
						block: 'nearest'
					});
				}
			});
		}

		function restoreTitle() {
			h1.innerHTML = originalTitleHTML;
			ul.hidden = true;
			input.value = null;
		}

		document.addEventListener('click', e => {
			if (!ul.contains(e.target) && e.target !== input) {
				ul.hidden = true;
			}
		});
	});
})();
