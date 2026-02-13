// Network status detection for adaptive loading
export function getNetworkStatus() {
  const conn = (navigator as any).connection;
  if (!conn) return { isSlow: false, saveData: false, type: 'unknown' as string, downlink: undefined as number | undefined };

  return {
    isSlow: conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g',
    saveData: conn.saveData || false,
    type: (conn.effectiveType || 'unknown') as string,
    downlink: conn.downlink as number | undefined,
  };
}

export function useNetworkStatus() {
  return { getConnection: getNetworkStatus };
}
