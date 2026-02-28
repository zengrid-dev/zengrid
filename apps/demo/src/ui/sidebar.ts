/**
 * Setup Sidebar Menu - Collapsible categories and sidebar toggle
 */
export function setupSidebarMenu() {
  // Category collapse/expand
  const categoryHeaders = document.querySelectorAll('.category-header');

  categoryHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const category = header.getAttribute('data-category');
      const content = document.querySelector(`[data-content="${category}"]`);

      if (content && header) {
        // Toggle collapsed state
        header.classList.toggle('collapsed');
        content.classList.toggle('collapsed');
      }
    });
  });

  // Sidebar toggle
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');

  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');

      // Update button title (icon stays the same)
      if (sidebar.classList.contains('collapsed')) {
        sidebarToggle.title = 'Show Sidebar';
      } else {
        sidebarToggle.title = 'Hide Sidebar';
      }
    });
  }

}
