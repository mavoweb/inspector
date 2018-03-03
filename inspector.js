chrome.devtools.panels.elements.createSidebarPane(
	"Mavo",
	function(sidebar) {
		sidebar.setPage("sidebar.html");

		sidebar.onShown.addListener(function(window) {
			window.sidebar = sidebar;
		});
});
