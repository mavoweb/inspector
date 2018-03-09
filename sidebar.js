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
		var ret = {
			"Property": node.property || "(Root)",
			"Type": node.nodeType,
			"Data": JSON.parse(Mavo.safeToJSON(node.liveData))
		};

		if (node.collection) {
			ret.Collection = getNodeInfo(node.collection);
		}

		return ret;
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
	var node = Mavo.Node.getClosest(element);
	node = node.collection? node : node.group;
	var data = node.getLiveData();
	var expression = new Mavo.Expression(code);
	var value = expression.eval(data);

	if (value instanceof Error) {
		return {
			isException: true,
			value: value.message
		};
	}

	var reserialized = JSON.parse(Mavo.safeToJSON(value));
	console.log(code, "=", reserialized);
	return reserialized;
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
							{tag: "input", name: "expression", autocomplete: "on"},
							{tag: "button", textContent: "Run"}
						],
						events: {
							submit: function(evt) {
								evt.preventDefault();
								var dd = this.parentNode;
								var output = $("output", dd) || $.create("output", {inside: dd});
								var expr = this.expression.value;

								eval(`(${quickEval})($0, ${JSON.stringify(expr)})`)
								.then(value => {
									output.className = "";
									output.textContent = "";

									if (value && value.isException && value.value) {
										return Promise.reject(value);
									}

									output.append(formatObject(value, {isData: true}));
								})
								.catch(err => {
									output.className = "error";
									output.textContent = friendlyError(err.value, expr);
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

function friendlyError(message, expr) {
	var typeRegex = /^([A-Z][a-z]+)Error: /;
	var type = message.match(typeRegex);
	type = type? type[1].toLowerCase() : "";
	message = message.replace(typeRegex, "");
	var label = !type || type == "syntax"? "Sorry, I don’t understand this expression" : `There has been a ${type}-related issue`;

	// Friendlify common errors
	var unexpected = message.match(/^Unexpected token (\S+)/);

	if (unexpected) {
		unexpected = unexpected[1];

		message = "Something is missing, or there are extra characters. Check for ";

		if (unexpected == ";") {
			message += "missing ) or extra (.";
		}
		else if (unexpected == ")") {
			message += "missing operands or extra ).";
		}
		else {
			message += "missing operands or other terms, " + (expr.indexOf(unexpected) > -1? `especially before the ${unexpected}.` : ".");
		}
	}
	else if (message == "Unexpected token ILLEGAL" || message == "Invalid or unexpected token") {
		message = "There is an invalid character somewhere.";
	}

	// Non-developers don't know wtf a token is.
	message = message.replace(/\s+token\s+/g, " ");

	return `😳 ${label}: ${message}`;
}

function showError(e) {
	document.body.classList.add("error");
	document.body.textContent = e;
}

onload = updateSidebar;
