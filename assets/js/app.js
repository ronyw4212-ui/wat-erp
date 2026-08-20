document
    .getElementById("loginForm")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        const username =
            document.getElementById("username").value;

        const password =
            document.getElementById("password").value;

        const message =
            document.getElementById("loginMessage");

        if (username === "" || password === "") {
            message.textContent = "Username dan password wajib diisi.";
            return;
        }

        message.textContent = "Login system sedang dipersiapkan.";

    });
