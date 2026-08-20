// ========================================
// WAT ERP - SUPABASE AUTHENTICATION
// ========================================

const { createClient } = window.supabase;

const supabaseClient = createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


// ========================================
// LOGIN
// ========================================

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const loginButton = document.getElementById("loginButton");

if (loginForm) {

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const email = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;

        loginMessage.textContent = "";
        loginButton.disabled = true;
        loginButton.textContent = "MEMPROSES...";

        try {

            // ================================
            // 1. LOGIN SUPABASE AUTH
            // ================================

            const { data, error } =
                await supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password
                });

            if (error) {
                throw error;
            }

            const user = data.user;

            if (!user) {
                throw new Error("User tidak ditemukan.");
            }


            // ================================
            // 2. AMBIL PROFILE USER
            // ================================

            const { data: profile, error: profileError } =
                await supabaseClient
                    .from("profiles")
                    .select("id, full_name, email, role, status")
                    .eq("id", user.id)
                    .single();

            if (profileError) {
                throw new Error(
                    "Profile user tidak ditemukan."
                );
            }


            // ================================
            // 3. CEK STATUS AKUN
            // ================================

            if (profile.status !== "ACTIVE") {

                await supabaseClient.auth.signOut();

                throw new Error(
                    "Akun Anda tidak aktif. Hubungi Owner."
                );
            }


            // ================================
            // 4. SIMPAN DATA SESSION
            // ================================

            sessionStorage.setItem(
                "wat_user_role",
                profile.role
            );

            sessionStorage.setItem(
                "wat_user_name",
                profile.full_name || ""
            );

            sessionStorage.setItem(
                "wat_user_email",
                profile.email || ""
            );


            // ================================
            // 5. ARAHKAN BERDASARKAN ROLE
            // ================================

            if (profile.role === "OWNER") {

                window.location.href =
                    "dashboard-owner.html";

            } else if (profile.role === "CS") {

                window.location.href =
                    "dashboard-cs.html";

            } else if (profile.role === "TEKNISI") {

                window.location.href =
                    "dashboard-teknisi.html";

            } else {

                await supabaseClient.auth.signOut();

                throw new Error(
                    "Role user tidak dikenali."
                );
            }

        } catch (error) {

            console.error("Login Error:", error);

            loginMessage.textContent =
                error.message || "Login gagal.";

            loginMessage.style.color = "red";

            loginButton.disabled = false;
            loginButton.textContent = "LOGIN";
        }

    });

}
