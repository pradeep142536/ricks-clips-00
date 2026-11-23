import urllib.request, urllib.parse, json, time, uuid, os, sys, base64

EPISODE = "emu-war"
TOTAL_FRAMES = 1763
WORKERS = 4
SCALE = 1.0

def get_token():
    with open(r'C:\Users\PC\.ricks-clips-gcloud\application_default_credentials.json') as f:
        c = json.load(f)
    data = urllib.parse.urlencode({
        'client_id': c['client_id'],
        'client_secret': c['client_secret'],
        'refresh_token': c['refresh_token'],
        'grant_type': 'refresh_token'
    }).encode('utf-8')
    req = urllib.request.Request('https://oauth2.googleapis.com/token', data=data, method='POST')
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode('utf-8'))['access_token']

def log(msg):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}")
    sys.stdout.flush()

log("=== STARTING FULLY AUTOMATED CLOUD GPU RENDER (NEW CONNECTED WORLD) ===")

headers = {
    'Authorization': f'Bearer {get_token()}',
    'X-Goog-User-Project': 'ricks-clips-render',
    'Content-Type': 'application/json'
}

# 1. Provision fresh Tesla T4 runtime
log("Step 1/5: Provisioning Tesla T4 GPU runtime on Google Cloud...")
req_id = str(uuid.uuid4())
create_body = json.dumps({
    'jsonrpc': '2.0',
    'id': 1,
    'method': 'tools/call',
    'params': {
        'name': 'create_runtime',
        'arguments': {
            'requestId': req_id,
            'runtime': {
                'runtimeSpec': {
                    'variant': 'VARIANT_GPU',
                    'accelerator': 'T4',
                    'shape': 'SHAPE_STANDARD'
                }
            }
        }
    }
}).encode()

req = urllib.request.Request('https://colaboratory.googleapis.com/mcp', data=create_body, headers=headers)
runtime_name = None
with urllib.request.urlopen(req, timeout=120) as resp:
    raw = resp.read().decode('utf-8')
    obj = json.loads(raw)
    if 'result' in obj:
        for c in obj['result'].get('content', []):
            try:
                sub = json.loads(c.get('text', ''))
                if 'name' in sub:
                    runtime_name = sub['name']
            except:
                pass
        if not runtime_name and 'structuredContent' in obj['result']:
            runtime_name = obj['result']['structuredContent'].get('name')

if not runtime_name:
    log(f"Failed to obtain runtime name from response: {raw}")
    sys.exit(1)

log(f"GPU Runtime ready: {runtime_name}")

def exec_code(code_str, session_name=None, timeout_sec=120):
    token = get_token()
    h = {
        'Authorization': f'Bearer {token}',
        'X-Goog-User-Project': 'ricks-clips-render',
        'Content-Type': 'application/json'
    }
    args = {'code': code_str}
    if session_name:
        args['session'] = session_name
    else:
        args['runtime'] = runtime_name

    b = json.dumps({
        'jsonrpc': '2.0',
        'id': int(time.time()),
        'method': 'tools/call',
        'params': {
            'name': 'execute_code',
            'arguments': args
        }
    }).encode()
    r = urllib.request.Request('https://colaboratory.googleapis.com/mcp', data=b, headers=h)
    with urllib.request.urlopen(r, timeout=timeout_sec) as response:
        raw_resp = response.read().decode('utf-8')
        dec = json.JSONDecoder()
        p = 0
        collected_stdout = ""
        while p < len(raw_resp):
            rem = raw_resp[p:].lstrip()
            if not rem: break
            p = len(raw_resp) - len(rem)
            o, end = dec.raw_decode(rem)
            if 'result' in o:
                sc = o['result'].get('structuredContent', {})
                collected_stdout += sc.get('stdout', '')
                if 'executionError' in sc:
                    log(f"Execution Error: {sc['executionError']}")
            p += end
        return collected_stdout

# 2. Configure GPU driver & environment
log("Step 2/5: Configuring Nvidia EGL GLVND driver & pulling latest commit with connected world...")
setup_code = r"""
import subprocess, os

# Hardware Driver config
with open('/etc/ld.so.conf.d/nvidia.conf', 'w') as f:
    f.write('/usr/lib64-nvidia\n')
subprocess.run(['ldconfig'])

os.makedirs('/usr/share/glvnd/egl_vendor.d', exist_ok=True)
with open('/usr/share/glvnd/egl_vendor.d/10_nvidia.json', 'w') as f:
    f.write('''{
    "file_format_version" : "1.0.0",
    "ICD" : {
        "library_path" : "/usr/lib64-nvidia/libEGL_nvidia.so.0"
    }
}''')

# Pull repository
if not os.path.exists('/content/ricks-clips'):
    subprocess.run(['git', 'clone', 'https://github.com/pradeep142536/ricks-clips-00.git', '/content/ricks-clips'], check=True)
else:
    subprocess.run(['git', '-C', '/content/ricks-clips', 'fetch', 'origin'], check=True)
    subprocess.run(['git', '-C', '/content/ricks-clips', 'reset', '--hard', 'origin/main'], check=True)

# Install dependencies
subprocess.run('npm install playwright > /dev/null 2>&1', shell=True, cwd='/content/ricks-clips/templates/threejs_film')
subprocess.run('npx playwright install chromium > /dev/null 2>&1', shell=True, cwd='/content/ricks-clips/templates/threejs_film')
subprocess.run('npx playwright install-deps chromium > /dev/null 2>&1', shell=True, cwd='/content/ricks-clips/templates/threejs_film')
print("SETUP_DONE")
"""

