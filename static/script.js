// document.getElementById('toggle-menu').addEventListener('click', function() {
//   const sideMenu = document.getElementById('side-menu');
//   sideMenu.classList.toggle('translate-y-full');
//   sideMenu.classList.toggle('translate-y-0');
//   sideMenu.classList.toggle('-translate-x-full');
//   sideMenu.classList.toggle('translate-x-0');
// });

// const toggleButton = document.getElementById('toggle-menu');
//     const sideMenu = document.getElementById('side-menu');

//     toggleButton.addEventListener('click', function() {
//         sideMenu.classList.toggle('-translate-y-full');
//         sideMenu.classList.toggle('translate-y-0');
//     });

    document.addEventListener('DOMContentLoaded', (event) => {
      document.querySelectorAll('body *').forEach(element => {
        element.addEventListener('touchstart', function() {
         
        });
      });
    });

    document.addEventListener('DOMContentLoaded', (event) => {
        const menuItems = document.getElementById('menuItems');
        let isDown = false;
        let startX;
        let scrollLeft;

        menuItems.addEventListener('mousedown', (e) => {
            isDown = true;
            menuItems.classList.add('active');
            startX = e.pageX - menuItems.offsetLeft;
            scrollLeft = menuItems.scrollLeft;
        });

        menuItems.addEventListener('mouseleave', () => {
            isDown = false;
            menuItems.classList.remove('active');
        });

        menuItems.addEventListener('mouseup', () => {
            isDown = false;
            menuItems.classList.remove('active');
        });

        menuItems.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - menuItems.offsetLeft;
            const walk = (x - startX) * 3; //scroll-fast
            menuItems.scrollLeft = scrollLeft - walk;
        });
    });

    