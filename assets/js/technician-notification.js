/* =========================================================
   WAT ERP
   TECHNICIAN REALTIME NOTIFICATION
   Gojek-like New Job Alert
   ========================================================= */

(function(){

    let notificationStarted = false;
    let audioUnlocked = false;
    let audioContext = null;
    let currentNotification = null;

    /* =====================================================
       WAIT FOR SUPABASE + CURRENT USER
    ===================================================== */

    function waitForTechnician(){

        if(
            typeof supabaseClient === "undefined" ||
            typeof currentUser === "undefined"
        ){
            setTimeout(waitForTechnician,500);
            return;
        }

        if(!currentUser || !currentUser.id){
            setTimeout(waitForTechnician,500);
            return;
        }

        if(notificationStarted){
            return;
        }

        notificationStarted = true;

        initNotificationUI();
        initAudioButton();
        initRealtime();

    }


    /* =====================================================
       UI
    ===================================================== */

    function initNotificationUI(){

        if(document.getElementById("watNotificationBox")){
            return;
        }

        const box = document.createElement("div");

        box.id = "watNotificationBox";

        box.innerHTML = `

            <div id="watNotificationOverlay"
                 style="
                    display:none;
                    position:fixed;
                    inset:0;
                    z-index:99999;
                    background:rgba(0,0,0,.60);
                    align-items:center;
                    justify-content:center;
                    padding:20px;
                 ">

                <div
                    style="
                        width:100%;
                        max-width:430px;
                        background:white;
                        border-radius:22px;
                        overflow:hidden;
                        box-shadow:0 30px 80px rgba(0,0,0,.35);
                        animation:watOrderPop .25s ease;
                    "
                >

                    <div
                        style="
                            background:linear-gradient(
                                135deg,
                                #0b4ea2,
                                #0876ff
                            );
                            color:white;
                            padding:25px 20px;
                            text-align:center;
                        "
                    >

                        <div
                            style="
                                font-size:52px;
                                line-height:1;
                                margin-bottom:10px;
                            "
                        >
                            🔔
                        </div>

                        <div
                            style="
                                font-size:25px;
                                font-weight:900;
                            "
                        >
                            ORDER BARU MASUK!
                        </div>

                        <div
                            style="
                                margin-top:6px;
                                font-size:13px;
                                opacity:.9;
                            "
                        >
                            WAT / Wijaya AC
                        </div>

                    </div>


                    <div style="padding:22px">

                        <div
                            id="watNotifJobCode"
                            style="
                                font-size:13px;
                                color:#64748b;
                                margin-bottom:7px;
                            "
                        >
                            JOB-
                        </div>


                        <div
                            id="watNotifCustomer"
                            style="
                                font-size:22px;
                                font-weight:900;
                                color:#172033;
                                margin-bottom:15px;
                            "
                        >
                            Customer
                        </div>


                        <div
                            style="
                                background:#f7f9fc;
                                border-radius:12px;
                                padding:15px;
                            "
                        >

                            <div
                                id="watNotifWork"
                                style="
                                    font-size:14px;
                                    font-weight:bold;
                                    margin-bottom:10px;
                                "
                            >
                                Pekerjaan
                            </div>


                            <div
                                id="watNotifSchedule"
                                style="
                                    font-size:13px;
                                    color:#64748b;
                                    margin-bottom:7px;
                                "
                            >
                                📅 -
                            </div>


                            <div
                                id="watNotifAddress"
                                style="
                                    font-size:13px;
                                    color:#64748b;
                                "
                            >
                                📍 -
                            </div>

                        </div>


                        <button
                            id="watNotifOpen"
                            style="
                                width:100%;
                                margin-top:18px;
                                padding:14px;
                                border:0;
                                border-radius:11px;
                                background:#0876ff;
                                color:white;
                                font-size:15px;
                                font-weight:900;
                                cursor:pointer;
                            "
                        >
                            🔧 LIHAT ORDER
                        </button>


                        <button
                            id="watNotifClose"
                            style="
                                width:100%;
                                margin-top:9px;
                                padding:12px;
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

        document.body.appendChild(box);


        const style = document.createElement("style");

        style.textContent = `

            @keyframes watOrderPop{

                from{
                    transform:scale(.85);
                    opacity:0;
                }

                to{
                    transform:scale(1);
                    opacity:1;
                }

            }

            @keyframes watBellShake{

                0%{
                    transform:rotate(0deg);
                }

                25%{
                    transform:rotate(-12deg);
                }

                50%{
                    transform:rotate(12deg);
                }

                75%{
                    transform:rotate(-8deg);
                }

                100%{
                    transform:rotate(0deg);
                }

            }

        `;

        document.head.appendChild(style);


        document
            .getElementById("watNotifClose")
            .onclick = closeNotification;


        document
            .getElementById("watNotificationOverlay")
            .onclick = function(e){

                if(e.target === this){
                    closeNotification();
                }

            };

    }


    /* =====================================================
       AUDIO
    ===================================================== */

    function initAudioButton(){

        if(document.getElementById("watAudioButton")){
            return;
        }

        const button = document.createElement("button");

        button.id = "watAudioButton";

        button.innerHTML =
            "🔊 Aktifkan Suara Order";

        button.style.cssText = `
            position:fixed;
            right:18px;
            bottom:18px;
            z-index:9998;
            border:0;
            border-radius:999px;
            padding:12px 16px;
            background:#0876ff;
            color:white;
            font-weight:900;
            font-size:12px;
            cursor:pointer;
            box-shadow:0 8px 25px rgba(0,0,0,.18);
        `;

        button.onclick = unlockAudio;

        document.body.appendChild(button);

    }


    function unlockAudio(){

        try{

            audioContext =
                audioContext ||
                new (
                    window.AudioContext ||
                    window.webkitAudioContext
                )();

            if(audioContext.state === "suspended"){
                audioContext.resume();
            }

            audioUnlocked = true;

            playOrderSound();

            const button =
                document.getElementById(
                    "watAudioButton"
                );

            if(button){

                button.innerHTML =
                    "🔊 Suara Order Aktif";

                button.style.background =
                    "#16a34a";

            }

        }
        catch(error){

            console.error(
                "AUDIO UNLOCK ERROR:",
                error
            );

        }

    }


    /* =====================================================
       GOJEK-LIKE SOUND
    ===================================================== */

    function playTone(
        frequency,
        duration,
        startTime,
        volume
    ){

        if(!audioContext){
            return;
        }

        const oscillator =
            audioContext.createOscillator();

        const gain =
            audioContext.createGain();

        oscillator.type = "sine";

        oscillator.frequency.setValueAtTime(
            frequency,
            startTime
        );

        gain.gain.setValueAtTime(
            0.0001,
            startTime
        );

        gain.gain.exponentialRampToValueAtTime(
            volume,
            startTime + 0.02
        );

        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            startTime + duration
        );

        oscillator.connect(gain);

        gain.connect(audioContext.destination);

        oscillator.start(startTime);

        oscillator.stop(
            startTime + duration + 0.02
        );

    }


    function playOrderSound(){

        if(!audioContext){
            return;
        }

        if(audioContext.state === "suspended"){
            audioContext.resume();
        }

        const now =
            audioContext.currentTime;


        /*
            TING - TING - TING
        */

        playTone(
            880,
            .20,
            now,
            .16
        );

        playTone(
            1175,
            .20,
            now + .28,
            .18
        );

        playTone(
            880,
            .20,
            now + .56,
            .16
        );


        /*
            Ulang sedikit seperti order driver
        */

        playTone(
            1175,
            .22,
            now + 1.00,
            .18
        );

        playTone(
            880,
            .25,
            now + 1.30,
            .16
        );

    }


    /* =====================================================
       REALTIME
    ===================================================== */

    function initRealtime(){

        console.log(
            "WAT: Realtime technician notification aktif."
        );


        supabaseClient
            .channel(
                "wat-technician-orders-" +
                currentUser.id
            )
            .on(
                "postgres_changes",
                {
                    event:"INSERT",
                    schema:"public",
                    table:"jobs"
                },
                function(payload){

                    handleNewJob(
                        payload.new
                    );

                }
            )
            .on(
                "postgres_changes",
                {
                    event:"UPDATE",
                    schema:"public",
                    table:"jobs"
                },
                function(payload){

                    handleUpdatedJob(
                        payload
                    );

                }
            )
            .subscribe(function(status){

                console.log(
                    "WAT Realtime:",
                    status
                );

            });

    }


    /* =====================================================
       CHECK NEW JOB
    ===================================================== */

    function isMyJob(job){

        if(!job){
            return false;
        }

        return (
            job.assigned_to === currentUser.id ||
            job.technician_id === currentUser.id
        );

    }


    function handleNewJob(job){

        if(!isMyJob(job)){
            return;
        }


        /*
            Jangan bunyikan order yang sudah selesai
            atau dibatalkan.
        */

        if(
            job.status === "COMPLETED" ||
            job.status === "CANCELLED"
        ){
            return;
        }


        showNewJobNotification(job);

    }


    /* =====================================================
       CHECK ASSIGNMENT UPDATE
    ===================================================== */

    function handleUpdatedJob(payload){

        const job =
            payload.new;

        if(!job){
            return;
        }


        /*
            Kalau sekarang job masuk ke teknisi ini,
            anggap sebagai order baru.
        */

        if(isMyJob(job)){

            if(
                job.status !== "COMPLETED" &&
                job.status !== "CANCELLED"
            ){

                /*
                    Hanya munculkan jika perubahan
                    benar-benar relevan.

                    Karena old record bisa kosong tergantung
                    konfigurasi Realtime Supabase, kita
                    menggunakan updated_at sebagai guard.
                */

                const last =
                    localStorage.getItem(
                        "wat_last_notification_" +
                        job.id
                    );

                const current =
                    job.updated_at ||
                    job.created_at ||
                    "";

                if(last !== current){

                    localStorage.setItem(
                        "wat_last_notification_" +
                        job.id,
                        current
                    );

                    /*
                        Delay kecil supaya tidak bentrok
                        dengan update halaman.
                    */

                    setTimeout(function(){

                        showNewJobNotification(job);

                    },300);

                }

            }

        }

    }


    /* =====================================================
       SHOW NOTIFICATION
    ===================================================== */

    function showNewJobNotification(job){

        if(
            !document.getElementById(
                "watNotificationOverlay"
            )
        ){
            initNotificationUI();
        }


        /*
            SOUND
        */

        if(audioUnlocked){

            playOrderSound();

        }


        /*
            VIBRATION
        */

        if(
            navigator.vibrate
        ){

            try{

                navigator.vibrate([
                    250,
                    120,
                    250,
                    120,
                    400
                ]);

            }
            catch(e){}

        }


        /*
            BROWSER NOTIFICATION
        */

        showBrowserNotification(
            job
        );


        /*
            POPUP
        */

        const overlay =
            document.getElementById(
                "watNotificationOverlay"
            );

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


        jobCode.textContent =
            job.job_code ||
            "JOB BARU";


        customer.textContent =
            job.customer_name ||
            "Customer";


        work.textContent =
            "🔧 " +
            (
                job.work_description ||
                job.description ||
                job.title ||
                "Pekerjaan Service"
            );


        schedule.textContent =
            "📅 " +
            formatSchedule(
                job.scheduled_at
            );


        address.textContent =
            "📍 " +
            (
                job.customer_address ||
                "-"
            );


        overlay.style.display =
            "flex";


        currentNotification =
            job;


        /*
            Buka job
        */

        document
            .getElementById("watNotifOpen")
            .onclick = function(){

                closeNotification();

                /*
                    Kalau fungsi showDetail tersedia,
                    langsung buka detail job.
                */

                if(
                    typeof window.showDetail ===
                    "function"
                ){

                    window.showDetail(
                        job.id
                    );

                    return;
                }


                /*
                    Fallback:
                    cari job di array jobs.
                */

                if(
                    typeof window.jobs !==
                    "undefined" &&
                    Array.isArray(window.jobs)
                ){

                    const found =
                        window.jobs.find(
                            x => x.id === job.id
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

            };

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

        currentNotification =
            null;

    }


    /* =====================================================
       BROWSER NOTIFICATION
    ===================================================== */

    async function showBrowserNotification(job){

        if(
            !("Notification" in window)
        ){
            return;
        }


        try{

            if(
                Notification.permission ===
                "default"
            ){

                await Notification.requestPermission();

            }


            if(
                Notification.permission !==
                "granted"
            ){

                return;

            }


            const notification =
                new Notification(
                    "🔔 ORDER BARU MASUK!",
                    {
                        body:
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
                            ),
                        icon:
                            "assets/img/logo.png",
                        tag:
                            "wat-job-" +
                            job.id,
                        requireInteraction:true
                    }
                );


            notification.onclick =
                function(){

                    window.focus();

                    if(
                        typeof window.showDetail ===
                        "function"
                    ){

                        window.showDetail(
                            job.id
                        );

                    }

                    notification.close();

                };

        }
        catch(error){

            console.error(
                "BROWSER NOTIFICATION ERROR:",
                error
            );

        }

    }


    /* =====================================================
       DATE FORMAT
    ===================================================== */

    function formatSchedule(value){

        if(!value){
            return "Jadwal belum ditentukan";
        }

        try{

            const date =
                new Date(value);

            return date.toLocaleDateString(
                "id-ID",
                {
                    weekday:"long",
                    day:"2-digit",
                    month:"long",
                    year:"numeric"
                }
            ) +
            " • " +
            date.toLocaleTimeString(
                "id-ID",
                {
                    hour:"2-digit",
                    minute:"2-digit"
                }
            );

        }
        catch(error){

            return String(value);

        }

    }


    /* =====================================================
       START
    ===================================================== */

    if(
        document.readyState ===
        "loading"
    ){

        document.addEventListener(
            "DOMContentLoaded",
            waitForTechnician
        );

    }
    else{

        waitForTechnician();

    }

})();
