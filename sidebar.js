var $ = Bliss, $$ = $.$;

chrome.devtools.panels.elements.onSelectionChanged.addListener(async function() {
	updateSidebar();
});

async function updateSidebar() {
	var hasMavo = await eval("typeof Mavo !== 'undefined'");

	if (!hasMavo) {
		return;
	}

	try {
		var info = await eval(`(${getInfo})($0)`);

		render(info);
	}
	catch (e) {
		console.error(e);
		showError(e);
	}
}

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

// Beware: This runs in the context of the page!!
function getInfo(element) {
	var node = Mavo.Node.get(element);
	var closestNode = node || Mavo.Node.getClosest(element);
	var ret = {};

	function getNodeInfo(node) {
		return {
			"Property": node.property,
			"Type": node.nodeType,
			"Data": JSON.parse(Mavo.safeToJSON(node.liveData))
		};
	}

	if (node) {
		ret["Node"] = getNodeInfo(node);
	}
	else if (closestNode) {
		ret["Closest Node"] = getNodeInfo(closestNode);
	}

	if (closestNode) {
		var expressions = Mavo.DOMExpression.search(element);

		ret.Expressions = {};

		if (expressions && expressions.length) {
			for (let e of expressions) {
				var value = e.value.length === 1? e.value[0] : e.value;
				ret.Expressions[e.attribute || '<em class="de-emphasized">(Text Content)</em>'] = {
					Template: e.expression,
					"Current value": JSON.parse(Mavo.safeToJSON(value))
				};
			}
		}
	}

	return ret;
}

// Beware: This runs in the context of the page!!
function quickEval(element, code) {
	var node = Mavo.Node.getClosest(element).group;
	var data = node.getData({live: true});
	var expression = new Mavo.Expression(code);
	var value = JSON.parse(Mavo.safeToJSON(expression.eval(data)));
	console.log(code, "=", value);
	return value;
}

function render(info) {
	document.body.textContent = "";
	document.body.classList.remove("error");

	for (var header in info) {
		var dl, details = $.create("details", {
			open: true,
			contents: [
				{tag: "summary", textContent: header},
				dl = formatObject(info[header], {
					dataLabels: ["Data", "Current value"]
				})
			]
		});

		if (header == "Expressions") {
			var qe = $.contents(document.createDocumentFragment(), [
				{tag: "dt", textContent: "Quick eval"},
				{
					tag: "dd",
					contents: {
						tag: "form",
						className: "quick-eval",
						contents: [
							{tag: "input", name: "expression"},
							{tag: "button", textContent: "Run"}
						],
						events: {
							submit: function(evt) {
								evt.preventDefault();
								var dd = this.parentNode;
								var output = $("output", dd) || $.create("output", {inside: dd});

								eval(`(${quickEval})($0, "${this.expression.value}")`).then(value => {
									output.textContent = "";
									output.append(formatObject(value, {isData: true}));
								});
							}
						}
					}
				}
			]);

			dl.prepend(qe);
		}

		document.body.append(details);
	}
}

function showError(e) {
	document.body.classList.add("error");
	document.body.textContent = e;
}

onload = updateSidebar;
