function formatObject(obj, o = {}, label) {
	var type = $.type(obj);

	var flags = {...o};

	if (o.dataLabels && label) {
		flags.isData = flags.isData || o.dataLabels.includes(label);
	}

	if (type == "object" || type == "array") {
		var length = Object.keys(obj).length;

		if (length === 0 && label) {
			return $.create({tag: "em", textContent: `(Empty ${type})`, className: "type-empty"});
		}

		var ret = $.create("dl", {className: "type-" + type});

		for (let label in obj) {
			let value = obj[label];

			$.contents(ret, [
				{tag: "dt", innerHTML: label},
				{tag: "dd", contents: formatObject(value, flags, label)}
			]);
		}

		if (flags.isData) {
			// Should it be collapsible?
			var collapsible = JSON.stringify(obj).length > 200;

			if (collapsible) {
				var summary = `${capitalize(type)} (${length} ${type == "object"? "Properties" : "Items"})`;
				ret = $.create("details", {
					contents: [
						{tag: "summary", textContent: summary},
						ret
					]
				});
			}
		}

		return ret;
	}

	// Primitive
	return flags.isData? formatPrimitive(obj) : obj;
}

function capitalize(str) {
	return str[0].toUpperCase() + str.slice(1);
}

function formatPrimitive(value) {
	if (value === null) {
		return $.create({tag: "em", textContent: "(Empty)", className: "type-empty"});
	}

	return JSON.stringify(value);
}
