<<<<<<< HEAD
document.addEventListener('DOMContentLoaded', function () {
    const MOBILE_BREAKPOINT = 768;

    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-menu .nav-link');

    if (!mobileMenuBtn || !navMenu) {
        return;
    }

    const closeMenu = () => {
        navMenu.classList.remove('active');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
    };

    const toggleMenu = () => {
        const isOpen = navMenu.classList.toggle('active');
        mobileMenuBtn.setAttribute('aria-expanded', String(isOpen));
    };

    mobileMenuBtn.addEventListener('click', toggleMenu);

    // Optional bonus: close the menu when a link is selected on smaller screens.
    navLinks.forEach((link) => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= MOBILE_BREAKPOINT) {
                closeMenu();
            }
        });
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > MOBILE_BREAKPOINT) {
            closeMenu();
        }
    });
});
=======
document.addEventListener('DOMContentLoaded', function () {
    const MOBILE_BREAKPOINT = 768;

    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-menu .nav-link');

    if (!mobileMenuBtn || !navMenu) {
        return;
    }

    const closeMenu = () => {
        navMenu.classList.remove('active');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
    };

    const toggleMenu = () => {
        const isOpen = navMenu.classList.toggle('active');
        mobileMenuBtn.setAttribute('aria-expanded', String(isOpen));
    };

    mobileMenuBtn.addEventListener('click', toggleMenu);

    // Optional bonus: close the menu when a link is selected on smaller screens.
    navLinks.forEach((link) => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= MOBILE_BREAKPOINT) {
                closeMenu();
            }
        });
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > MOBILE_BREAKPOINT) {
            closeMenu();
        }
    });
});
>>>>>>> 3e7b61f7285a324edd915c0a137f5e4783131c9f
