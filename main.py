import pyttsx3
import platform

def speach(text: str):
    # 目的: WSL環境でespeakが使われる場合、明示的に日本語('ja')を設定して音声を出す。
    
    # 1. TTSエンジンを初期化します
    try:
        # pyttsx3.init()の引数にドライバ名を指定することで、確実にespeakを使用させることができますが、
        # 環境依存で失敗する場合もあるため、ここでは引数なしで初期化します。
        engine = pyttsx3.init()
    except Exception as e:
        print(f"❌ エラー: TTSエンジンの初期化中に失敗しました: {e}")
        return

    # 2. ドライバ名の確認と日本語（'ja'）の音声を明示的に設定します
    # pyttsx3のバージョンによってgetDriverName()がない場合があるため、
    # 非公開属性 '_driverName' を使用してドライバ名を取得します（推奨はされませんが、動作を優先）。
    # もしくは、単純に日本語音声を探すロジックに集中します。
    
    # 実行環境がLinux/WSLの場合（espeakが使われる可能性が高い）、'ja'を試行します。
    # Linux環境の判定（platform.system() が 'Linux' かどうか）
    is_linux = platform.system() == 'Linux'
    
    # 3. 音声の設定
    voices = engine.getProperty('voices')
    japanese_voice_found = False
    
    if is_linux:
        # Linux/WSLの場合: espeakは言語コード 'ja' を使用する可能性が高い
        try:
            # espeakに 'ja' ボイスが存在するか確認
            engine.setProperty('voice', 'ja')
            japanese_voice_found = True
            print("✅ 環境がLinux/WSLであるため、明示的に言語を日本語('ja')に設定しました。")
        except Exception:
            # 'ja' が見つからなかった場合は、以下の汎用検索にフォールバック
            pass

    if not japanese_voice_found:
        # 汎用的な方法: 利用可能な音声リストから日本語音声を探す
        for voice in voices:
            if 'japanese' in voice.name.lower() or 'ja-JP' in voice.id.lower():
                engine.setProperty('voice', voice.id)
                japanese_voice_found = True
                print(f"✅ 汎用検索で日本語音声 '{voice.name}' を設定しました。")
                break
    
    if not japanese_voice_found:
        print(f"⚠️ 日本語音声が見つかりませんでした。デフォルト音声で読み上げます。")

    # 速度と音量調整
    engine.setProperty('rate', 140)
    engine.setProperty('volume', 1.0) 

    # 4. テキストを読み上げるようキューに追加します
    engine.say(text)
    print(f"🗣️ 読み上げを開始します: 「{text}」")
    
    # 5. 読み上げを実行し、完了を待ちます
    try:
        engine.runAndWait()
        print("✅ 読み上げが完了しました。")
    except Exception as e:
        print(f"❌ 読み上げ実行中にエラーが発生しました: {e}")
    
    engine.stop()

# --- 実行例 ---

if __name__ == "__main__":
    message_to_speak = "最新のコードで実行します。今度はエラーが出ずに音声が出ることを願っています。"
    
    # 変数を引数として関数に渡します
    speach(message_to_speak)