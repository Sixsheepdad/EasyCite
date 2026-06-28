var CiteBridgeContent = {
  pluginID: "citebridge@easycite.com",
  registeredMenuID: null,
  menuItemID: "citebridge-send-to-cursor-menuitem",
  menuSeparatorID: "citebridge-send-to-cursor-separator",

  async registerMenus(pluginID) {
    this.pluginID = pluginID;
    Zotero.debug("CiteBridge: registerMenus");
    if ("MenuManager" in Zotero) {
      this.registeredMenuID = Zotero.MenuManager.registerMenu({
        menuID: "citebridge-send-to-cursor",
        pluginID,
        target: "main/library/item",
        menus: [
          {
            menuType: "menuitem",
            label: "Send to Cursor Project",
            onShowing: (_event, context) => {
              context.setEnabled(this.getSelectedRegularItems().length > 0);
            },
            onCommand: async () => {
              await CiteBridgeContent.runSendSelectedItems();
            }
          }
        ]
      });
    }

    for (const win of Services.wm.getEnumerator("navigator:browser")) {
      await this.installWindowMenu(win);
    }
  },

  async unregisterMenus() {
    if (this.registeredMenuID) {
      Zotero.MenuManager.unregisterMenu(this.registeredMenuID);
      this.registeredMenuID = null;
    }
    for (const win of Services.wm.getEnumerator("navigator:browser")) {
      await this.uninstallWindowMenu(win);
    }
  },

  async installWindowMenu(win) {
    const doc = win.document;
    const itemMenu = doc.getElementById("zotero-itemmenu");
    if (!itemMenu || doc.getElementById(this.menuItemID)) return;

    const separator = doc.createXULElement("menuseparator");
    separator.id = this.menuSeparatorID;

    const menuItem = doc.createXULElement("menuitem");
    menuItem.id = this.menuItemID;
    menuItem.setAttribute("label", "Send to Cursor Project");
    menuItem.addEventListener("command", async () => {
      await CiteBridgeContent.runSendSelectedItems();
    });

    const refreshState = () => {
      menuItem.disabled = this.getSelectedRegularItems().length === 0;
    };
    itemMenu.addEventListener("popupshowing", refreshState);
    menuItem._citebridgeRefreshState = refreshState;

    itemMenu.appendChild(separator);
    itemMenu.appendChild(menuItem);
    Zotero.debug("CiteBridge: installed fallback item menu");
  },

  async uninstallWindowMenu(win) {
    const doc = win.document;
    const itemMenu = doc.getElementById("zotero-itemmenu");
    const menuItem = doc.getElementById(this.menuItemID);
    if (itemMenu && menuItem?._citebridgeRefreshState) {
      itemMenu.removeEventListener("popupshowing", menuItem._citebridgeRefreshState);
    }
    doc.getElementById(this.menuItemID)?.remove();
    doc.getElementById(this.menuSeparatorID)?.remove();
  },

  getSelectedRegularItems() {
    try {
      const pane = Zotero.getActiveZoteroPane();
      return (pane?.getSelectedItems() || []).filter((item) => item?.isRegularItem?.());
    } catch {
      return [];
    }
  },

  async runSendSelectedItems() {
    Zotero.debug("CiteBridge: menu command clicked");
    try {
      await this.sendSelectedItems(this.getSelectedRegularItems());
    } catch (error) {
      const message = error?.stack || error?.message || String(error);
      Zotero.debug(`CiteBridge: send failed: ${message}`);
      this.alert("Send failed", message);
    }
  },

  async sendSelectedItems(items) {
    Zotero.debug(`CiteBridge: sendSelectedItems with ${items?.length || 0} regular item(s)`);
    const regularItems = items.filter((item) => item.isRegularItem());
    if (!regularItems.length) {
      this.alert("CiteBridge", "No regular Zotero items were selected.");
      return;
    }

    const registry = await this.readRegistry();
    Zotero.debug(`CiteBridge: registry has ${registry.projects?.length || 0} project(s)`);
    const project = this.selectProject(registry);
    if (!project) {
      this.alert("CiteBridge", "No CiteBridge Cursor project was found. Initialize a project in Cursor first.");
      return;
    }
    Zotero.debug(`CiteBridge: selected project ${project.projectName} at ${project.rootPath}`);

    const requestId = `${this.timestamp()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    const payload = {
      protocolVersion: 1,
      requestId,
      action: "importItems",
      source: "zotero",
      createdAt: new Date().toISOString(),
      targetProjectId: project.projectId,
      projectToken: project.projectToken,
      items: []
    };

    for (const item of regularItems) {
      payload.items.push(await this.serializeItem(item));
    }

    await IOUtils.makeDirectory(project.inboxDir, { ignoreExisting: true });
    const payloadPath = PathUtils.join(project.inboxDir, `${requestId}.json`);
    await IOUtils.writeUTF8(payloadPath, `${JSON.stringify(payload, null, 2)}\n`);
    Zotero.debug(`CiteBridge: wrote payload ${payloadPath}`);
    this.alert("CiteBridge", `Sent ${payload.items.length} item(s) to ${project.projectName}.`);
  },

  async readRegistry() {
    const registryPath = PathUtils.join(this.getHomeDir(), ".citebridge", "projects.json");
    Zotero.debug(`CiteBridge: reading registry ${registryPath}`);
    try {
      return JSON.parse(await IOUtils.readUTF8(registryPath));
    } catch (error) {
      Zotero.debug(`CiteBridge: failed to read registry: ${error?.message || error}`);
      return { version: 1, projects: [] };
    }
  },

  getHomeDir() {
    try {
      return Services.dirsvc.get("Home", Components.interfaces.nsIFile).path;
    } catch {}
    try {
      return Services.env.get("USERPROFILE") || Services.env.get("HOME");
    } catch {}
    throw new Error("Could not determine the user home directory.");
  },

  selectProject(registry) {
    if (!registry.projects?.length) return null;
    const explicitActive = registry.projects.find((project) => project.projectId === registry.activeProjectId);
    if (explicitActive) return explicitActive;

    const active = registry.projects.find((project) => project.active);
    if (active) return active;

    const lastActive = registry.projects.find((project) => project.projectId === registry.lastActiveProjectId);
    return lastActive || registry.projects[0];
  },

  async serializeItem(item) {
    const date = item.getField("date") || "";
    const attachments = await this.serializeAttachments(item);
    return {
      libraryType: item.library.libraryType || "user",
      libraryId: String(item.libraryID || 0),
      itemKey: item.key,
      itemType: item.itemType,
      title: item.getField("title") || "",
      creators: item.getCreators().map((creator) => ({
        creatorType: creator.creatorType,
        firstName: creator.firstName,
        lastName: creator.lastName,
        name: creator.name
      })),
      year: (date.match(/\d{4}/) || [""])[0],
      date,
      doi: item.getField("DOI") || "",
      publicationTitle: item.getField("publicationTitle") || item.getField("conferenceName") || "",
      volume: item.getField("volume") || "",
      issue: item.getField("issue") || "",
      pages: item.getField("pages") || "",
      url: item.getField("url") || "",
      abstractNote: item.getField("abstractNote") || "",
      zoteroURI: Zotero.URI.getItemURI(item),
      attachments,
      bibtex: null,
      preferredCitationKey: item.getField("citationKey") || null
    };
  },

  async serializeAttachments(item) {
    const output = [];
    for (const attachmentID of item.getAttachments()) {
      const attachment = await Zotero.Items.getAsync(attachmentID);
      if (!attachment) continue;
      let filePath = "";
      try {
        filePath = await attachment.getFilePathAsync();
      } catch {
        filePath = "";
      }
      const filename = filePath ? PathUtils.filename(filePath) : "";
      const isPdf = attachment.attachmentContentType === "application/pdf" || filename.toLowerCase().endsWith(".pdf");
      if (isPdf && filePath) {
        output.push({
          type: "pdf",
          title: attachment.getField("title") || filename,
          path: filePath,
          filename
        });
      }
    }
    return output;
  },

  alert(title, message) {
    try {
      Services.prompt.alert(null, title, message);
    } catch {
      Zotero.alert(null, title, message);
    }
  },

  timestamp() {
    const date = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  }
};
