/*
 * por [[User:BraunOBruno]]
 */
textoBotão = '{{Não assinou}}';
(function() {
    'use strict';

    // Check if we are on a diff page

    if ([1, 3, 5, 7, 9, 11, 13, 15, 101, 105, 447, 711, 829, 2, 4, 12, 100].includes(mw.config.get('wgNamespaceNumber')) && !!(mw.util.getParamValue('diff') || mw.util.getParamValue('oldid'))) {
        
        mw.loader.load('https://pt.wikipedia.org/w/index.php?title=Usuário:BraunOBruno/NãoAssinou.js/NãoAssinou.css&action=raw&ctype=text/css', 'text/css');
        
        // Load necessary modules
        mw.loader.using(['mediawiki.util', 'mediawiki.api', 'mediawiki.Title'], function() {
        	
            // Function to add the button
            function addButton() {
                
                // Add the button to the sidebar
                mw.util.addPortletLink(
                    'mw-diff-ntitle4',
                    '#',
                    textoBotão,
                    'n-signature-side',
                    'Copy the Não assinou template to clipboard'
                );

                // Add event listener to the button
                $('#n-signature-side a').on('click', function(event) {
                    event.preventDefault();
                    
                    // Retrieve the username and time from the diff
                    var user = $('#mw-diff-ntitle2 .mw-userlink').text().trim();
                                        var timestampText = $('#mw-diff-ntitle1 strong a').text().trim();
                    
                    // Extract timestamp from the raw text
                    var timestampMatch = timestampText.match(/(\d{2}h\d{2}min) de (.*) de (\d{4})/);
                    if (timestampMatch) {
                        var time = timestampMatch[1];
                        var date = timestampMatch[2] + ' de ' + timestampMatch[3];
                        var timestamp = time + ' de ' + date + ' (UTC)';
                        
                        // Construct the template code

                        var templateCode = ' {{' + 'subst:Não assinou|' + user + '|' + timestamp + '}}';
                        
                        // Copy the template code to the clipboard
                        var $tempInput = $('<input>');
                        $('body').append($tempInput);
                        $tempInput.val(templateCode).select();
                        document.execCommand('copy');
                        $tempInput.remove();
                        
                        mw.notify($(`<span>A predefinição foi copiada para a área de transferência:</span><br><code>${templateCode}</code>`), {
                            title: 'Predefinição copiada',
                            type: 'success',
                            tag: 'copy-notification',
                            autoHide: true
                        });
                        
                        $(this).text('Predefinição copiada.');
						
						
                        setTimeout(() => {
                            $(this).text(textoBotão);
                        }, 2000);
                    } else {
						mw.notify(
						    $(`<span>Não foi possível extrair o timestamp corretamente. <a href="https://pt.wikipedia.org/w/index.php?title=Usu%C3%A1rio_Discuss%C3%A3o:BraunOBruno&action=edit&section=new" target="_blank">Avisar BraunOBruno</a></span>`), 
						    { autoHide: true, type: 'error' }
						);
                    }
                });
            }

            // Run the function to add the button
            $(addButton);
                    });
    }
}());
