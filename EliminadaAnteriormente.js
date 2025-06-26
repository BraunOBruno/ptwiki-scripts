/** EliminadaAnteriormente.js
 *  Author:  [[:pt:User:BraunOBruno]]
 *
 *  Este script mostra, ao abrir uma página, se ela já foi eliminada anteriormente, linkando para registro e/ou PE relevante
 *
 * Para instalar, insira o seguinte código em [[Especial:Minha página/common.js|sua common.js]]:

importScript('Usuário:BraunOBruno/Scripts/EliminadaAnteriormente.js') // Link de retorno: [[Usuário:BraunOBruno/Scripts/EliminadaAnteriormente.js]]
 *
 */
(async function() {
	if (mw.config.get("wgNamespaceNumber") != 0 || mw.config.get("wgAction") !== "view") return;

	const page = mw.config.get("wgPageName");
	const title = mw.config.get("wgTitle");

	const showNotice = (msg, color) => {
		$("<div>")
			.css({
				background: color || "#ffd",
				padding: "5px",
				border: "1px solid #aaa",
				margin: "5px 0"
			})
			.html(msg)
			.prependTo("#bodyContent");
	};

	const logData = await fetch(`/w/api.php?action=query&list=logevents&letype=delete&letitle=${page}&leaction=delete/delete&format=json`)
	    .then(r => r.json());
	
	if (logData.query.logevents.length > 0) {
	    const logLink = mw.util.getUrl("Especial:Registo", { type: "delete", page: page });
	    const groups = mw.config.get("wgUserGroups") || [];
	    const canRestore = groups.includes("sysop") || groups.includes("eliminator");
	    const restoreLink = canRestore ? ` · <a href="${mw.util.getUrl("Especial:Restaurar", { target: page })}">restaurar</a>` : "";

	    showNotice(`🔴 Esta página <b>já foi eliminada</b> anteriormente.<br/><a href="${logLink}">registro</a>${restoreLink}`);
	}

	const templates = await fetch(`/w/api.php?action=parse&page=${page}&prop=templates&format=json`)
		.then(r => r.json())
		.catch(() => null);

	const peTitle = `Páginas para eliminar/${title}`;
	const peCheck = await fetch(`/w/api.php?action=query&titles=Wikipédia:${encodeURIComponent(peTitle)}&format=json`)
		.then(r => r.json());

	const pageId = Object.keys(peCheck.query.pages)[0];
	if (pageId !== "-1") {
		const link = mw.util.getUrl(`Wikipédia:${peTitle}`);
		showNotice(`📁 Esta página <b>já foi discutida em PE</b>: <a href="${link}">${peTitle}</a>`);
	}
	
})();