out_setup = exec_code(setup_code, timeout_sec=240)
log(f"Setup output: {out_setup.strip()}")

# 3. Create independent background render runner script on Colab
log("Step 3/5: Deploying background 4-worker GPU render runner...")
deploy_code = f"""
import subprocess

render_script = r'''
import os, sys, time, subprocess, glob, json

EPISODE = "{EPISODE}"
TOTAL_FRAMES = {TOTAL_FRAMES}
WORKERS = {WORKERS}
SCALE = {SCALE}

with open('/content/render_job.log', 'w') as log_fp:
    def write_log(m):
        log_fp.write(m + "\\n")
        log_fp.flush()

    write_log(f"Job started for {{EPISODE}}: {{TOTAL_FRAMES}} frames across {{WORKERS}} workers")

    # 1. Bake plan
    p_bake = subprocess.run(['python3', 'tools/film_plan.py', 'check', f'episodes/{{EPISODE}}/film.json'], cwd='/content/ricks-clips', capture_output=True, text=True)
    write_log("Plan check: " + ("OK" if p_bake.returncode == 0 else p_bake.stderr[:200]))

    # 2. Env
    env = os.environ.copy()
    env['LD_LIBRARY_PATH'] = '/usr/lib64-nvidia:' + env.get('LD_LIBRARY_PATH', '')
    env['__GLX_VENDOR_LIBRARY_NAME'] = 'nvidia'
    env['__EGL_VENDOR_LIBRARY_FILENAMES'] = '/usr/share/glvnd/egl_vendor.d/10_nvidia.json'

    # Clean old
    subprocess.run("rm -rf /tmp/film_frames_* /content/chunk_emu_*.mp4 /content/chunks_emu.txt /content/{{EPISODE}}_full_episode_1080p.mp4", shell=True)

    # 3. Launch workers
    slice_size = TOTAL_FRAMES // WORKERS
    ranges = []
    for i in range(WORKERS):
        start = i * slice_size
        end = (i + 1) * slice_size - 1 if i < WORKERS - 1 else TOTAL_FRAMES - 1
        ranges.append((start, end))

    t0 = time.time()
    processes = []
    for i, (start, end) in enumerate(ranges):
        out_chunk = f"/content/chunk_emu_{{i}}.mp4"
        log_file = f"/content/worker_emu_{{i}}.log"
        cmd = f'xvfb-run -a -s "-screen 0 1080x1920x24" node templates/threejs_film/render.mjs episodes/{{EPISODE}}/film.json --animatic --range {{start}}-{{end}} --scale {{SCALE}} --no-audio --out {{out_chunk}} > {{log_file}} 2>&1'
        p = subprocess.Popen(cmd, shell=True, cwd='/content/ricks-clips', env=env)
        processes.append((i, p, out_chunk, log_file, start, end))
        write_log(f"Worker {{i+1}} launched: frames {{start}} -> {{end}} (PID {{p.pid}})")

    for i, p, out_chunk, log_file, start, end in processes:
        p.wait()
        size = os.path.getsize(out_chunk) if os.path.exists(out_chunk) else 0
        write_log(f"Worker {{i+1}} finished (Code {{p.returncode}}): {{size/(1024*1024):.2f}} MB")

    elapsed = time.time() - t0
    write_log(f"All workers completed in {{elapsed:.1f}}s")

    # 4. FFmpeg concat
    final_video = f"/content/{{EPISODE}}_full_episode_1080p.mp4"
    with open("/content/chunks_emu.txt", "w") as f:
        for i in range(WORKERS):
            f.write(f"file '/content/chunk_emu_{{i}}.mp4'\\n")

    voice_path = f"/content/ricks-clips/episodes/{{EPISODE}}/sound/final_audio.wav"
    if not os.path.exists(voice_path):
        voice_path = f"/content/ricks-clips/episodes/{{EPISODE}}/voice/voice.wav"

    concat_cmd = f"ffmpeg -y -f concat -safe 0 -i /content/chunks_emu.txt -i '{{voice_path}}' -c:v copy -c:a aac -af apad -shortest '{{final_video}}'"
    p_mux = subprocess.run(concat_cmd, shell=True, capture_output=True, text=True)
    write_log(f"FFmpeg mux: returncode {{p_mux.returncode}}")

    if os.path.exists(final_video) and os.path.getsize(final_video) > 1000:
        mb = os.path.getsize(final_video) / (1024*1024)
        write_log(f"RENDER_COMPLETE: {{final_video}} ({{mb:.2f}} MB)")
    else:
        write_log("RENDER_FAILED")
'''

with open('/content/render_job.py', 'w') as f:
    f.write(render_script)

p = subprocess.Popen(['nohup', 'python3', '/content/render_job.py'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
print(f"DISPATCHED_PID_{{p.pid}}")
"""

