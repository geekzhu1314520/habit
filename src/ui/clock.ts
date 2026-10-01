export function watchDate(today: () => string, update: () => void): () => void {
  let previous = today();
  const check = () => {
    if (previous !== today()) {
      previous = today();
      update();
    }
  };
  const timer = window.setInterval(check, 1000);
  window.addEventListener("focus", check);
  document.addEventListener("visibilitychange", check);
  return () => {
    window.clearInterval(timer);
    window.removeEventListener("focus", check);
    document.removeEventListener("visibilitychange", check);
  };
}
