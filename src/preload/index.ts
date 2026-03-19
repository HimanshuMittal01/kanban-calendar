import { contextBridge, ipcRenderer } from 'electron'

const storeAPI = {
  // Synchronous read — blocks until data is returned, no race condition
  get: (): string | null => ipcRenderer.sendSync('store:get-sync'),
  // Async write — fire and forget on state changes
  set: (data: string): void => { ipcRenderer.invoke('store:set', data) },
}

contextBridge.exposeInMainWorld('store', storeAPI)
