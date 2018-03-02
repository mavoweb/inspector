var $ = Bliss, $$ = $.$;

function render(info) {
	document.body.textContent = "";
	document.body.classList.remove("error");

	for (var header in info) {
		var dl, details = $.create("details", {
			open: true,
			contents: [
				{tag: "summary", textContent: header},
				dl = $.create("dl")
			]
		});

		for (var label in info[header]) {
			$.contents(dl, [
				{tag: "dt", innerHTML: label},
				{tag: "dd", innerHTML: info[header][label]}
			]);
		}

		document.body.append(details);
	}
}

function showError(e) {
	document.body.classList.add("error");
	document.body.textContent = e;
}
