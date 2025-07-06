export const observeTextNodes = (
  root: HTMLElement,
  onText: (txt: string) => void,
  opts: { debounceMs?: number } = {}
) => {
  let buffer: string[] = [];
  let timeout: number | null = null;

  const emit = () => {
    if (buffer.length > 0) {
      buffer.forEach(t => onText(t));
      buffer = [];
    }
  };

  const scheduleEmit = () => {
    if (opts.debounceMs && opts.debounceMs > 0) {
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = window.setTimeout(() => {
        emit();
        timeout = null;
      }, opts.debounceMs);
    } else {
      emit();
    }
  };

  const observer = new MutationObserver(mutations => {
    for (const m of mutations) {
      m.addedNodes.forEach(n => {
        if (n.nodeType === Node.TEXT_NODE && n.textContent) {
          buffer.push(n.textContent);
        } else if (n.nodeType === Node.ELEMENT_NODE) {
          const text = (n as Element).textContent;
          if (text) buffer.push(text);
        }
      });
      if (m.type === 'characterData' && m.target.nodeType === Node.TEXT_NODE) {
        const text = m.target.textContent;
        if (text) buffer.push(text);
      }
    }
    scheduleEmit();
  });

  observer.observe(root, { childList: true, subtree: true, characterData: true });

  return () => {
    if (timeout) {
      clearTimeout(timeout);
    }
    observer.disconnect();
  };
};
