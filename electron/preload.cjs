"use strict";

const { contextBridge, ipcRenderer } = require("electron");

function subscribe(channel, callback) {
  const listener = (_event, payload) => callback(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

contextBridge.exposeInMainWorld("beichen", {
  bootstrap: () => ipcRenderer.invoke("app:bootstrap"),
  command: (payload) => ipcRenderer.invoke("pi:command", payload),
  raw: (payload) => ipcRenderer.invoke("pi:raw", payload),
  restartBackend: (patch) => ipcRenderer.invoke("backend:restart", patch),
  setModel: (provider, modelId) => ipcRenderer.invoke("backend:set-model", provider, modelId),
  setThinking: (level) => ipcRenderer.invoke("backend:set-thinking", level),
  listCustomApis: () => ipcRenderer.invoke("custom-api:list"),
  saveCustomApi: (input) => ipcRenderer.invoke("custom-api:save", input),
  deleteCustomApi: (providerId) => ipcRenderer.invoke("custom-api:delete", providerId),
  listSessions: () => ipcRenderer.invoke("sessions:list"),
  switchSession: (sessionPath) => ipcRenderer.invoke("sessions:switch", sessionPath),
  listProviders: () => ipcRenderer.invoke("auth:list-providers"),
  listModels: (providerId) => ipcRenderer.invoke("auth:list-models", providerId),
  login: (providerId, type) => ipcRenderer.invoke("auth:login", providerId, type),
  logout: (providerId) => ipcRenderer.invoke("auth:logout", providerId),
  replyAuth: (id, value) => ipcRenderer.invoke("auth:reply", id, value),
  cancelAuth: (id) => ipcRenderer.invoke("auth:cancel", id),
  pickDirectory: () => ipcRenderer.invoke("dialog:pick-directory"),
  openPluginRoot: () => ipcRenderer.invoke("plugins:open-root"),
  showItem: (filePath) => ipcRenderer.invoke("shell:show-item", filePath),
  markStarSeen: () => ipcRenderer.invoke("app:mark-star"),
  acceptSecurityNotice: () => ipcRenderer.invoke("app:accept-security-notice"),
  newWindow: () => ipcRenderer.invoke("window:new"),
  minimize: () => ipcRenderer.invoke("window:minimize"),
  toggleMaximize: () => ipcRenderer.invoke("window:toggle-maximize"),
  close: () => ipcRenderer.invoke("window:close"),
  onPiEvent: (callback) => subscribe("pi:event", callback),
  onBackendStatus: (callback) => subscribe("backend:status", callback),
  onAuthPrompt: (callback) => subscribe("auth:prompt", callback),
  onAuthEvent: (callback) => subscribe("auth:event", callback),
});
