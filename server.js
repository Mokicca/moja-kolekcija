require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cors());

// Konekcija na bazu (dodat ćemo ovo kasnije na Renderu)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Baza spojena!'))
  .catch(err => console.error(err));

// Modeli (Seme baze)
const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
});
const User = mongoose.model('User', UserSchema);

const PostSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: String,
  createdAt: { type: Date, default: Date.now }
});
const Post = mongoose.model('Post', PostSchema);

// Rute

// 1. Registracija
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashedPassword });
    res.json({ status: 'ok' });
  } catch (err) {
    res.json({ status: 'error', error: 'Korisnik već postoji' });
  }
});

// 2. Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) {
    return res.json({ status: 'error', error: 'Korisnik ne postoji' });
  }
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (isPasswordValid) {
    const token = jwt.sign({ name: username }, 'tajni_kljuc_123'); // U produkciji koristi process.env.JWT_SECRET
    return res.json({ status: 'ok', user: token });
  } else {
    return res.json({ status: 'error', user: false });
  }
});

// 3. Dohvaćanje postova (za Recommended stranicu)
app.get('/api/posts', async (req, res) => {
  const posts = await Post.find({}).sort({ createdAt: -1 }); // Najnoviji prvi
  res.json(posts);
});

// 4. Dodavanje posta (opcionalno, za testiranje)
app.post('/api/posts', async (req, res) => {
    const { title, content, author } = req.body;
    try {
        await Post.create({ title, content, author });
        res.json({ status: 'ok' });
    } catch (err) {
        res.json({ status: 'error' });
    }
});

app.listen(5000, () => {
  console.log('Server radi na portu 5000');
});
