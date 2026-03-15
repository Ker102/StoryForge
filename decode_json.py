import json
import base64
import os

def process_file(json_path, out_path):
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    content = base64.b64decode(data['content'].replace('\n', '')).decode('utf-8')
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(content)

process_file(r'C:\Users\krist\.gemini\antigravity\brain\d0072f9a-05de-48ed-8e65-f18e4b0eb11d\.system_generated\steps\1530\output.txt', 'quill_pr10.py')
process_file(r'C:\Users\krist\.gemini\antigravity\brain\d0072f9a-05de-48ed-8e65-f18e4b0eb11d\.system_generated\steps\1531\output.txt', 'ws_pr10.py')
process_file(r'C:\Users\krist\.gemini\antigravity\brain\d0072f9a-05de-48ed-8e65-f18e4b0eb11d\.system_generated\steps\1532\output.txt', 'websocket_pr10.ts')
