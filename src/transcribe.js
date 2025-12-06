// src/live_transcribe.js
// Node.js 18対策
const { File } = require('node:buffer');
globalThis.File = File;

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); 

const fs = require('fs');
const OpenAI = require('openai');
const { spawn } = require('child_process');
const chokidar = require('chokidar');

// 設定
const SEGMENT_TIME = 6; // 何秒ごとに文字起こしするか（短すぎると文脈が切れる、長いとラグになる）
const OUTPUT_DIR = path.resolve(__dirname, '../segments'); // 一時ファイルの保存場所
// ★ここにHLSのURLを入れる！
const HLS_URL = 'http://hlsvod.shugiintv.go.jp/vod/_definst_/amlst:2025/2025-1105-1300-00/playlist.m3u8'; 

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ダミー関数（行ごとに送信）
async function passToNextStep(text) {
  console.log(`🚀 送信: "${text}"`);
  // ここにSocket.ioなどでフロントエンドに送る処理を書く
}

async function main() {
  console.log("🔴 ライブ文字起こしシステム起動！");

  // 1. 一時フォルダを初期化（前回のゴミを削除）
  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(OUTPUT_DIR);

  // 2. FFmpegを起動して、HLSをmp3に刻み続けるバックグラウンド処理
  console.log(`🎥 ストリーム受信開始: ${HLS_URL}`);
  const ffmpeg = spawn('ffmpeg', [
    '-i', HLS_URL,           // 入力元
    '-f', 'segment',         // セグメント分割モード
    '-segment_time', SEGMENT_TIME, // 分割する秒数
    '-reset_timestamps', '1',
    '-ac', '1',              // モノラル（軽量化）
    '-ab', '32k',            // ビットレート（軽量化）
    path.join(OUTPUT_DIR, 'out%03d.mp3') // 出力ファイル名 (out001.mp3, out002.mp3...)
  ]);

  // FFmpegのログ（エラー時のみ表示）
  ffmpeg.stderr.on('data', (data) => {
    // console.log(`ffmpeg: ${data}`); // うるさいのでコメントアウト。デバッグ時は外して。
  });

  // 3. フォルダを監視して、ファイルができたらWhisperへ！
  const watcher = chokidar.watch(OUTPUT_DIR, {
    persistent: true,
    awaitWriteFinish: { stabilityThreshold: 2000, pollInterval: 100 } // 書き込み完了を確実に待つ
  });

  watcher.on('add', async (filePath) => {
    const fileName = path.basename(filePath);
    console.log(`\n📂 新しい音声チャンクを検知: ${fileName}`);

    try {
      // Whisperに投げる
      const audioFile = fs.createReadStream(filePath);
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        language: "ja",
        response_format: "verbose_json", // セグメント情報付きで取得
      });

      // 結果を処理
      if (transcription.segments) {
        for (const segment of transcription.segments) {
          const text = segment.text.trim();
          if (text.length > 0) await passToNextStep(text);
        }
      } else {
        if (transcription.text.trim().length > 0) await passToNextStep(transcription.text);
      }

      // 処理が終わったファイルは消す（ディスク溢れ防止）
      fs.unlinkSync(filePath);
      console.log(`🗑️ 処理完了・削除: ${fileName}`);

    } catch (err) {
      console.error(`😭 エラー (${fileName}):`, err.message);
    }
  });

  console.log(`👀 ${SEGMENT_TIME}秒ごとに音声を切り出して監視中...`);
}

main();