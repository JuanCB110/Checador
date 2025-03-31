document.addEventListener("DOMContentLoaded", function () {
    const botones = document.querySelectorAll(".barra-opciones button");

    botones.forEach((boton) => {
        boton.addEventListener("click", function () {
        // Remover la clase 'activo' de todos los botones
        botones.forEach((btn) => btn.classList.remove("activo"));
        // Agregar la clase 'activo' al botón seleccionado
        this.classList.add("activo");
        });
    });
});
