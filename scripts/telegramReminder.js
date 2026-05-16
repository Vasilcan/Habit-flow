import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import https from 'https'; // Folosim modulul nativ Node.js, zero configurări, zero erori!

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

const getTodayDateString = () => {
    const now = new Date();
    const localTime = new Date(now.getTime() + (3 * 60 * 60 * 1000));
    return localTime.toISOString().split('T')[0];
};

function sendTelegramMessage(chatId, text) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: 'Markdown'
        });

        const options = {
            hostname: 'api.telegram.org',
            port: 443,
            path: `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            let responseBody = '';
            res.on('data', (chunk) => { responseBody += chunk; });
            res.on('end', () => { resolve(JSON.parse(responseBody)); });
        });

        req.on('error', (error) => { console.error(error); reject(error); });
        req.write(data);
        req.end();
    });
}

async function runReminder() {
    const todayStr = getTodayDateString();
    console.log(`Pornire reminder pentru: ${todayStr}`);

    try {
        const usersSnapshot = await db.collection('users').where('notificationsEnabled', '==', true).get();

        if (usersSnapshot.empty) {
            console.log('Niciun utilizator cu notificari active.');
            return;
        }

        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            const chatId = userData.telegramChatId;

            if (!chatId) continue;

            const habitsSnapshot = await db.collection('users').doc(userDoc.id).collection('habits').get();
            let pendingHabits = [];

            habitsSnapshot.forEach(hDoc => {
                const h = hDoc.data();
                const history = h.history || [];
                if (!history.includes(todayStr)) {
                    pendingHabits.push(`✨ *${h.name}*`);
                }
            });

            const tasksSnapshot = await db.collection('users').doc(userDoc.id).collection('dailyPlans').doc(todayStr).collection('tasks').get();
            let pendingTasks = [];

            tasksSnapshot.forEach(tDoc => {
                const t = tDoc.data();
                if (!t.completed) {
                    pendingTasks.push(`⏰ ${t.startTime} - *${t.title}*`);
                }
            });

            let message = `👋 *Salutare de la HabitFlow!*\n\n`;

            if (pendingHabits.length === 0 && pendingTasks.length === 0) {
                message += `🎉 *Incredibil!* Ai bifat absolut tot pe azi. Esti un campion! 🏆`;
            } else {
                message += `Iata ce ti-a mai ramas de finalizat pe azi:\n\n`;
                if (pendingHabits.length > 0) message += `*🏆 Obiceiuri rămase:*\n${pendingHabits.join('\n')}\n\n`;
                if (pendingTasks.length > 0) message += `*📅 Task-uri rămase:*\n${pendingTasks.join('\n')}\n\n`;
                message += `🚀 Nu renunta!`;
            }

            await sendTelegramMessage(chatId, message);
            console.log(`Mesaj trimis catre: ${userData.email}`);
        }
    } catch (error) {
        console.error("Eroare:", error);
    }
}

runReminder();