out_deploy = exec_code(deploy_code, timeout_sec=30)
log(f"Deploy status: {out_deploy.strip()}")

# 4. Live Monitoring Loop (up to 30 minutes, isolated session)
log("Step 4/5: Monitoring live GPU render progress...")
start_monitor = time.time()
poll_session = f"{runtime_name}/sessions/poll_status_session"

poll_code = r"""
import os, glob
dirs = sorted(glob.glob("/tmp/film_frames_*"))
total_frames = sum(len(glob.glob(d + "/*.png")) for d in dirs)
done = os.path.exists('/content/emu-war_full_episode_1080p.mp4')
size = os.path.getsize('/content/emu-war_full_episode_1080p.mp4') if done else 0
print(f"FRAMES={total_frames}|DONE={done}|SIZE={size}")
"""

completed = False
while time.time() - start_monitor < 1800: # 30 min max
    time.sleep(15)
    try:
        status_line = exec_code(poll_code, session_name=poll_session, timeout_sec=20).strip()
        if "FRAMES=" in status_line:
            parts = dict(kv.split("=", 1) for kv in status_line.split("|") if "=" in kv)
            frames = int(parts.get("FRAMES", 0))
            is_done = parts.get("DONE", "False") == "True"
            size = int(parts.get("SIZE", 0))
            elapsed = time.time() - start_monitor
            pct = min(100.0, (frames / TOTAL_FRAMES) * 100)
            log(f"Render progress: {frames}/{TOTAL_FRAMES} frames ({pct:.1f}%) | Elapsed: {elapsed:.0f}s")
            if is_done and size > 1000:
                log(f"Render completed on Colab! File size: {size/(1024*1024):.2f} MB ({size} bytes)")
                completed = True
                break
    except Exception as e:
        log(f"Poll notice: {e}")

if not completed:
    log("Render timed out or failed to produce output video.")
    sys.exit(1)

# 5. Chunked Download (3MB slices)
log("Step 5/5: Downloading completed 1080p video directly to your PC...")
prep_code = r"""
import subprocess, glob, os
subprocess.run("rm -rf /content/parts && mkdir -p /content/parts", shell=True)
subprocess.run("split -b 3M -d /content/emu-war_full_episode_1080p.mp4 /content/parts/chunk_", shell=True)
parts = sorted(glob.glob("/content/parts/chunk_*"))
print("PARTS_COUNT=" + str(len(parts)))
"""

out_parts = exec_code(prep_code, session_name=poll_session, timeout_sec=30)
count_line = [l for l in out_parts.splitlines() if "PARTS_COUNT=" in l]
if not count_line:
    log("Failed to split video on Colab.")
    sys.exit(1)

num_parts = int(count_line[0].split("=")[1])
log(f"Downloading {num_parts} parts from Colab...")

all_bytes = bytearray()
for i in range(num_parts):
    part_file = f"/content/parts/chunk_{i:02d}"
    get_part_code = f"""
import base64
with open('{part_file}', 'rb') as f:
    print(base64.b64encode(f.read()).decode('ascii'))
"""
    raw_b64 = exec_code(get_part_code, session_name=poll_session, timeout_sec=30).strip()
    part_bytes = base64.b64decode(raw_b64)
    all_bytes.extend(part_bytes)
    log(f"  Part {i+1}/{num_parts} retrieved ({len(part_bytes):,} bytes)")

out1 = r"c:\Users\PC\Downloads\ricks clips\emu-war_full_episode_1080p.mp4"
out2 = r"C:\Users\PC\Downloads\ricks clips\github_render_repo\episodes\emu-war\out\emu-war_full_episode_1080p.mp4"
out3 = r"c:\Users\PC\Downloads\ricks clips\episodes\great-emu-war\final_short.mp4"
os.makedirs(os.path.dirname(out2), exist_ok=True)

with open(out1, "wb") as f:
    f.write(all_bytes)
with open(out2, "wb") as f:
    f.write(all_bytes)
with open(out3, "wb") as f:
    f.write(all_bytes)

log(f"SUCCESS! Full video downloaded locally: {len(all_bytes):,} bytes -> {out1}")
