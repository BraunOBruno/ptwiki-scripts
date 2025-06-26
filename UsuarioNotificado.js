/*Documentação: [[User:BraunOBruno/UsuárioNotificado]]
*/
(function () {
    // Verifies if the page is a User Talk page
    if (mw.config.get('wgNamespaceNumber') !== 3) {
        return; // Exit if not on a User Talk page
    }

    // Obtains the username from the page title (handles subpages)
    const userName = mw.config.get('wgTitle').split('/')[0];

    // List of pages to check, with labels for type of notification
    const pages = [
        { page: 'Wikipédia:Pedidos/Notificações de vandalismo', type: 'vandalismo' },
        { page: 'Wikipédia:Pedidos/Notificação de incidentes', type: 'incidente' }
    ];

    // Function to check if the username exists in a specific section on the specified page using the API
    function checkUserInPage({ page, type }) {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: mw.util.wikiScript('api'),
                data: {
                    action: 'query',
                    prop: 'revisions',
                    rvprop: 'content|timestamp',
                    titles: page,
                    format: 'json'
                },
                dataType: 'json',
                success: function (data) {
                    const pages = data.query.pages;
                    const content = Object.values(pages)[0].revisions[0]['*'];
                    const regex = new RegExp(`==\\s*${userName}\\s*==`, 'gi');
                    const matches = [...content.matchAll(regex)];

                    if (matches.length > 0) {
                        const lastMatch = matches[matches.length - 1];
                        const sectionTitle = lastMatch[0].replace(/==/g, '').trim();
                        const sectionCount = matches.length;
                        const sectionSuffix = sectionCount > 1 ? `_${sectionCount}` : '';
                        const sectionLink = `${mw.util.getUrl(page)}#${encodeURIComponent(sectionTitle.replace(/ /g, '_'))}${sectionSuffix}`;

                        // Extract the last occurrence's section content
                        const sectionStart = content.lastIndexOf(lastMatch[0]);
                        const sectionEnd = content.indexOf('==', sectionStart + lastMatch[0].length) > -1 ? 
                                           content.indexOf('==', sectionStart + lastMatch[0].length) : content.length;
                        const sectionContent = content.slice(sectionStart, sectionEnd);

                        // Regex to find the first signature with timestamp
                        const signatureRegex = /\d{2}h\d{2}min\s+de\s+\d{1,2}\s+de\s+\S+\s+de\s+\d{4}\s+\(UTC\)/;
                        const signatureMatch = signatureRegex.exec(sectionContent);

                        let timestamp = '';
                        if (signatureMatch) {
                            timestamp = signatureMatch[0];
                        }

                        const uncommentedRespondidoRegex = /\{\{Respondido2\|([^|}]+)\|/;
                        const commentedRespondidoRegex = /<!--[\s\S]*?\{\{Respondido2\|([^|}]+)\|/;

                        let result = { found: false };

                        const uncommentedMatch = uncommentedRespondidoRegex.exec(sectionContent);
                        const commentedMatch = commentedRespondidoRegex.exec(sectionContent);

                        if (uncommentedMatch && !commentedMatch) {
                            const outcome = uncommentedMatch[1].trim();
                            result = { 
                                found: true, 
                                color: 'green', 
                                link: sectionLink, 
                                timestamp: timestamp, 
                                type: type, 
                                status: 'respondido', 
                                outcome: outcome 
                            };
                        } else if (commentedMatch) {
                            result = { 
                                found: true, 
                                color: 'orange', 
                                link: sectionLink, 
                                timestamp: timestamp, 
                                type: type, 
                                status: 'pendente' 
                            };
                        }

                        resolve(result);
                    } else {
                        resolve({ found: false });
                    }
                },
                error: function (error) {
                    reject(error);
                }
            });
        });
    }

    // Execute the checks
    Promise.all(pages.map(checkUserInPage))
        .then(function (results) {
            const notifications = results
                .filter(result => result.found)
                .map(result => {
                    const outcomeText = result.outcome ? `: ${result.outcome}` : '';
                    return `<a href="${result.link}" style="color: ${result.color}; font-weight: bold;">${result.type.charAt(0).toUpperCase() + result.type.slice(1)} (${result.status}${outcomeText}) em ${result.timestamp}</a>`;
                })
                .join('<br>');

            if (notifications) {
                mw.notify($(`
                    <span>O usuário ${userName} foi notificado em uma das páginas de pedidos:</span>
                    <br>${notifications}
                `), {
                    title: 'Notificação de usuário',
                    type: 'warn',
                    tag: 'user-notification',
                    autoHide: false
                });
            }
        })
        .catch(function (error) {
            console.error('Erro ao verificar as páginas:', error);
        });
})();
