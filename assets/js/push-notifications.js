/* =========================================================
   WAT ERP - PUSH NOTIFICATIONS
   Teknisi
========================================================= */

(function () {

    "use strict";


    /* =====================================================
       CONFIG
    ===================================================== */

    const VAPID_PUBLIC_KEY =
        "BLh0GFmUjoLi3VVyJlNuHrkygy5wJ6FE7x9Ik_ZyhlLq1csNnDS9kzwfkQHlaruyt0Fa6z5bx41NcrjllcoqRRw";


    let pushRegistration = null;
    let pushSubscription = null;


    /* =====================================================
       INIT
    ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            waitForTechnicianApp();

        }
    );


    /* =====================================================
       WAIT FOR SUPABASE + USER
    ===================================================== */

    function waitForTechnicianApp() {

        let attempts = 0;

        const timer = setInterval(
            async function () {

                attempts++;

                if (
                    typeof supabaseClient !== "undefined" &&
                    typeof currentUser !== "undefined" &&
                    currentUser
                ) {

                    clearInterval(timer);

                    await initializePush();

                }


                if (attempts >= 100) {

                    clearInterval(timer);

                    console.warn(
                        "WAT PUSH: aplikasi teknisi tidak ditemukan."
                    );

                }

            },
            500
        );

    }


    /* =====================================================
       INITIALIZE PUSH
    ===================================================== */

    async function initializePush() {

        console.log(
            "WAT PUSH: initialize..."
        );


        if (
            !("serviceWorker" in navigator)
        ) {

            console.warn(
                "Browser tidak mendukung Service Worker."
            );

            return;

        }


        if (
            !("PushManager" in window)
        ) {

            console.warn(
                "Browser tidak mendukung Push API."
            );

            return;

        }


        if (
            !("Notification" in window)
        ) {

            console.warn(
                "Browser tidak mendukung Notification API."
            );

            return;

        }


        try {

            pushRegistration =
                await navigator.serviceWorker.register(
                    "service-worker.js"
                );


            console.log(
                "WAT PUSH: Service Worker aktif.",
                pushRegistration.scope
            );


            createPushButton();


        }
        catch (error) {

            console.error(
                "WAT PUSH SERVICE WORKER ERROR:",
                error
            );

        }

    }


    /* =====================================================
       CREATE BUTTON
    ===================================================== */

    function createPushButton() {

        if (
            document.getElementById(
                "watPushButton"
            )
        ) {

            return;

        }


        const button =
            document.createElement("button");


        button.id =
            "watPushButton";


        button.type =
            "button";


        button.innerHTML =
            "🔔 AKTIFKAN NOTIFIKASI ORDER";


        button.style.cssText = `
            position:fixed;
            right:18px;
            bottom:18px;
            z-index:99999;
            border:0;
            background:#0876ff;
            color:#fff;
            padding:13px 17px;
            border-radius:10px;
            font-weight:bold;
            font-size:12px;
            cursor:pointer;
            box-shadow:0 5px 20px rgba(0,0,0,.20);
        `;


        button.addEventListener(
            "click",
            async function () {

                await enablePush();

            }
        );


        document.body.appendChild(button);


        checkExistingSubscription();

    }


    /* =====================================================
       CHECK EXISTING SUBSCRIPTION
    ===================================================== */

    async function checkExistingSubscription() {

        try {

            if (!pushRegistration) {

                return;

            }


            pushSubscription =
                await pushRegistration.pushManager
                    .getSubscription();


            if (pushSubscription) {

                console.log(
                    "WAT PUSH: subscription sudah ada."
                );


                updatePushButton(
                    true
                );


                await saveSubscription(
                    pushSubscription
                );

            }

        }
        catch (error) {

            console.error(
                "WAT PUSH CHECK ERROR:",
                error
            );

        }

    }


    /* =====================================================
       ENABLE PUSH
    ===================================================== */

    async function enablePush() {

        const button =
            document.getElementById(
                "watPushButton"
            );


        try {

            if (!pushRegistration) {

                pushRegistration =
                    await navigator.serviceWorker.register(
                        "service-worker.js"
                    );

            }


            /*
             * Minta izin notifikasi
             */

            const permission =
                await Notification.requestPermission();


            if (
                permission !== "granted"
            ) {

                showPushMessage(
                    "❌ Izin notifikasi ditolak.",
                    "error"
                );

                return;

            }


            /*
             * Subscribe Push
             */

            pushSubscription =
                await pushRegistration
                    .pushManager
                    .subscribe({

                        userVisibleOnly:true,

                        applicationServerKey:
                            urlBase64ToUint8Array(
                                VAPID_PUBLIC_KEY
                            )

                    });


            console.log(
                "WAT PUSH SUBSCRIPTION:",
                pushSubscription
            );


            /*
             * Simpan ke Supabase
             */

            const saved =
                await saveSubscription(
                    pushSubscription
                );


            if (!saved) {

                return;

            }


            updatePushButton(
                true
            );


            showPushMessage(
                "✅ Notifikasi order sudah aktif.",
                "success"
            );


            /*
             * Test notification saat halaman aktif
             */

            showLocalTestNotification();

        }
        catch (error) {

            console.error(
                "WAT PUSH ENABLE ERROR:",
                error
            );


            if (button) {

                button.innerHTML =
                    "🔔 AKTIFKAN NOTIFIKASI ORDER";

            }


            showPushMessage(
                "❌ Gagal mengaktifkan notifikasi: " +
                (error.message || error),
                "error"
            );

        }

    }


    /* =====================================================
       SAVE SUBSCRIPTION TO SUPABASE
    ===================================================== */

    async function saveSubscription(
        subscription
    ) {

        if (!subscription) {

            return false;

        }


        if (
            typeof currentUser === "undefined" ||
            !currentUser
        ) {

            console.error(
                "WAT PUSH: currentUser belum tersedia."
            );

            return false;

        }


        try {

            const json =
                subscription.toJSON();


            const endpoint =
                json.endpoint;


            const p256dh =
                json.keys &&
                json.keys.p256dh
                    ? json.keys.p256dh
                    : null;


            const auth =
                json.keys &&
                json.keys.auth
                    ? json.keys.auth
                    : null;


            if (
                !endpoint ||
                !p256dh ||
                !auth
            ) {

                throw new Error(
                    "Data subscription Push tidak lengkap."
                );

            }


            const deviceName =
                getDeviceName();


            const userAgent =
                navigator.userAgent ||
                "";


            /*
             * Upsert berdasarkan endpoint.
             */

            const {
                data,
                error
            } =
                await supabaseClient
                    .from(
                        "push_subscriptions"
                    )
                    .upsert(
                        {

                            user_id:
                                currentUser.id,

                            endpoint:
                                endpoint,

                            p256dh:
                                p256dh,

                            auth:
                                auth,

                            device_name:
                                deviceName,

                            user_agent:
                                userAgent,

                            is_active:
                                true,

                            updated_at:
                                new Date()
                                    .toISOString()

                        },
                        {
                            onConflict:
                                "endpoint"
                        }
                    )
                    .select()
                    .single();


            if (error) {

                throw error;

            }


            console.log(
                "WAT PUSH: subscription tersimpan.",
                data
            );


            return true;

        }
        catch (error) {

            console.error(
                "WAT PUSH DATABASE ERROR:",
                error
            );


            showPushMessage(
                "❌ Subscription gagal disimpan: " +
                error.message,
                "error"
            );


            return false;

        }

    }


    /* =====================================================
       DEVICE NAME
    ===================================================== */

    function getDeviceName() {

        const ua =
            navigator.userAgent ||
            "";


        if (
            /Android/i.test(ua)
        ) {

            return "Android - Chrome";

        }


        if (
            /iPhone|iPad|iPod/i.test(ua)
        ) {

            return "iPhone/iPad";

        }


        if (
            /Windows/i.test(ua)
        ) {

            return "Windows - Browser";

        }


        if (
            /Mac/i.test(ua)
        ) {

            return "Mac - Browser";

        }


        return "Browser";

    }


    /* =====================================================
       UPDATE BUTTON
    ===================================================== */

    function updatePushButton(
        active
    ) {

        const button =
            document.getElementById(
                "watPushButton"
            );


        if (!button) {

            return;

        }


        if (active) {

            button.innerHTML =
                "🔔 NOTIFIKASI ORDER AKTIF";


            button.style.background =
                "#16a34a";

        }
        else {

            button.innerHTML =
                "🔔 AKTIFKAN NOTIFIKASI ORDER";


            button.style.background =
                "#0876ff";

        }

    }


    /* =====================================================
       TEST LOCAL NOTIFICATION
    ===================================================== */

    function showLocalTestNotification() {

        if (
            Notification.permission !==
            "granted"
        ) {

            return;

        }


        setTimeout(
            function () {

                try {

                    new Notification(
                        "🔔 WAT ERP",
                        {

                            body:
                                "Notifikasi order teknisi sudah aktif.",

                            icon:
                                "assets/img/logo.png",

                            tag:
                                "wat-push-test"

                        }
                    );

                }
                catch (error) {

                    console.warn(
                        "WAT PUSH TEST ERROR:",
                        error
                    );

                }

            },
            500
        );

    }


    /* =====================================================
       UI MESSAGE
    ===================================================== */

    function showPushMessage(
        message,
        type
    ) {

        let box =
            document.getElementById(
                "watPushMessage"
            );


        if (!box) {

            box =
                document.createElement(
                    "div"
                );


            box.id =
                "watPushMessage";


            box.style.cssText = `
                position:fixed;
                left:50%;
                bottom:75px;
                transform:translateX(-50%);
                z-index:100000;
                max-width:90%;
                padding:12px 16px;
                border-radius:9px;
                font-size:13px;
                font-weight:bold;
                box-shadow:0 5px 20px rgba(0,0,0,.15);
                text-align:center;
            `;


            document.body.appendChild(
                box
            );

        }


        box.textContent =
            message;


        if (
            type === "error"
        ) {

            box.style.background =
                "#fee2e2";

            box.style.color =
                "#991b1b";

        }
        else {

            box.style.background =
                "#dcfce7";

            box.style.color =
                "#166534";

        }


        box.style.display =
            "block";


        clearTimeout(
            box._timer
        );


        box._timer =
            setTimeout(
                function () {

                    box.style.display =
                        "none";

                },
                5000
            );

    }


    /* =====================================================
       BASE64 → UINT8ARRAY
    ===================================================== */

    function urlBase64ToUint8Array(
        base64String
    ) {

        const padding =
            "=".repeat(
                (4 -
                    base64String.length % 4
                ) % 4
            );


        const base64 =
            (
                base64String +
                padding
            )
                .replace(
                    /-/g,
                    "+"
                )
                .replace(
                    /_/g,
                    "/"
                );


        const rawData =
            window.atob(
                base64
            );


        const outputArray =
            new Uint8Array(
                rawData.length
            );


        for (
            let i = 0;
            i < rawData.length;
            ++i
        ) {

            outputArray[i] =
                rawData.charCodeAt(i);

        }


        return outputArray;

    }


    /* =====================================================
       PUBLIC HELPER
    ===================================================== */

    window.enableWATPush =
        enablePush;


})();
