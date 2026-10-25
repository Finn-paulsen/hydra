/**
 * useTerminalPersistence Hook
 * Speichert und lädt Terminal-History automatisch
 */

import { useEffect, useCallback } from 'react';
import { storageManager, StorageKeys } from '../utils/storageManager';

export function useTerminalPersistence(_history: unknown, onLoadHistory?: (commands: string[]) => void) {
  // Lade History beim Mount
  useEffect(() => {
    (async () => {
      const savedHistory = await storageManager.getItem(StorageKeys.TERMINAL_HISTORY);
      if (savedHistory && savedHistory.length > 0) {
        const commands = savedHistory.map((item: { command: string }) => item.command);
        onLoadHistory?.(commands);
      }
    })();
  }, [onLoadHistory]);

  // Speichere jeden neuen Befehl
  const saveCommand = useCallback(async (command: string, output = '', exitCode = 0) => {
    await storageManager.addTerminalCommand(command, output, exitCode);
  }, []);

  // Gib alle favorisierten Commands zurück
  const getFavoritedCommands = useCallback(async () => {
    const history = await storageManager.getItem(StorageKeys.TERMINAL_HISTORY);
    if (!history) return [];

    // Zähle die Häufigkeit der Commands
    const frequency: Record<string, number> = {};
    history.forEach((item: { command: string }) => {
      const cmd = item.command.split(' ')[0];
      frequency[cmd] = (frequency[cmd] || 0) + 1;
    });

    // Sortiere nach Häufigkeit
    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([cmd, count]) => ({ command: cmd, count }));
  }, []);

  // Suche in der History
  const searchHistory = useCallback(async (query: string) => {
    return await storageManager.getTerminalHistory(query);
  }, []);

  // Exportiere die History als JSON
  const exportHistory = useCallback(async () => {
    const history = await storageManager.getItem(StorageKeys.TERMINAL_HISTORY);
    return JSON.stringify(history, null, 2);
  }, []);

  // Lösche die History
  const clearHistory = useCallback(async () => {
    await storageManager.removeItem(StorageKeys.TERMINAL_HISTORY);
  }, []);

  return {
    saveCommand,
    getFavoritedCommands,
    searchHistory,
    exportHistory,
    clearHistory
  };
}

export default useTerminalPersistence;
