#!/bin/zsh
cd -- "$(dirname -- "$0")"
exec python3 website-source/c09-viewer/serve.py --port 8809 --open
