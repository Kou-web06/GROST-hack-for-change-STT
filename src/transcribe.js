// src/transcribe.js
require('dotenv').config({ path: '../.env' }); // 設定ファイルの読み込み
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');

// OpenAIの準備
const openai = new OpenAI ({
    apiKey: process.env.OPENAI_API_KEY,
});

async function Next(sentenceList) {
    // ダミー
    console.log(`渡すリスト: ${sentenceList}`);
}

async function main() {
    const audioPath = path.join(__dirname, '../assets/test.mp4');
    if (!fs.existsSync(audioPath)) {
        console.log(`ファイルがありません： ${audioPath}`);
        return;
    }

    try {
        const audioFile = fs.createReadStream(audioPath);

        // Whisper API
        const transcription = await openai.audio.transcriptions.create({
            file: audioFile,
            model: "whisper-1",
            language: "ja"
        });

        const Text = transcription.text;
        console.log("文字起こし完了");

        // 「。」で区切る
        const sentenceList = Text.split("。")
            .map(s => s.trim())        // 空白削除
            .filter(s => s.length > 0);    //空行削除

        // ダミー呼び出し
        await Next(sentenceList);
    } catch (error) {
        console.error("error!");
    }
}