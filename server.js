{\rtf1\ansi\ansicpg1252\cocoartf2709
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 const express = require('express');\
const path = require('path');\
\
const app = express();\
\
// Serve the static files from the React app\
app.use(express.static(path.join(__dirname, 'build')));\
\
// Handles any requests that don't match the ones above\
app.get('*', (req, res) => \{\
  res.sendFile(path.join(__dirname, 'build', 'index.html'));\
\});\
\
// Heroku will dynamically assign a port\
const PORT = process.env.PORT || 5000;\
\
app.listen(PORT, () => \{\
  console.log(`Server is running on port $\{PORT\}`);\
\});\
}