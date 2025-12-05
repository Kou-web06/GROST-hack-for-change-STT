// Node.js 18対策
const { File } = require('node:buffer');
globalThis.File = File;

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); 

const fs = require('fs');
const OpenAI = require('openai');

// OpenAIの準備
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * 🛠 ダミー関数：次の処理へ
 */
async function passToNextStep(sentenceList) {
  // この関数内は後で消す
  console.log(`受け取った文章の数: ${sentenceList.length}個`);
  
  // 中身を表示
  console.log("--- 渡すデータの中身 ---");
  console.log(sentenceList); 
  console.log("-----------------------------------");
}

async function main() {
  console.log("Whisperで文字起こし中...（数秒〜数十秒かかります）");

  // assetsフォルダの中の「test.mp4」を確実に指定
  const audioPath = path.resolve(__dirname, '../assets/test.mp4');

  // ファイルがあるかチェック
  if (!fs.existsSync(audioPath)) {
    console.error(`エラー: ファイルが見つかりません！`);
    console.error(`以下の場所に動画ファイルを置いてください:\n${audioPath}`);
    return;
  }

  try {
    // ファイルを開く
    const audioFile = fs.createReadStream(audioPath);

    // 1. Whisper APIに送信
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "ja",
    });

    const rawText = transcription.text;
    console.log("文字起こし完了！");

    // 2. 区切ってリスト（配列）にする
    const splitSentences = rawText
      .split(' ')
      .map(s => s.trim())        // 前後の空白を削除
      .filter(s => s.length > 0); // 空っぽの行を削除

    // 3. ダミー関数にデータを渡す
    await passToNextStep(splitSentences);

  } catch (error) {
    console.error("エラーが発生しました...");
    console.error(error.message); // エラー内容を表示
  }
}

main();