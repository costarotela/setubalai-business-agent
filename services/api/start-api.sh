#!/bin/bash
cd /home/admin/setubalai-agente/services/api
if [ -f "venv/bin/activate" ]; then
  source venv/bin/activate
fi
exec python3 -m uvicorn main:app --host 0.0.0.0 --port 3010
