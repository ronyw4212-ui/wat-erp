/* =========================================================
   WAT ERP
   TECHNICIAN REALTIME ORDER NOTIFICATION
   =========================================================
   
   FUNGSI:
   1. Mendeteksi job baru secara realtime
   2. Mendeteksi job yang baru ditugaskan ke teknisi
   3. Popup "ORDER BARU MASUK"
   4. Suara TING TING TING
   5. Getar HP jika browser mendukung
   6. Browser notification
   7. Tombol AKTIFKAN SUARA ORDER
   8. Tombol LIHAT ORDER
   ========================================================= */


(function(){

    "use strict";


    /* =====================================================
       VARIABLES
    ===================================================== */

    let notificationStarted = false;

    let audioUnlocked = false;

    let audioContext = null;

    let currentNotificationJob = null;

    let realtimeChannel = null;


    /* =====================================================
       START
    ===================================================== */

    function startNotificationSystem(){

        /*
         * Tunggu sampai technician.html selesai
         * membuat supabaseClient dan currentUser.
         */

        if(
            typeof supabaseClient === "undefined" ||
            typeof currentUser === "undefined"
        ){

            setTimeout(
                startNotificationSystem,
                500
            );

            return;

        }


        /*
         * User belum tersedia.
         */

        if(
            !currentUser ||
            !currentUser.id
        ){

            setTimeout(
                startNotificationSystem,
                500
            );

            return;

        }


        /*
         * Jangan start dua kali.
         */

        if(notificationStarted){

            return;

        }


        notificationStarted = true;


        console.log(
            "======================================"
        );

        console.log(
            "WAT ERP TECHNICIAN NOTIFICATION"
        );

        console.log(
            "Teknisi:",
            currentUser.id
        );

        console.log(
            "======================================"
        );


        /*
         * Buat UI.
         */

        createNotificationUI();

        createAudioButton();


        /*
         * Aktifkan realtime.
         */

        startRealtime();


        /*
         * Minta permission browser notification
         * setelah user berinteraksi lebih lanjut.
         */

        console.log(
            "WAT ERP: Notification system aktif."
        );

    }


    /* =====================================================
       NOTIFICATION UI
    ===================================================== */

    function createNotificationUI(){

        /*
         * Jangan buat dua kali.
         */

        if(
            document.getElementById(
                "watNotificationOverlay"
            )
        ){

            return;

        }


        const wrapper =
            document.createElement("div");


        wrapper.id =
            "watNotificationWrapper";


        wrapper.innerHTML = `

            <div
                id="watNotificationOverlay"
                style="
                    display:none;
                    position:fixed;
                    inset:0;
                    z-index:999999;
                    background:rgba(0,0,0,.68);
                    align-items:center;
                    justify-content:center;
                    padding:20px;
                "
            >

                <div
                    id="watNotificationCard"
                    style="
                        width:100%;
                        max-width:430px;
                        background:#ffffff;
                        border-radius:22px;
                        overflow:hidden;
                        box-shadow:
                            0 30px 90px
                            rgba(0,0,0,.40);
                        animation:
                            watOrderPop
                            .25s ease;
                    "
                >

                    <!-- HEADER -->

                    <div
                        style="
                            background:
                                linear-gradient(
                                    135deg,
                                    #0b4ea2,
                                    #0876ff
                                );
                            color:#ffffff;
                            padding:28px 20px;
                            text-align:center;
                        "
                    >

                        <div
                            id="watBellIcon"
                            style="
                                font-size:58px;
                                line-height:1;
                                margin-bottom:12px;
                            "
                        >
                            🔔
                        </div>


                        <div
                            style="
                                font-size:25px;
                                font-weight:900;
                                letter-spacing:.3px;
                            "
                        >
                            ORDER BARU MASUK!
                        </div>


                        <div
                            style="
                                margin-top:7px;
                                font-size:13px;
                                opacity:.90;
                            "
                        >
                            WAT / Wijaya AC
                        </div>

                    </div>


                    <!-- BODY -->

                    <div
                        style="
                            padding:22px;
                        "
                    >

                        <!-- JOB CODE -->

                        <div
                            id="watNotifJobCode"
                            style="
                                font-size:13px;
                                color:#64748b;
                                font-weight:bold;
                                margin-bottom:7px;
                            "
                        >
                            JOB-
                        </div>


                        <!-- CUSTOMER -->

                        <div
                            id="watNotifCustomer"
                            style="
                                font-size:23px;
                                font-weight:900;
                                color:#172033;
                                margin-bottom:16px;
                            "
                        >
                            Customer
                        </div>


                        <!-- DETAIL -->

                        <div
                            style="
                                background:#f7f9fc;
                                border-radius:13px;
                                padding:16px;
                                border:1px solid #e5e7eb;
                            "
                        >

                            <div
                                id="watNotifWork"
                                style="
                                    font-size:14px;
                                    font-weight:bold;
                                    color:#172033;
                                    line-height:1.5;
                                    margin-bottom:12px;
                                "
                            >
                                🔧 Pekerjaan
                            </div>


                            <div
                                id="watNotifSchedule"
                                style="
                                    font-size:13px;
                                    color:#64748b;
                                    line-height:1.5;
                                    margin-bottom:8px;
                                "
                            >
                                📅 -
                            </div>


                            <div
                                id="watNotifAddress"
                                style="
                                    font-size:13px;
                                    color:#64748b;
                                    line-height:1.5;
                                "
                            >
                                📍 -
                            </div>

                        </div>


                        <!-- OPEN -->

                        <button
                            id="watNotifOpen"
                            type="button"
                            style="
                                width:100%;
                                margin-top:18px;
                                padding:15px;
                                border:0;
                                border-radius:11px;
                                background:#0876ff;
                                color:#ffffff;
                                font-size:15px;
                                font-weight:900;
                                cursor:pointer;
                                box-shadow:
                                    0 5px 15px
                                    rgba(8,118,255,.25);
                            "
                        >
                            🔧 LIHAT ORDER
                        </button>


                        <!-- CLOSE -->

                        <button
                            id="watNotifClose"
                            type="button"
                            style="
                                width:100%;
                                margin-top:9px;
                                padding:13px;
                                border:0;
                                background:#edf2f7;
                                color:#334155;
                                border-radius:11px;
                                font-weight:bold;
                                cursor:pointer;
                            "
                        >
                            Tutup
                        </button>

                    </div>

                </div>

            </div>

        `;


        document.body.appendChild(wrapper);


        /*
         * CSS animation.
         */

        if(
            !document.getElementById(
                "watNotificationStyle"
            )
        ){

            const style =
                document.createElement("style");


            style.id =
                "watNotificationStyle";


            style.textContent = `

                @keyframes watOrderPop {

                    0% {
                        transform:scale(.80);
                        opacity:0;
                    }

                    100% {
                        transform:scale(1);
                        opacity:1;
                    }

                }


                @keyframes watBellShake {

                    0% {
                        transform:rotate(0deg);
                    }

                    20% {
                        transform:rotate(-15deg);
                    }

                    40% {
                        transform:rotate(15deg);
                    }

                    60% {
                        transform:rotate(-12deg);
                    }

                    80% {
                        transform:rotate(10deg);
                    }

                    100% {
                        transform:rotate(0deg);
                    }

                }


                @keyframes watButtonPulse {

                    0% {
                        box-shadow:
                            0 0 0 0
                            rgba(220,38,38,.45);
                    }

                    70% {
                        box-shadow:
                            0 0 0 12px
                            rgba(220,38,38,0);
                    }

                    100% {
                        box-shadow:
                            0 0 0 0
                            rgba(220,38,38,0);
                    }

                }

            `;


            document.head.appendChild(style);

        }


        /*
         * Close button.
         */

        const closeButton =
            document.getElementById(
                "watNotifClose"
            );


        if(closeButton){

            closeButton.onclick =
                function(){

                    closeNotification();

                };

        }


        /*
         * Klik background untuk tutup.
         */

        const overlay =
            document.getElementById(
                "watNotificationOverlay"
            );


        if(overlay){

            overlay.addEventListener(
                "click",
                function(event){

                    if(
                        event.target === overlay
                    ){

                        closeNotification();

                    }

                }
            );

        }

    }


    /* =====================================================
       AUDIO BUTTON
    ===================================================== */

    function createAudioButton(){

        /*
         * Jangan buat dua kali.
         */

        if(
            document.getElementById(
                "watAudioButton"
            )
        ){

            return;

        }


        const button =
            document.createElement("button");


        button.id =
            "watAudioButton";


        button.type =
            "button";


        button.innerHTML =
            "🔊 AKTIFKAN SUARA ORDER";


        button.style.cssText = `

            position:fixed;

            right:18px;

            bottom:18px;

            z-index:999998;

            border:0;

            border-radius:12px;

            padding:14px 18px;

            background:#dc2626;

            color:white;

            font-weight:900;

            font-size:13px;

            cursor:pointer;

            box-shadow:
                0 8px 25px
                rgba(0,0,0,.25);

            animation:
                watButtonPulse
                2s infinite;

        `;


        button.addEventListener(
            "click",
            activateAudio
        );


        document.body.appendChild(button);

    }


    /* =====================================================
       ACTIVATE AUDIO
    ===================================================== */

    async function activateAudio(){

        try{

            /*
             * Buat AudioContext.
             */

            if(!audioContext){

                const AudioContext =
                    window.AudioContext ||
                    window.webkitAudioContext;


                if(!AudioContext){

                    throw new Error(
                        "Browser tidak mendukung Web Audio."
                    );

                }


                audioContext =
                    new AudioContext();

            }


            /*
             * Resume audio context.
             */

            if(
                audioContext.state ===
                "suspended"
            ){

                await audioContext.resume();

            }


            /*
             * Tandai sudah aktif.
             */

            audioUnlocked = true;


            /*
             * Mainkan suara test.
             */

            playOrderSound();


            /*
             * Update tombol.
             */

            const button =
                document.getElementById(
                    "watAudioButton"
                );


            if(button){

                button.innerHTML =
                    "🔊 SUARA ORDER AKTIF";


                button.style.background =
                    "#16a34a";


                button.style.animation =
                    "none";


                button.style.boxShadow =
                    "0 5px 18px rgba(22,163,74,.35)";

            }


            /*
             * Browser permission.
             */

            requestBrowserNotificationPermission();


            /*
             * Pesan berhasil.
             */

            showAudioSuccessMessage();

        }
        catch(error){

            console.error(
                "WAT AUDIO ERROR:",
                error
            );


            alert(
                "Suara gagal diaktifkan.\n\n" +
                "Coba klik tombol lagi atau " +
                "pastikan suara browser tidak dimatikan."
            );

        }

    }


    /* =====================================================
       AUDIO TEST / ORDER SOUND
    ===================================================== */

    function ensureAudioContext(){

        if(!audioContext){

            const AudioContext =
                window.AudioContext ||
                window.webkitAudioContext;


            if(!AudioContext){

                return false;

            }


            audioContext =
                new AudioContext();

        }


        return true;

    }


    function playTone(
        frequency,
        duration,
        delay,
        volume
    ){

        if(
            !ensureAudioContext()
        ){

            return;

        }


        if(
            audioContext.state ===
            "suspended"
        ){

            audioContext.resume();

        }


        const startTime =
            audioContext.currentTime +
            delay;


        const oscillator =
            audioContext.createOscillator();


        const gain =
            audioContext.createGain();


        /*
         * Nada.
         */

        oscillator.type =
            "sine";


        oscillator.frequency.setValueAtTime(
            frequency,
            startTime
        );


        /*
         * Volume masuk.
         */

        gain.gain.setValueAtTime(
            0.0001,
            startTime
        );


        gain.gain.exponentialRampToValueAtTime(
            volume,
            startTime + 0.025
        );


        /*
         * Volume keluar.
         */

        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            startTime + duration
        );


        /*
         * Connect.
         */

        oscillator.connect(gain);

        gain.connect(
            audioContext.destination
        );


        /*
         * Start / stop.
         */

        oscillator.start(
            startTime
        );


        oscillator.stop(
            startTime +
            duration +
            0.05
        );

    }


    function playOrderSound(){

        /*
         * Jangan paksa suara kalau
         * belum di-unlock oleh user.
         */

        if(!audioUnlocked){

            return;

        }


        /*
         * Pastikan audio aktif.
         */

        if(
            !ensureAudioContext()
        ){

            return;

        }


        if(
            audioContext.state ===
            "suspended"
        ){

            audioContext.resume();

        }


        /*
         * =================================================
         * GOJEK-LIKE
         *
         * TING
         *      TING
         *           TING
         *
         * TING
         *      TING
         * =================================================
         */


        playTone(
            880,
            .20,
            0,
            .16
        );


        playTone(
            1175,
            .20,
            .28,
            .18
        );


        playTone(
            880,
            .20,
            .56,
            .16
        );


        playTone(
            1175,
            .22,
            1.00,
            .18
        );


        playTone(
            880,
            .25,
            1.32,
            .16
        );

    }


    /* =====================================================
       SUCCESS MESSAGE
    ===================================================== */

    function showAudioSuccessMessage(){

        const old =
            document.getElementById(
                "watAudioSuccess"
            );


        if(old){

            old.remove();

        }


        const message =
            document.createElement("div");


        message.id =
            "watAudioSuccess";


        message.innerHTML = `

            🔊 <b>SUARA ORDER AKTIF</b>

            <div
                style="
                    margin-top:4px;
                    font-size:12px;
                    font-weight:normal;
                "
            >
                Teknisi akan mendapat suara
                saat order baru masuk.
            </div>

        `;


        message.style.cssText = `

            position:fixed;

            top:90px;

            right:18px;

            z-index:999999;

            background:#16a34a;

            color:white;

            padding:14px 18px;

            border-radius:10px;

            box-shadow:
                0 8px 25px
                rgba(0,0,0,.20);

            font-size:13px;

            line-height:1.5;

        `;


        document.body.appendChild(
            message
        );


        setTimeout(
            function(){

                if(message){

                    message.remove();

                }

            },
            4000
        );

    }


    /* =====================================================
       REALTIME
    ===================================================== */

    function startRealtime(){

        if(
            typeof supabaseClient ===
            "undefined"
        ){

            console.error(
                "WAT: supabaseClient tidak ditemukan."
            );

            return;

        }


        /*
         * Channel khusus teknisi.
         */

        const channelName =
            "wat-technician-orders-" +
            currentUser.id;


        console.log(
            "WAT: Membuka realtime channel:",
            channelName
        );


        realtimeChannel =
            supabaseClient
                .channel(channelName)


                /*
                 * JOB INSERT
                 */

                .on(
                    "postgres_changes",
                    {
                        event:"INSERT",
                        schema:"public",
                        table:"jobs"
                    },
                    function(payload){

                        console.log(
                            "WAT REALTIME INSERT:",
                            payload
                        );


                        handleNewJob(
                            payload.new
                        );

                    }
                )


                /*
                 * JOB UPDATE
                 */

                .on(
                    "postgres_changes",
                    {
                        event:"UPDATE",
                        schema:"public",
                        table:"jobs"
                    },
                    function(payload){

                        console.log(
                            "WAT REALTIME UPDATE:",
                            payload
                        );


                        handleUpdatedJob(
                            payload
                        );

                    }
                )


                /*
                 * Subscribe.
                 */

                .subscribe(
                    function(status){

                        console.log(
                            "WAT REALTIME STATUS:",
                            status
                        );


                        if(
                            status ===
                            "SUBSCRIBED"
                        ){

                            console.log(
                                "✅ WAT REALTIME TEKNISI AKTIF"
                            );

                        }

                    }
                );

    }


    /* =====================================================
       CHECK JOB BELONGS TO TECHNICIAN
    ===================================================== */

    function isMyJob(job){

        if(!job){

            return false;

        }


        /*
         * Schema WAT menggunakan:
         *
         * assigned_to
         * ATAU
         * technician_id
         */

        return (
            job.assigned_to ===
                currentUser.id
            ||
            job.technician_id ===
                currentUser.id
        );

    }


    /* =====================================================
       HANDLE NEW JOB
    ===================================================== */

    function handleNewJob(job){

        if(!job){

            return;

        }


        /*
         * Bukan job teknisi ini.
         */

        if(
            !isMyJob(job)
        ){

            console.log(
                "WAT: Job bukan milik teknisi ini."
            );

            return;

        }


        /*
         * Job selesai / dibatalkan
         * tidak perlu notif.
         */

        if(
            job.status ===
                "COMPLETED"
            ||
            job.status ===
                "CANCELLED"
        ){

            return;

        }


        /*
         * Tampilkan.
         */

        showNewJobNotification(
            job
        );

    }


    /* =====================================================
       HANDLE UPDATED JOB
    ===================================================== */

    function handleUpdatedJob(payload){

        if(!payload){

            return;

        }


        const job =
            payload.new;


        const oldJob =
            payload.old || {};


        if(!job){

            return;

        }


        /*
         * Cek apakah job sekarang milik
         * teknisi ini.
         */

        if(
            !isMyJob(job)
        ){

            return;

        }


        /*
         * Jangan notif job selesai.
         */

        if(
            job.status ===
                "COMPLETED"
            ||
            job.status ===
                "CANCELLED"
        ){

            return;

        }


        /*
         * =================================================
         * PRIORITAS:
         *
         * Kalau assigned_to / technician_id berubah
         * menjadi teknisi ini -> ORDER BARU.
         * =================================================
         */


        const becameAssigned =

            (
                job.assigned_to ===
                currentUser.id
                &&
                oldJob.assigned_to !==
                currentUser.id
            )

            ||

            (
                job.technician_id ===
                currentUser.id
                &&
                oldJob.technician_id !==
                currentUser.id
            );


        if(becameAssigned){

            showNewJobNotification(
                job
            );

            return;

        }


        /*
         * Beberapa konfigurasi Supabase
         * tidak mengirim old record secara lengkap.
         *
         * Karena itu kita gunakan localStorage
         * sebagai pengaman agar job update tidak
         * terus berbunyi.
         */

        if(
            !oldJob ||
            Object.keys(oldJob).length === 0
        ){

            const notificationKey =
                "wat-notified-job-" +
                job.id;


            const currentVersion =
                job.updated_at ||
                job.created_at ||
                "";


            const previousVersion =
                localStorage.getItem(
                    notificationKey
                );


            /*
             * Kalau belum pernah ditandai,
             * tampilkan satu kali.
             */

            if(
                !previousVersion
            ){

                localStorage.setItem(
                    notificationKey,
                    currentVersion
                );


                showNewJobNotification(
                    job
                );

            }


            return;

        }

    }


    /* =====================================================
       SHOW NEW JOB
    ===================================================== */

    function showNewJobNotification(job){

        if(!job){

            return;

        }


        /*
         * Jangan notif job yang sama berkali-kali
         * dalam waktu singkat.
         */

        const notificationKey =
            "wat-order-notified-" +
            job.id;


        const currentTime =
            Date.now();


        const previousTime =
            Number(
                sessionStorage.getItem(
                    notificationKey
                ) || 0
            );


        /*
         * 5 detik guard.
         */

        if(
            currentTime -
            previousTime <
            5000
        ){

            return;

        }


        sessionStorage.setItem(
            notificationKey,
            String(currentTime)
        );


        /*
         * Pastikan UI ada.
         */

        if(
            !document.getElementById(
                "watNotificationOverlay"
            )
        ){

            createNotificationUI();

        }


        /*
         * =================================================
         * SUARA
         * =================================================
         */

        if(audioUnlocked){

            playOrderSound();

        }
        else{

            console.log(
                "WAT: Suara belum diaktifkan."
            );

        }


        /*
         * =================================================
         * GETAR
         * =================================================
         */

        vibratePhone();


        /*
         * =================================================
         * BROWSER NOTIFICATION
         * =================================================
         */

        showBrowserNotification(
            job
        );


        /*
         * =================================================
         * POPUP
         * =================================================
         */

        fillNotificationData(
            job
        );


        const overlay =
            document.getElementById(
                "watNotificationOverlay"
            );


        if(overlay){

            overlay.style.display =
                "flex";

        }


        currentNotificationJob =
            job;


        /*
         * Animasi bell.
         */

        const bell =
            document.getElementById(
                "watBellIcon"
            );


        if(bell){

            bell.style.animation =
                "watBellShake .8s ease";

        }


        /*
         * Tombol lihat order.
         */

        const openButton =
            document.getElementById(
                "watNotifOpen"
            );


        if(openButton){

            openButton.onclick =
                function(){

                    openNotificationJob(
                        job
                    );

                };

        }

    }


    /* =====================================================
       FILL POPUP DATA
    ===================================================== */

    function fillNotificationData(job){

        const jobCode =
            document.getElementById(
                "watNotifJobCode"
            );


        const customer =
            document.getElementById(
                "watNotifCustomer"
            );


        const work =
            document.getElementById(
                "watNotifWork"
            );


        const schedule =
            document.getElementById(
                "watNotifSchedule"
            );


        const address =
            document.getElementById(
                "watNotifAddress"
            );


        if(jobCode){

            jobCode.textContent =
                job.job_code ||
                "JOB BARU";

        }


        if(customer){

            customer.textContent =
                job.customer_name ||
                "Customer";

        }


        if(work){

            work.textContent =
                "🔧 " +
                (
                    job.work_description ||
                    job.description ||
                    job.title ||
                    "Pekerjaan Service"
                );

        }


        if(schedule){

            schedule.textContent =
                "📅 " +
                formatSchedule(
                    job.scheduled_at
                );

        }


        if(address){

            address.textContent =
                "📍 " +
                (
                    job.customer_address ||
                    "-"
                );

        }

    }


    /* =====================================================
       OPEN JOB
    ===================================================== */

    function openNotificationJob(job){

        /*
         * Tutup popup.
         */

        closeNotification();


        /*
         * Refresh job terlebih dahulu
         * kalau loadJobs tersedia.
         */

        if(
            typeof window.loadJobs ===
            "function"
        ){

            try{

                window.loadJobs();

            }
            catch(error){

                console.error(
                    error
                );

            }

        }


        /*
         * Tunggu sedikit agar data job
         * masuk ke array jobs.
         */

        setTimeout(
            function(){

                if(
                    typeof window.showDetail ===
                    "function"
                ){

                    try{

                        window.showDetail(
                            job.id
                        );

                        return;

                    }
                    catch(error){

                        console.error(
                            "SHOW DETAIL ERROR:",
                            error
                        );

                    }

                }


                /*
                 * Fallback kalau showDetail
                 * belum bisa menemukan job.
                 */

                if(
                    typeof jobs !==
                    "undefined" &&
                    Array.isArray(jobs)
                ){

                    const found =
                        jobs.find(
                            function(item){

                                return item.id ===
                                    job.id;

                            }
                        );


                    if(
                        found &&
                        typeof window.showDetail ===
                        "function"
                    ){

                        window.showDetail(
                            found.id
                        );

                    }

                }

            },
            500
        );

    }


    /* =====================================================
       CLOSE
    ===================================================== */

    function closeNotification(){

        const overlay =
            document.getElementById(
                "watNotificationOverlay"
            );


        if(overlay){

            overlay.style.display =
                "none";

        }


        currentNotificationJob =
            null;


        /*
         * Stop bell animation.
         */

        const bell =
            document.getElementById(
                "watBellIcon"
            );


        if(bell){

            bell.style.animation =
                "none";

        }

    }


    /* =====================================================
       VIBRATION
    ===================================================== */

    function vibratePhone(){

        if(
            !navigator.vibrate
        ){

            return;

        }


        try{

            navigator.vibrate([
                250,
                120,
                250,
                120,
                450
            ]);

        }
        catch(error){

            console.log(
                "WAT vibration tidak tersedia."
            );

        }

    }


    /* =====================================================
       BROWSER NOTIFICATION
    ===================================================== */

    async function requestBrowserNotificationPermission(){

        if(
            !("Notification" in window)
        ){

            console.log(
                "Browser tidak mendukung Notification API."
            );

            return;

        }


        try{

            if(
                Notification.permission ===
                "default"
            ){

                const permission =
                    await Notification.requestPermission();


                console.log(
                    "WAT notification permission:",
                    permission
                );

            }

        }
        catch(error){

            console.error(
                "WAT notification permission error:",
                error
            );

        }

    }


    async function showBrowserNotification(job){

        if(
            !("Notification" in window)
        ){

            return;

        }


        try{

            /*
             * Jangan request permission otomatis
             * saat order datang.
             *
             * Permission sudah diminta ketika
             * user klik Aktifkan Suara.
             */

            if(
                Notification.permission !==
                "granted"
            ){

                return;

            }


            const title =
                "🔔 ORDER BARU MASUK!";


            const body =
                (
                    job.customer_name ||
                    "Customer"
                ) +
                "\n" +
                (
                    job.work_description ||
                    job.description ||
                    job.title ||
                    "Pekerjaan Service"
                );


            const notification =
                new Notification(
                    title,
                    {
                        body:body,

                        tag:
                            "wat-job-" +
                            job.id,

                        requireInteraction:true

                    }
                );


            notification.onclick =
                function(){

                    window.focus();


                    openNotificationJob(
                        job
                    );


                    notification.close();

                };

        }
        catch(error){

            console.error(
                "WAT browser notification error:",
                error
            );

        }

    }


    /* =====================================================
       FORMAT SCHEDULE
    ===================================================== */

    function formatSchedule(value){

        if(!value){

            return "Jadwal belum ditentukan";

        }


        try{

            const date =
                new Date(value);


            if(
                isNaN(
                    date.getTime()
                )
            ){

                return String(value);

            }


            const dateText =
                date.toLocaleDateString(
                    "id-ID",
                    {
                        weekday:"long",
                        day:"2-digit",
                        month:"long",
                        year:"numeric"
                    }
                );


            const timeText =
                date.toLocaleTimeString(
                    "id-ID",
                    {
                        hour:"2-digit",
                        minute:"2-digit"
                    }
                );


            return (
                dateText +
                " • " +
                timeText
            );

        }
        catch(error){

            return String(value);

        }

    }


    /* =====================================================
       CLEANUP
    ===================================================== */

    function cleanupRealtime(){

        if(
            realtimeChannel &&
            typeof supabaseClient !==
            "undefined"
        ){

            try{

                supabaseClient.removeChannel(
                    realtimeChannel
                );

            }
            catch(error){

                console.error(
                    error
                );

            }

        }

    }


    /* =====================================================
       PAGE UNLOAD
    ===================================================== */

    window.addEventListener(
        "beforeunload",
        cleanupRealtime
    );


    /* =====================================================
       START WHEN DOM READY
    ===================================================== */

    if(
        document.readyState ===
        "loading"
    ){

        document.addEventListener(
            "DOMContentLoaded",
            startNotificationSystem
        );

    }
    else{

        startNotificationSystem();

    }


})();
