type ToastType = 'success' | 'error' | 'info' | 'warning';

export function showToast(message: string, type: ToastType = 'info', durationMs = 3000) {
  const colorMap: Record<ToastType, string> = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-slate-800',
    warning: 'bg-yellow-600',
  };

  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 ${colorMap[type]} text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center space-x-2`;
  toast.style.transition = 'opacity 200ms ease-in-out, transform 200ms ease-in-out';
  toast.style.opacity = '0';
  toast.style.transform = 'translateY(-6px)';
  toast.textContent = message;

  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  window.setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-6px)';
    window.setTimeout(() => {
      if (toast.parentNode) document.body.removeChild(toast);
    }, 200);
  }, durationMs);
}


