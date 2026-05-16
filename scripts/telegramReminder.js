import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fetch from 'node-fetch';

// 1. Inițializăm Firebase Admin folosind variabilele de mediu (secrete) de pe GitHub
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

// Utilitare pentru date (Timezone local)
const getTodayDateString = () => {
    const now = new Date();
    // Ajustăm pentru ora României (+3 în Mai 2026 datorită orei de vară)
    const localTime = new Date(now.getTime() + (3 * 60 * 60 * 1000));
    return localTime.toISOString().split('T')[0];
};

async function sendTelegramMessage(chatId, text) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'Markdown'
            })
        });
        const resData = await response.json();
        if (!resData.ok) console.error(`Eroare trimitere către ${chatId}:`, resData.description);
    } catch (err) {
        console.error("Eroare la cererea HTTP către Telegram:", err);
    }
}

async function runReminder() {
    const todayStr = getTodayDateString();
    console.log(`Pornire reminder pentru data: ${todayStr}`);

    try {
        // 2. Extragem utilizatorii care au notificările active
        const usersSnapshot = await db.collection('users').where('notificationsEnabled', '==', true).get();

        if (usersSnapshot.empty) {
            console.log('Niciun utilizator cu notificări active.');
            return;
        }

        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            const userData = userDoc.data();
            const chatId = userData.telegramChatId;

            if (!chatId) continue;

            // 3. Verificăm obiceiurile nebifate azi
            const habitsSnapshot = await db.collection('users').doc(userId).collection('habits').get();
            let pendingHabits = [];

            habitsSnapshot.forEach(hDoc => {
                const h = hDoc.data();
                const history = h.history || [];
                if (!history.includes(todayStr)) {
                    pendingHabits.push(`${h.emoji || '✨'} *${h.name}* (${h.type === 'must' ? 'MUST' : 'COULD BE'})`);
                }
            });

            // 4. Verificăm task-urile neterminate azi
            const tasksSnapshot = await db.collection('users').doc(userId).collection('dailyPlans').doc(todayStr).collection('tasks').get();
            let pendingTasks = [];

            tasksSnapshot.forEach(tDoc => {
                const t = tDoc.data();
                if (!t.completed) {
                    pendingTasks.push(`⏰ ${t.startTime} - *${t.title}*`);
                }
            });

            // 5. Construirea mesajului personalizat
            let message = `👋 *Salutare de la HabitFlow!*\n\n`;

            if (pendingHabits.length === 0 && pendingTasks.length === 0) {
                message += `🎉 *Incredibil!* Ai bifat absolut toate obiceiurile și task-urile planificate pentru azi. Ești un campion! Continuă tot așa! 🏆💪`;
            } else {
                message += `Iată ce ți-a mai rămas de finalizat pe ziua de azi:\n\n`;

                if (pendingHabits.length > 0) {
                    message += `*🏆 Obiceiuri rămase:*\n${pendingHabits.join('\n')}\n\n`;
                }

                if (pendingTasks.length > 0) {
                    message += `*📅 Task-uri din plan neterminate:*\n${pendingTasks.join('\n')}\n\n`;
                }

                message += `🚀 *Nu renunța!* Încă mai ai timp să le bifezi pe toate înainte de culcare. Succes!`;
            }

            // Tritem mesajul live pe Telegram!
            await sendTelegramMessage(chatId, message);
            console.log(`Mesaj trimis cu succes către user: ${userData.email}`);
        }
    } catch (error) {
        console.error("Eroare în rularea scriptului:", error);
    }
}

runReminder();