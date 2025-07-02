document.getElementById('ano').textContent = new Date().getFullYear();

const toggleButton = document.getElementById("toggle-theme");
const body = document.body;

if (localStorage.getItem("theme") === "light") {
  body.classList.add("light-mode");
}

toggleButton.addEventListener("click", () => {
  body.classList.toggle("light-mode");

  const icon = document.getElementById("theme-icon");

  if (body.classList.contains("light-mode")) {
    localStorage.setItem("theme", "light");
    icon.src = "Imagens/Lua.PNG";
    icon.alt = "Modo Claro";
  } else {
    localStorage.setItem("theme", "dark");
    icon.src = "Imagens/Sol.PNG";
    icon.alt = "Modo Escuro";
  }
});

if (localStorage.getItem("theme") === "light") {
  body.classList.add("light-mode");
}

const icon = document.getElementById("theme-icon");
if (icon) {
  icon.src = body.classList.contains("light-mode") ? "Imagens/Lua.PNG" : "Imagens/Sol.PNG";
  icon.alt = body.classList.contains("light-mode") ? "Modo Claro" : "Modo Escuro";
}

const fadeEls = document.querySelectorAll('.fade-in');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, {
  threshold: 0.1
});

fadeEls.forEach(el => observer.observe(el));