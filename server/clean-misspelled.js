"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_1 = require("./src/firebase");
async function clean() {
    for (let i = 101; i <= 112; i++) {
        await firebase_1.db.ref('products/' + i).update({ isActive: false });
        console.log(`Hid key ${i}`);
    }
    process.exit(0);
}
clean();
