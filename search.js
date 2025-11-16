/**
 * Módulo para implementar una funcionalidad de búsqueda tipo Ctrl+F personalizada.
 */
document.addEventListener('DOMContentLoaded', () => {
  const searchBar = document.getElementById('search-bar');
  const searchInput = document.getElementById('search-input');
  const searchMatches = document.getElementById('search-matches');
  const prevButton = document.getElementById('search-prev');
  const nextButton = document.getElementById('search-next');
  const closeButton = document.getElementById('search-close');

  let matches = [];
  let currentMatchIndex = -1;
  let originalBodyHTML = '';

  /**
   * Muestra la barra de búsqueda y enfoca el input.
   */
  const showSearchBar = () => {
    searchBar.classList.remove('hidden');
    searchInput.focus();
    searchInput.select();
    if (searchInput.value) {
      findMatches();
    }
  };

  /**
   * Oculta la barra de búsqueda y limpia los resultados.
   */
  const hideSearchBar = () => {
    searchBar.classList.add('hidden');
    clearHighlights();
    searchInput.value = '';
    updateMatchesCount(0, 0);
  };

  /**
   * Elimina todos los resaltados de búsqueda de la página.
   */
  const clearHighlights = () => {
    if (originalBodyHTML) {
      // Restaura el contenido original para eliminar los <mark>
      document.body.innerHTML = originalBodyHTML;
      // Es necesario volver a añadir los listeners a los nuevos elementos del DOM si se pierden.
      // En este caso, como los botones de búsqueda están fuera del área restaurada, no se ven afectados.
      // Si otros elementos dinámicos dejan de funcionar, habría que reinicializarlos aquí.
    }
    matches = [];
    currentMatchIndex = -1;
  };

  /**
   * Busca y resalta las coincidencias en la página.
   */
  const findMatches = () => {
    clearHighlights();
    const searchTerm = searchInput.value;

    if (searchTerm.length < 1) {
      updateMatchesCount(0, 0);
      return;
    }

    // Guardamos una copia del HTML del body antes de modificarlo
    originalBodyHTML = document.body.innerHTML;

    const regex = new RegExp(searchTerm, 'gi');
    const bodyHtml = document.body.innerHTML;

    // Expresión regular para evitar reemplazar dentro de ciertos tags y atributos
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    const nodesToReplace = [];

    while (node = walker.nextNode()) {
        // Ignorar texto dentro de scripts, styles, y la propia barra de búsqueda
        if (node.parentElement.closest('script, style, #search-bar')) {
            continue;
        }
        if (regex.test(node.nodeValue)) {
            const newNode = document.createElement('span');
            newNode.innerHTML = node.nodeValue.replace(regex, match => `<mark class="search-highlight">${match}</mark>`);
            nodesToReplace.push({ oldNode: node, newNode });
        }
    }

    nodesToReplace.forEach(item => {
        item.oldNode.parentNode.replaceChild(item.newNode, item.oldNode);
    });

    matches = Array.from(document.querySelectorAll('.search-highlight'));
    if (matches.length > 0) {
      currentMatchIndex = 0;
      navigateToMatch(currentMatchIndex);
    }
    updateMatchesCount(matches.length, matches.length > 0 ? currentMatchIndex + 1 : 0);
  };

  /**
   * Actualiza el contador de coincidencias (ej: 1/10).
   * @param {number} total - El número total de coincidencias.
   * @param {number} current - El índice actual.
   */
  const updateMatchesCount = (total, current) => {
    searchMatches.textContent = `${current}/${total}`;
    prevButton.disabled = total === 0;
    nextButton.disabled = total === 0;
  };

  /**
   * Navega a una coincidencia específica y la resalta.
   * @param {number} index - El índice de la coincidencia a la que navegar.
   */
  const navigateToMatch = (index) => {
    if (index < 0 || index >= matches.length) return;

    matches.forEach(m => m.style.backgroundColor = ''); // Reset previous
    currentMatchIndex = index;
    const currentMatch = matches[currentMatchIndex];
    currentMatch.style.backgroundColor = '#facc15'; // yellow-400
    currentMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
    updateMatchesCount(matches.length, currentMatchIndex + 1);
  };

  // --- Event Listeners ---

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      showSearchBar();
    }
    if (e.key === 'Escape' && !searchBar.classList.contains('hidden')) {
      hideSearchBar();
    }
  });

  searchInput.addEventListener('input', findMatches);
  closeButton.addEventListener('click', hideSearchBar);

  nextButton.addEventListener('click', () => {
    if (matches.length > 0) {
      const nextIndex = (currentMatchIndex + 1) % matches.length;
      navigateToMatch(nextIndex);
      searchInput.focus(); // Mantiene el foco en el input
    }
  });

  prevButton.addEventListener('click', () => {
    if (matches.length > 0) {
      const prevIndex = (currentMatchIndex - 1 + matches.length) % matches.length;
      navigateToMatch(prevIndex);
      searchInput.focus(); // Mantiene el foco en el input
    }
  });
});