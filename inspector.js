{
var MavoPanel, sidebarWindow;

function eval(code) {
	return new Promise((resolve, reject) => {
		chrome.devtools.inspectedWindow.eval(code, (result, exception) => {
			if (exception) {
				reject(exception);
			}
			else {
				resolve(result);
			}
		});
	});
}

function getInfo(element) {
	var node = Mavo.Node.get(element);
	var ret = {};

	if (node) {
		ret["Mavo Node"] = {
			"Property": node.property,
			"Type": node.nodeType,
			"Data": Mavo.safeToJSON(node.liveData) + ""
		};
	}

	var expressions = Mavo.DOMExpression.search(element);

	if (expressions && expressions.length) {
		ret.Expressions = {};

		for (let e of expressions) {
			var value = e.value.length === 1? e.value[0] : e.value;
			ret.Expressions[e.attribute || "<em>(Text Content)</em>"] = {
				Template: e.expression,
				"Current value": Mavo.safeToJSON(value) + ""
			};
		}
	}

	return ret;
}

async function updateSidebar(sidebar) {
	var hasMavo = await eval("typeof Mavo !== 'undefined'");

	if (!hasMavo) {
		return;
	}

	try {
		var info = await eval(`
			(${getInfo})($0)
		`);

		sidebarWindow.render(info);
	}
	catch (e) {
		console.error(e);
		sidebarWindow.showError(e);
	}
}

chrome.devtools.panels.elements.createSidebarPane(
	"Mavo",
	function(sidebar) {
		MavoPanel = sidebar;

		sidebar.setPage("sidebar.html");

		sidebar.onShown.addListener(function(window) {
			window.sidebar = sidebar;
			sidebarWindow = window;
			updateSidebar(sidebar);
		});

		chrome.devtools.panels.elements.onSelectionChanged.addListener(async function() {
			updateSidebar(sidebar);
		});
});

}
