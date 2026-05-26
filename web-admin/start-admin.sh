#!/bin/bash
export PATH=/home/admin/.nvm/versions/node/v22.22.2/bin:$PATH
export PORT=3012
export NODE_ENV=production
cd /home/admin/setubalai-agente/web-admin
exec npm start
