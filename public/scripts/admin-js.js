document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.getElementById('adminSidebar');
    const topNav = document.getElementById('topNav');
    const contentWrapper = document.getElementById('contentWrapper');
    const toggleBtn = document.getElementById('sidebarToggleBtn');
    const closeBtn = document.getElementById('sidebarCloseBtn');
    const overlay = document.getElementById('sidebarOverlay');
    const body = document.body;
    
    // Function to open sidebar
    function openSidebar() {
        // First animate the top nav up
        body.classList.add('sidebar-animating');
        
        // After a short delay, show the sidebar
        setTimeout(function() {
            body.classList.remove('sidebar-animating');
            body.classList.add('sidebar-open');
            body.classList.remove('sidebar-closed');
        }, 300);
    }
    
    // Function to close sidebar
    function closeSidebar() {
        // Hide the sidebar first
        body.classList.remove('sidebar-open');
        body.classList.add('sidebar-closed');
        
        // After sidebar is hidden, bring top nav back down
        if (window.innerWidth < 768) {
            setTimeout(function() {
                topNav.classList.remove('nav-up');
            }, 300);
        }
    }
    
    // Toggle sidebar
    toggleBtn.addEventListener('click', function() {
        if (body.classList.contains('sidebar-open')) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });
    
    // Close sidebar with close button
    closeBtn.addEventListener('click', closeSidebar);
    
    // Close sidebar when overlay is clicked
    overlay.addEventListener('click', closeSidebar);
    
    // Close sidebar when clicking on a link (for mobile)
    const navLinks = document.querySelectorAll('.sidebar .nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth < 768) {
                closeSidebar();
            }
        });
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth >= 768) {
            body.classList.remove('sidebar-animating');
            if (body.classList.contains('sidebar-open')) {
                topNav.classList.remove('nav-up');
            }
        }
    });
});