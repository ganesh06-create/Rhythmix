const sidebar = document.querySelector(".sidebar");
const sidebarButton = document.getElementById("sidebar-viwer-lines");
const backButton = document.getElementById("backbtn");

const searchInput = document.getElementById("songSearch");
const searchBar = document.querySelector(".searchbar");

const menuItems = document.querySelectorAll(".menu-item");
const container = document.querySelector(".container");

const allowedPages = ["home", "library", "profile", "settings"];

// ------------------------------
// SIDEBAR
// ------------------------------

function openSidebar() {
    if (sidebar.classList.contains("active")) return;

    sidebar.classList.add("active");

    // Add a history entry for closing the sidebar
    history.pushState(
        { ...history.state, sidebar: true },
        "",
        window.location.href
    );
}

function closeSidebar() {
    sidebar.classList.remove("active");
}

sidebarButton.addEventListener("click", (event) => {
    event.stopPropagation();
    openSidebar();
});

backButton.addEventListener("click", () => {
    if (sidebar.classList.contains("active")) {
        history.back();
    }
});

document.addEventListener("click", (event) => {
    if (!sidebar.classList.contains("active")) return;

    const clickedInsideSidebar = sidebar.contains(event.target);
    const clickedSidebarButton = sidebarButton.contains(event.target);

    if (!clickedInsideSidebar && !clickedSidebarButton) {
        history.back();
    }
});

document.addEventListener("keydown", (event) => {
    if (
        event.key === "Escape" &&
        sidebar.classList.contains("active")
    ) {
        history.back();
    }
});

// ------------------------------
// SEARCH BAR
// ------------------------------

if (searchInput && searchBar) {
    searchInput.addEventListener("focus", () => {
        searchBar.classList.add("searchbar-focus");
    });

    searchInput.addEventListener("blur", () => {
        searchBar.classList.remove("searchbar-focus");
    });
}

searchInput.addEventListener("input", async () => {

    const message = searchInput.value;

    try {
        const response = await fetch("/api/search", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: message
            })
        });

        const data = await response.json();

        console.log(data);

    } catch (error) {
        console.error(error);
    }

});