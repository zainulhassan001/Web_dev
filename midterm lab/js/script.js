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

// Slick Carousel Initialization
$(function () {
    const $carousel = $('.products-carousel');
    const $counter = $('.slide-counter');
    
    if (!$carousel.length) {
        return;
    }

    $carousel.slick({
        infinite: true,
        slidesToShow: 3,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 5000,
        pauseOnHover: true,
        dots: false,
        arrows: false,
        swipe: true,
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 2
                }
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 1
                }
            }
        ]
    });

    $carousel.on('afterChange', function (event, slick, currentSlide) {
        const index = typeof currentSlide === 'number' ? currentSlide : slick.currentSlide;
        $counter.text('Showing ' + (index + 1) + ' of ' + slick.slideCount);
    });

    const slickInstance = $carousel.slick('getSlick');
    $counter.text('Showing ' + (slickInstance.currentSlide + 1) + ' of ' + slickInstance.slideCount);
    
    // Wire up Previous button
    $('.carousel-prev').on('click', function () {
        $carousel.slick('slickPrev');
    });

    // Wire up Next button
    $('.carousel-next').on('click', function () {
        $carousel.slick('slickNext');
    });

    $carousel.on('mouseenter', '.product-card', function () {
        $carousel.slick('slickPause');
    });

    $carousel.on('mouseleave', '.product-card', function () {
        $carousel.slick('slickPlay');
    });
});
