from pathlib import Path
from PIL import Image

root = Path(__file__).parent
for d in sorted(root.glob('*_walk_png')):
    frames = [Image.open(p).convert('RGBA') for p in sorted(d.glob('frame_*.png'))]
    if len(frames) == 8:
        frames[0].save(root / f'{d.name[:-9]}_walk.gif', save_all=True,
                       append_images=frames[1:], duration=110, loop=0, disposal=2)
        print('wrote', d.name[:-9] + 'walk.gif')
