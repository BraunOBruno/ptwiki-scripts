/*
 * Por [[User:BraunOBruno]]
 * Consulte documentação em [[User:BraunOBruno/CatCompleter 2 QuickCategories]]
 */

mw.loader.using(['mediawiki.api', 'mediawiki.util']).then(function() {
    if (mw.config.get('wgPageName') === 'Usuário:BraunOBruno/Scripts/CatCompleter2QuickCategories') {
        const noticeBox = `<table class="plainlinks metadata ambox ambox-notice" style="border: 1px solid #a2a9b1; border-left: 10px solid #36c; background-color: #fbfbfb; box-sizing: border-box; margin: 0 10%;" role="presentation"><tbody><tr><td class="mbox-image"><div style="width:52px"><span typeof="mw:File"><span><img alt="" src="//upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Information_icon4.svg/40px-Information_icon4.svg.png" decoding="async" width="40" height="40" class="mw-file-element" srcset="//upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Information_icon4.svg/60px-Information_icon4.svg.png 1.5x, //upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Information_icon4.svg/80px-Information_icon4.svg.png 2x" data-file-width="620" data-file-height="620"></span></span></div></td><td class="mbox-text"><div class="mbox-text-span">Esta página contém a documentação da ferramenta. Para acessar a ferramenta, <a href="/wiki/Especial:P%C3%A1gina_em_branco/CatCompleter_2_QuickCategories" title="Especial:Página em branco/CatCompleter 2 QuickCategories">clique aqui</a>.</div></td></tr></tbody></table>`;
        mw.loader.load("https://pt.wikipedia.org/w/index.php?title=Predefini%C3%A7%C3%A3o:Ombox/styles.css&action=raw&ctype=text/css", "text/css")
        $("#mw-content-text").prepend(noticeBox);
    }
    if (mw.config.get('wgPageName') === 'Especial:Página_em_branco/CatCompleter_2_QuickCategories') {
        const api = new mw.Api({
            userAgent: 'CatCompleter_2_QuickCategories/1.0'
        })

        $(document).ready(function() {
            $("#firstHeading").text("CatCompleter 2 QuickCategories");
            $("title").text("CatCompleter 2 QuickCategories - " + mw.config.get("wgSiteName"));
            $("#mw-content-text").html(`
                <p>
                    Ferramenta para processar lista de artigos gerada por <a id="catcompleterurl" href="https://mormegil.toolforge.org/catcompleter/" target="_blank">CatCompleter</a> em um batch sem redundâncias formatado para o 
                    <a href="https://quickcategories.toolforge.org" target="_blank">QuickCategories</a>. 
                    Consulte a <a href="/wiki/Usuário:BraunOBruno/CatCompleter_2_QuickCategories" target="_blank">documentação</a> para mais informações.
                </p>
            `);

            const form = $('<div style="padding: 1em;"></div>');
            const inputCategory = $('<input type="text" class="mw-inputbox-input cdx-text-input__input" placeholder="Digite a categoria (sem \'Categoria:\')" style="width: 100%; margin-bottom: 1em;">');
            const suggestionBox = $('<div style="border: 1px solid #ccc; background-color: #fff; max-height: 150px; overflow-y: auto; display: none; position: absolute; z-index: 1000;"></div>');
            const inputArticles = $('<textarea placeholder="Cole a lista de artigos gerada pelo CatCompleter." class="mw-inputbox-input cdx-text-input__input" style="width: 100%; height: 200px; margin-bottom: 1em;"></textarea>');
            const buttonProcess = $('<button style="margin-bottom: 1em;" class="mw-ui-button mw-ui-progressive">Processar lista</button>');
            const outputDiv = $('<div style="border: 1px solid #ccc; padding: 1em; background-color: #f9f9f9; height: 200px; overflow-y: auto; white-space: pre-wrap;"></div>');
            const progressText = $('<div style="font-size: 1.2em; font-family: monospace; white-space: pre; margin-top: 1em;"></div>');
            const buttonCopy = $('<button style="margin-top: 1em;" class="mw-ui-button mw-ui-progressive">Copiar resultado</button>');

            form.append(inputCategory);
            form.append(suggestionBox);
            form.append(inputArticles);
            form.append(buttonProcess);
            form.append(progressText);
            form.append(outputDiv);
            form.append(buttonCopy);
            $("#mw-content-text").append(form);
            
            const params = new URLSearchParams(window.location.search);
            const catParam = params.get('cat');
            if (catParam) {
                inputCategory.val(catParam);
                const link = document.getElementById("catcompleterurl");
    			link.href = `https://mormegil.toolforge.org/catcompleter/?project=${encodeURIComponent(mw.config.get('wgContentLanguage'))}&catname=${encodeURIComponent(catParam)}`;
            }
            
            let debounceTimeout;
            inputCategory.on('input', function() {
                const query = inputCategory.val().trim();
                if (!query) {
                    suggestionBox.hide();
                    return;
                }

                clearTimeout(debounceTimeout);
                debounceTimeout = setTimeout(async () => {
                    try {
                        const data = await api.get({
                            action: 'query',
                            list: 'prefixsearch',
                            pssearch: `Categoria:${query}`,
                            format: 'json',
                            pslimit: 10
                        });

                        const suggestions = data.query.prefixsearch.map(item => item.title.replace('Categoria:', ''));
                        if (suggestions.length > 0) {
                            suggestionBox.empty().show();
                            suggestions.forEach(cat => {
                                const suggestionItem = $(`<div style="padding: 0.5em; cursor: pointer;">${cat}</div>`);
                                suggestionItem.on('click', () => {
                                    inputCategory.val(cat);
                                    suggestionBox.hide();
                                });
                                suggestionBox.append(suggestionItem);
                            });
                        } else {
                            suggestionBox.hide();
                        }
                    } catch (e) {
                        console.error('Erro ao buscar categorias:', e);
                        suggestionBox.hide();
                    }
                }, 300);
            });

            $(document).on('click', function(e) {
                if (!$(e.target).closest(inputCategory).length && !$(e.target).closest(suggestionBox).length) {
                    suggestionBox.hide();
                }
            });

            async function processCategories() {
            	outputDiv.text('');
                const categoryToAdd = inputCategory.val().trim();
                if (!categoryToAdd) {
                    outputDiv.text('Por favor, insira uma categoria válida.');
                    return;
                }

                const articleLines = inputArticles.val().split('\n');
                const articles = articleLines.map(line => {
                    const match = line.match(/\[\[(.*?)\]\]/);
                    return match ? match[1] : null;
                }).filter(Boolean);

                if (!articles.length) {
                    outputDiv.text('Nenhum artigo válido encontrado.');
                    return;
                }
                var red = 0;
                const results = [];
                progressText.text(`Processando 0 de ${articles.length} artigos...`);

                const width = String(articles.length).length;

                for (let i = 0; i < articles.length; i++) {
                    const articleName = articles[i];
                    const iStr = String(i + 1).padStart(width, '0');
                    const totalStr = String(articles.length);

                    try {
                        const contentResult = await api.get({
                            action: 'query',
                            titles: articleName,
                            prop: 'revisions',
                            rvprop: 'content',
                            format: 'json'
                        });

                        const pageData = Object.values(contentResult.query.pages)[0];
                        const content = pageData.revisions[0]['*'];

                        if (content.startsWith('#REDIR')) {
                            red++;
                            progressText.text(`(${iStr}/${totalStr}) Pulando      ${articleName}`);
                            await new Promise(r => setTimeout(r, 0));
                            continue;
                        }

                        const articleCategories = await api.get({
                            action: 'query',
                            titles: articleName,
                            prop: 'categories',
                            cllimit: 'max',
                            format: 'json'
                        });

                        const pages = articleCategories.query.pages;
                        const page = Object.values(pages)[0];
                        const existingCategories = (page.categories || []).map(cat => cat.title.replace('Categoria:', ''));

                        const categoriesInCategoryToAdd = await getCategoriesInCategory(categoryToAdd);
                        const redundantCategories = existingCategories.filter(cat => categoriesInCategoryToAdd.includes(cat));
                        const categoriesRemoved = redundantCategories.map(cat => `|-Category:${cat}`).join('');

                        const result = `${articleName}|+Category:${categoryToAdd}${categoriesRemoved}`;
                        results.push(result);
                        outputDiv.append(`${result}<br>`);

                    } catch (e) {
                        console.error(`Erro ao processar o artigo ${articleName}: ${e.message}`);
                        results.push(`${articleName}|Erro: ${e.message}`);
                    }

                    progressText.text(`(${iStr}/${totalStr}) Processando  ${articleName}`);
                    await new Promise(r => setTimeout(r, 0));
                }

                //outputDiv.html(results.join('\n')); 
                progressText.text(`Finalizado. ${articles.length} artigos foram processados e ${textored(red)}.`);
            }

            async function getCategoriesInCategory(category) {
                try {
                    const categoryInfo = await api.get({
                        action: 'query',
                        titles: `Categoria:${category}`,
                        prop: 'categories',
                        format: 'json'
                    });

                    const catPage = Object.values(categoryInfo.query.pages)[0];
                    return (catPage.categories || []).map(cat => cat.title.replace('Categoria:', ''));
                } catch (err) {
                    console.error(`Erro ao carregar categorias da categoria '${category}': ${err}`);
                    return [];
                }
            }

            buttonProcess.on('click', processCategories);

            function copyToClipboard() {
                const text = outputDiv.text();
                const textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }

            buttonCopy.on('click', copyToClipboard);
        });
    }
    if (mw.config.get('wgNamespaceNumber') === 2) {
    $(document).ready(function() {
        const outbtn = $(".cc2qc-outbtn");
        if (outbtn.length) {
            const linkEl = document.querySelector("#mw-content-text > div.mw-content-ltr.mw-parser-output > div:nth-child(1) > center:nth-child(3) > a:nth-child(2)");
            if (linkEl) {
                const cat = encodeURIComponent(linkEl.textContent.trim());
                const btn = $(`<a href="/wiki/Especial:P%C3%A1gina_em_branco/CatCompleter_2_QuickCategories?cat=${cat}" target="_blank"><span style="border-radius:3px; padding:3px;margin-left:3px;background-color:#8c032e;color:white;padding-left:5px;padding-right:5px">CC2QC</span></a>`);
                outbtn.append(btn);
            }
        }
    });
    }
});

function textored(nmr) {
    return nmr === 0 ?
        "nenhum redirecionamento foi detectado" :
        `${nmr} redirecionamento${nmr > 1 ? "s foram" : " foi"} removido${nmr > 1 ? "s" : ""}`;
}

mw.loader.using("mediawiki.util", function() {
    mw.util.addPortletLink(
        "p-tb",
        "https://pt.wikipedia.org/wiki/Especial:P%C3%A1gina_em_branco/CatCompleter_2_QuickCategories",
        "CatCompleter 2 QuickCategories",
        "tb-CC2QC"
    );
});
