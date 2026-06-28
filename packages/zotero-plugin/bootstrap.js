var CiteBridge = {
  pluginID: "citebridge@easycite.com",
  registeredMenuID: null,
  rootURI: null,

  async startup({ id, rootURI, resourceURI }) {
    this.pluginID = id;
    this.rootURI = rootURI || resourceURI?.spec;
    Zotero.debug("CiteBridge: startup");
    Services.scriptloader.loadSubScript(`${this.rootURI}content/citebridge.js`);
    await CiteBridgeContent.registerMenus(this.pluginID);
  },

  async shutdown() {
    if (this.registeredMenuID) {
      Zotero.MenuManager.unregisterMenu(this.registeredMenuID);
      this.registeredMenuID = null;
    }
    if (typeof CiteBridgeContent !== "undefined") {
      await CiteBridgeContent.unregisterMenus();
    }
  },

  async onMainWindowLoad({ window }) {
    Zotero.debug("CiteBridge: main window load");
    if (typeof CiteBridgeContent !== "undefined") {
      await CiteBridgeContent.installWindowMenu(window);
    }
  },

  async onMainWindowUnload({ window }) {
    if (typeof CiteBridgeContent !== "undefined") {
      await CiteBridgeContent.uninstallWindowMenu(window);
    }
  },

  install() {},
  uninstall() {}
};

async function startup(data, reason) {
  await CiteBridge.startup(data, reason);
}

async function shutdown(data, reason) {
  await CiteBridge.shutdown(data, reason);
}

async function onMainWindowLoad(data, reason) {
  await CiteBridge.onMainWindowLoad(data, reason);
}

async function onMainWindowUnload(data, reason) {
  await CiteBridge.onMainWindowUnload(data, reason);
}

function install(data, reason) {
  CiteBridge.install(data, reason);
}

function uninstall(data, reason) {
  CiteBridge.uninstall(data, reason);
}
