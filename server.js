// server.js
const express = require('express');
const bodyParser = require('body-parser');
const {MongoClient} = require('mongodb');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const MONGO = process.env.MONGO || 'mongodb://localhost:27017';
const DBNAME = process.env.DBNAME || 'qr_feedback';
let db;

MongoClient.connect(MONGO, {useUnifiedTopology:true}).then(client=>{
  db = client.db(DBNAME);
  console.log('DB connected');
}).catch(err=>{console.error('DB err',err);process.exit(1)});

app.post('/api/feedback', async (req,res)=>{
  try{
    const {brand,service, ticket, rating, comment, ts, ua} = req.body;
    if(!service || !rating) return res.status(400).json({error:'Missing fields'});
    const doc = {brand,service,ticket,rating: Number(rating),comment:comment||'',ts:ts||new Date().toISOString(),ua};
    await db.collection('feedbacks').insertOne(doc);
    res.json({ok:true});
  }catch(e){ console.error(e); res.status(500).json({error:'Server error'}); }
});

// Admin endpoint — PRODUCTION: protect with auth (API key/basic auth)
app.get('/admin/feedbacks', async (req,res)=>{
  try{
    const rows = await db.collection('feedbacks').find().sort({ts:-1}).limit(1000).toArray();
    res.json(rows);
  }catch(e){ console.error(e); res.status(500).json({error:'Server error'}); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log('Server running on',PORT));