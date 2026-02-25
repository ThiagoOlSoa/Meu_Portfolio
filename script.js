document.getElementById('ano').textContent = new Date().getFullYear();

const toggleButton = document.getElementById("toggle-theme");
const icon = document.getElementById("theme-icon");
const body = document.body;

function applyTheme(theme) {
  if (theme === "light") {
    body.classList.add("light-mode");
    icon.src = "Imagens/Lua.PNG";
    icon.alt = "Modo Claro";
  } else {
    body.classList.remove("light-mode");
    icon.src = "Imagens/Sol.PNG";
    icon.alt = "Modo Escuro";
  }
}

const currentTheme = localStorage.getItem("theme") || "dark";
applyTheme(currentTheme);

toggleButton.addEventListener("click", () => {
  const isLightMode = body.classList.contains("light-mode");
  const newTheme = isLightMode ? "dark" : "light";
  
  localStorage.setItem("theme", newTheme);
  applyTheme(newTheme);
});

const fadeEls = document.querySelectorAll('.fade-in');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

fadeEls.forEach(el => observer.observe(el));
