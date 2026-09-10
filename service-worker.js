const CACHE_NAME = "wat-erp-technician-v1";

const APP_FILES = [
    "./",
    "./technician.html",
    "./login.html",
    "./manifest.json",
    "./assets/js/config.js",
    "./assets/js/technician-notification.js"
];


/* =====================================================
   INSTALL
===================================================== */

self.addEventListener(
    "install",
    event => {

        console.log(
            "WAT Service Worker: INSTALL"
        );

        event.waitUntil(

            caches
                .open(CACHE_NAME)
                .then(cache => {

                    return cache.addAll(
                        APP_FILES
                    );

                })

        );

        self.skipWaiting();

    }
);


/* =====================================================
   ACTIVATE
===================================================== */

self.addEventListener(
    "activate",
    event => {

        console.log(
            "WAT Service Worker: ACTIVATE"
        );

        event.waitUntil(

            caches
                .keys()
                .then(keys => {

                    return Promise.all(

                        keys
                            .filter(
                                key =>
                                    key !==
                                    CACHE_NAME
                            )
                            .map(
                                key =>
                                    caches.delete(
                                        key
                                    )
                            )

                    );

                })

        );

        self.clients.claim();

    }
);


/* =====================================================
   FETCH
===================================================== */

self.addEventListener(
    "fetch",
    event => {

        /*
         * Untuk Supabase/API jangan di-cache.
         */

        if(
            event.request.url.includes(
                "supabase.co"
            )
        ){

            return;

        }


        /*
         * File aplikasi:
         * coba network dulu,
         * kalau gagal gunakan cache.
         */

        event.respondWith(

            fetch(event.request)
                .then(response => {

                    /*
                     * Simpan response valid.
                     */

                    if(
                        response &&
                        response.status === 200 &&
                        response.type === "basic"
                    ){

                        const responseClone =
                            response.clone();


                        caches
                            .open(CACHE_NAME)
                            .then(cache => {

                                cache.put(
                                    event.request,
                                    responseClone
                                );

                            });

                    }


                    return response;

                })
                .catch(() => {

                    return caches
                        .match(
                            event.request
                        );

                })

        );

    }
);


/* =====================================================
   PUSH NOTIFICATION
===================================================== */

self.addEventListener(
    "push",
    event => {

        console.log(
            "WAT PUSH: Notification diterima."
        );


        let data = {};


        try{

            if(event.data){

                data =
                    event.data.json();

            }

        }
        catch(error){

            console.error(
                "WAT PUSH JSON ERROR:",
                error
            );


            data = {

                title:
                    "🔔 ORDER BARU MASUK!",

                body:
                    "Ada pekerjaan baru untuk Anda."

            };

        }


        const title =
            data.title ||
            "🔔 ORDER BARU MASUK!";


        const options = {

            body:
                data.body ||
                "Ada order baru.",

            icon:
                data.icon ||
                "./assets/img/logo.png",

            badge:
                data.badge ||
                "./assets/img/logo.png",

            tag:
                data.tag ||
                "wat-new-job",

            requireInteraction:
                true,

            vibrate: [
                250,
                120,
                250,
                120,
                450
            ],

            data: {

                url:
                    data.url ||
                    "./technician.html",

                job_id:
                    data.job_id ||
                    null

            }

        };


        event.waitUntil(

            self.registration.showNotification(
                title,
                options
            )

        );

    }
);


/* =====================================================
   NOTIFICATION CLICK
===================================================== */

self.addEventListener(
    "notificationclick",
    event => {

        event.notification.close();


        const notificationData =
            event.notification.data ||
            {};


        const targetUrl =
            notificationData.url ||
            "./technician.html";


        event.waitUntil(

            clients
                .matchAll({
                    type:"window",
                    includeUncontrolled:true
                })
                .then(
                    clientList => {

                        /*
                         * Kalau WAT sudah terbuka,
                         * fokus ke sana.
                         */

                        for(
                            const client
                            of clientList
                        ){

                            if(
                                client.url.includes(
                                    "technician.html"
                                ) &&
                                "focus" in client
                            ){

                                return client.focus();

                            }

                        }


                        /*
                         * Kalau belum terbuka,
                         * buka halaman teknisi.
                         */

                        if(
                            clients.openWindow
                        ){

                            return clients.openWindow(
                                targetUrl
                            );

                        }

                    }
                )

        );

    }
);
