mw.loader.using("mediawiki.util", function () {
	const currentUser = mw.config.get("wgUserName");
	const pageName = encodeURIComponent(mw.config.get("wgPageName"));
	const currentUrl = window.location.href;

	const hoje = new Date();
	const dia = hoje.getDate();
	const mes = hoje.toLocaleDateString('pt-BR', { month: 'long' });
	const dataFormatada = `${dia}_de_${mes}`;

	const links = [
		{ portlet: 'p-navigation', href: 'https://pt.wikipedia.org/wiki/Categoria:!Marcações_de_eventos_recentes_expiradas', text: 'Ev. At. Exp', id: 'n-evat.side' },
		{ portlet: 'p-navigation', href: 'https://pt.wikipedia.org/wiki/Especial:Registo', text: 'Registo', id: 'n-reg-side' },
		{ portlet: 'p-navigation', href: 'https://pt.wikipedia.org/wiki/Especial:Registo?type=newusers', text: 'Usuários novos', id: 'n-newu-side' },
		{ portlet: 'p-navigation', href: 'https://pt.wikipedia.org/wiki/Especial:Registro_de_abusos?wpSearchActionTaken=disallow', text: 'Filtro de abusos', id: 'n-filabu-side' },
		{ portlet: 'p-navigation', href: `https://pt.wikipedia.org/wiki/Usuário:${encodeURIComponent(currentUser)}/common.js`, text: 'Common.js', id: 'n-comm-side' },
		{ portlet: 'p-navigation', href: `https://pt.wikipedia.org/wiki/Especial:Índice_por_prefixo/Usuário:${encodeURIComponent(currentUser)}/`, text: 'Minhas subpáginas', id: 'n-mysubp-side' },
		{ portlet: 'p-navigation', href: `https://pt.wikipedia.org/w/index.php?title=Especial:Registo&page=${pageName}`, text: 'Registos da página', id: 'n-regpge-side' },
		{ portlet: 'p-navigation', href: `https://pt.wikipedia.org/wiki/Especial:Mover_página/${pageName}`, text: 'Mover', id: 'ca-move' },
		{ portlet: 'p-navigation', href: `https://pt.wikipedia.org/wiki/Usuário:${encodeURIComponent(currentUser)}/Scripts`, text: 'Scripts', id: 'n-scr-side' },
		{ portlet: 'p-navigation', href: 'https://pt.wikipedia.org/wiki/Especial:Carregar_imagem', text: '+Imagem restrita', id: 'p-addimgrest' },
		{ portlet: 'p-navigation', href: `https://pt.wikipedia.org/wiki/Usuário:${encodeURIComponent(currentUser)}/Listas`, text: 'Listas', id: 'n-listas-side' },
		{ portlet: 'p-navigation', href: 'https://en.wikipedia.org/wiki/Main_Page', text: 'enwiki', id: 'n-enwiki-side' },
		{ portlet: 'p-navigation', href: 'https://pt.m.wikipedia.org/w/index.php?title=Special:ContentTranslation&active-list=draft&from=en&to=pt', text: 'Trad. Móv.', id: 'n-tradm.side' },
		{ portlet: 'p-navigation', href: 'https://pt.wikipedia.org/wiki/Categoria:!Páginas_para_eliminação_rápida', text: 'ERs', id: 'p-ER' },
		{ portlet: 'p-navigation', href: `https://pt.wikipedia.org/wiki/Categoria:!Páginas_para_eliminação_semirrápida/${dataFormatada}`, text: 'ESRs', id: 'p-esr' },
		{ portlet: 'p-navigation', href: 'https://pt.wikipedia.org/wiki/Wikipédia:Páginas_para_eliminar/Lista', text: 'ECs', id: 'p-ecs' },
		{ portlet: 'p-navigation', href: 'https://pt.wikipedia.org/wiki/Wikipédia:Pedidos/Restauro#footer', text: 'REST', id: 'p-rest' },
		{ portlet: 'p-navigation', href: 'https://pt.wikipedia.org/wiki/Wikipédia:Pedidos/Notificações_de_vandalismo#footer', text: 'NVs', id: 'p-nv' },
		{ portlet: 'p-navigation', href: 'https://pt.wikipedia.org/wiki/Wikipédia:Pedidos/Notificação_de_incidentes#footer', text: 'NIs', id: 'p-ni' },
		{ portlet: 'p-tb', href: `https://wikinav.toolforge.org/?language=pt&title=${pageName}`, text: 'WikiNav', id: 'tb-wknv' },
		{ portlet: 'p-tb', href: 'https://spamcheck.toolforge.org', text: 'SpamCheck', id: 'tb-spmchk' },
		{ portlet: 'p-cactions', href: `${currentUrl}?veaction=editsource`, text: 've2017', id: 'ca-ve2017' }
	];

	links.forEach(link => {
		mw.util.addPortletLink(link.portlet, link.href, link.text, link.id);
	});
});
