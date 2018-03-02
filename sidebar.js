var $ = Bliss, $$ = $.$;

function render(info) {
	document.body.textContent = "";
	document.body.classList.remove("error");

	for (var header in info) {
		var details = $.create("details", {
			open: true,
			contents: [
				{tag: "summary", textContent: header},
				objectToDl(info[header])
			]
		});

		document.body.append(details);
	}
}

function objectToDl(obj) {
	var dl = $.create("dl");

	for (let label in obj) {
		var value = obj[label];
		var contents = $.type(value) == "object"? objectToDl(value) : value;

		$.contents(dl, [
			{tag: "dt", innerHTML: label},
			{tag: "dd", contents: contents}
		]);
	}

	return dl;
}

function showError(e) {
	document.body.classList.add("error");
	document.body.textContent = e;
}
