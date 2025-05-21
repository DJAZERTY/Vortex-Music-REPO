const express = require('express');
const cors = require('cors');
const fs = require('fs');
const csv = require('csv-parser');
const { parse } = require('json2csv');

const app = express();
const CSV_PATH = 'db.csv';

app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// Route GET /data : retourne tout le CSV converti en JSON
app.get('/data', (req, res) => {
  const results = [];
  fs.createReadStream(CSV_PATH)
    .pipe(csv())
    .on('data', (data) => {
      // Conversion des types utiles ici
      data.PlayCount = parseInt(data.PlayCount || '0', 10);
      data.ReleaseDate = new Date(data.ReleaseDate);
      results.push(data);
    })
    .on('end', () => res.json(results))
    .on('error', (err) => res.status(500).json({ error: 'Erreur lecture CSV.' }));
});

// Route POST /increment : incrémente PlayCount de la chanson donnée
app.post('/increment', (req, res) => {
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Titre manquant.' });
  }

  let data = [];

  fs.createReadStream(CSV_PATH)
    .pipe(csv())
    .on('data', (row) => {
      // Parse PlayCount en entier pour pouvoir incrémenter
      row.PlayCount = parseInt(row.PlayCount || '0', 10);
      data.push(row);
    })
    .on('end', () => {
      let found = false;

      data = data.map((row) => {
        if (row.Title === title) {
          found = true;
          row.PlayCount += 1;  // incrément numérique
        }
        return row;
      });

      if (!found) {
        return res.status(404).json({ error: 'Chanson non trouvée.' });
      }

      try {
        // Convertit à nouveau PlayCount en chaîne car CSV est texte
        data = data.map(row => ({
          ...row,
          PlayCount: row.PlayCount.toString(),
          ReleaseDate: row.ReleaseDate.toISOString().slice(0,10) // pour garder format AAAA-MM-JJ simple
        }));

        const updatedCsv = parse(data, { fields: Object.keys(data[0]) });

        fs.writeFile(CSV_PATH, updatedCsv, (err) => {
          if (err) {
            return res.status(500).json({ error: 'Erreur lors de l\'écriture du CSV.' });
          }
          return res.json({ message: `PlayCount incrémenté pour "${title}".` });
        });
      } catch (err) {
        return res.status(500).json({ error: 'Erreur lors de la conversion CSV.' });
      }
    })
    .on('error', () => res.status(500).json({ error: 'Erreur lecture CSV.' }));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
