import { moderateText } from './services/moderationService';

async function test() {
    try {
        console.log("Testing 'die'...");
        const res1 = await moderateText("die");
        console.log("'die' result:", JSON.stringify(res1, null, 2));

        console.log("Testing 'ou are ugly and stupid'...");
        const res2 = await moderateText("ou are ugly and stupid");
        console.log("'ou are ugly and stupid' result:", JSON.stringify(res2, null, 2));
    } catch (e) {
        console.log("TEST SCRIPT ERROR:", e);
    }
}

test();
