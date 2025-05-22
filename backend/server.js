require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');

//Mongoose models
const Player = require('./models/Player');
const Team = require('./models/Team');

//Import MLService
const MLService = require('./services/mlService');

const app = express();

app.use(cors());
app.use(express.json());

//Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

//Search Route (players + teams)
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.json({ players: [], teams: [] });
  }

  try {
    //Case-insensitive search 
    const players = await Player.find({
      name: { $regex: q, $options: 'i' }
    });

    const teams = await Team.find({
      name: { $regex: q, $options: 'i' }
    });

    res.json({ players, teams });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Get Single Player by ID
app.get('/api/player/:id', async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    res.json(player);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Get Single Team by ID
app.get('/api/team/:id', async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Get Players by tid or All Players
app.get('/api/players', async (req, res) => {
  const { tid } = req.query;
  try {
    let players;
    if (tid !== undefined) {
      players = await Player.find({ tid: Number(tid) });
    } else {
      players = await Player.find({});
    }
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/teams', async (req, res) => {
  try {
    const teams = await Team.find({});
    res.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/predict/points', async (req, res) => {
    try {
        const { playerData } = req.body;
        if (!playerData || !playerData.playerId) {
            throw new Error('Invalid player data');
        }

        // Call the MLService for prediction
        const predictionData = await MLService.predictPoints(playerData);
        res.json(predictionData);
    } catch (error) {
        console.error('Prediction API error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/news', async (req, res) => {
  try {
    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: 'NBA',
        language: 'en',
        sortBy: 'publishedAt',
        apiKey: process.env.NEWS_API_KEY,
        pageSize: 10
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

//Starts the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
